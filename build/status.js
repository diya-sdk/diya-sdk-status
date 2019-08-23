(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))

},{"./debug":2,"_process":5}],2:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  return debug;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":4}],3:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],4:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],5:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],6:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],7:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],8:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":7,"_process":5,"inherits":6}],9:[function(require,module,exports){
'use strict';

/*
 * Copyright : Partnering 3.0 (2007-2016)
 * Author : Sylvain Mahé <sylvain.mahe@partnering.fr>
 *
 * This file is part of diya-sdk.
 *
 * diya-sdk is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * diya-sdk is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with diya-sdk.  If not, see <http://www.gnu.org/licenses/>.
 */

/* maya-client
 * Copyright (c) 2014, Partnering Robotics, All rights reserved.
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; version
 *	3.0 of the License. This library is distributed in the hope
 * that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 * PURPOSE. See the GNU Lesser General Public License for more details.
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library.
 */
(function () {
	var debug = require('debug')('status');
	var Watcher = require('./watcher.js');

	var isBrowser = !(typeof window === 'undefined');
	if (!isBrowser) {
		var Promise = require('bluebird');
	} else {
		var Promise = window.Promise;
	}
	var DiyaSelector = d1.DiyaSelector;
	var util = require('util');

	//////////////////////////////////////////////////////////////
	/////////////////// Logging utility methods //////////////////
	//////////////////////////////////////////////////////////////

	var DEBUG = true;
	var Logger = {
		log: function log(message) {
			if (DEBUG) console.log(message);
		},

		error: function error(message) {
			if (DEBUG) console.error(message);
		}
	};

	/**
  *	callback : function called after model updated
  * */
	function Status(selector) {
		this.selector = selector;
		this._coder = selector.encode();
		this.watchers = [];

		/** model of robot : available parts and status **/
		this.robotModel = [];
		return this;
	};

	/**
  * Subscribe to error/status updates
  */
	Status.prototype.watch = function (options, callback) {
		var _this = this;

		// do not create watcher without a callback
		if (callback == null || typeof callback !== 'function') {
			return null;
		}

		var watcher = new Watcher(this.selector, options);

		// add watcher in watcher list
		this.watchers.push(watcher);

		watcher.on('data', function (data) {
			debug(data);
			callback(_this._getRobotModelFromRecv2(data.parts, data.robotId, data.robotName), data.peerId);
		});
		watcher.on('stop', this._removeWatcher);

		return watcher;
	};

	/**
  * Callback to remove watcher from list
  * @param watcher to be removed
  */
	Status.prototype._removeWatcher = function (watcher) {
		// find and remove watcher in list
		this.watchers.find(function (el, id, watchers) {
			if (watcher === el) {
				watchers.splice(id, 1); // remove
				return true;
			}
			return false;
		});
	};

	/**
  * Stop all watchers
  */
	Status.prototype.closeSubscriptions = function () {
		console.warn('Deprecated function use stopWatchers instead');
		this.stopWatchers();
	};

	Status.prototype.stopWatchers = function () {
		var _this2 = this;

		this.watchers.forEach(function (watcher) {
			// remove listener on stop event to avoid purging watchers twice
			watcher.removeListener('stop', _this2._removeWatcher);
			watcher.stop();
		});
		this.watchers = [];
	};

	/**
  * Update internal robot model with received data (version 2)
  * @param  {Array of Array of PartInfo (struct)} data data received from
  *                                                    DiyaNode by websocket
  * @param  {int} robotId id of the robot
  * @param  {string} robotName name of the robot
  * @return {[type]}		[description]
  */
	Status.prototype._getRobotModelFromRecv2 = function (data, robotId, robotName) {
		var _this3 = this;

		if (this.robotModel == null) this.robotModel = [];

		if (this.robotModel[robotId] != null) this.robotModel[robotId].parts = {}; // reset parts

		if (this.robotModel[robotId] == null) this.robotModel[robotId] = {};

		this.robotModel[robotId] = {
			robot: {
				name: robotName
			}
		};

		/** extract parts info **/
		this.robotModel[robotId].parts = {};
		var rParts = this.robotModel[robotId].parts;

		data.forEach(function (d) {
			var partId = d[0];
			var category = d[1];
			var partName = d[2];
			var label = d[3];
			var time = d[4];
			var code = d[5];
			var codeRef = d[6];
			var msg = d[7];
			var critLevel = d[8];
			var description = d[9];

			if (rParts[partId] == null) {
				rParts[partId] = {};
			}
			/* update part category */
			rParts[partId].category = category;
			/* update part name */
			rParts[partId].name = partName.toLowerCase();
			/* update part label */
			rParts[partId].label = label;

			/* update error */
			/** update errorList **/
			if (rParts[partId].errorList == null) rParts[partId].errorList = {};

			if (rParts[partId].errorList[codeRef] == null) rParts[partId].errorList[codeRef] = {
				msg: msg,
				critLevel: critLevel,
				description: description
			};
			var evts_tmp = {
				time: _this3._coder.from(time),
				code: _this3._coder.from(code),
				codeRef: _this3._coder.from(codeRef)
			};
			if (rParts[partId].evts == null) {
				rParts[partId].evts = [];
			}
			rParts[partId].evts.push(evts_tmp);
		});
		return this.robotModel;
	};

	/** create Status service **/
	DiyaSelector.prototype.Status = function () {
		return new Status(this);
	};

	/**
  * Set on status
  * @param robotName to find status to modify
  * @param partName 	to find status to modify
  * @param code		newCode
  * @param source		source
  * @param callback		return callback (<bool>success)
  */
	DiyaSelector.prototype.setStatus = function (robotName, partName, code, source, callback) {
		var _this4 = this;

		return Promise.try(function (_) {
			var objectPath = "/fr/partnering/Status/Robots/" + _this4.splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
			_this4.request({
				service: "status",
				func: "SetPart",
				obj: {
					interface: 'fr.partnering.Status.Part',
					path: objectPath
				},
				data: {
					//robotName: robotName,
					code: code,
					//partName: partName,
					source: source | 1
				}
			}, _this4.onSetPart.bind(_this4, callback));
		}).catch(function (err) {
			Logger.error(err);
		});
	};

	/**
  * Callback on SetPart
  */
	Status.prototype.onSetPart = function (callback, peerId, err, data) {
		if (err != null) {
			if (typeof callback === 'function') callback(false);
		} else {
			if (typeof callback === 'function') callback(true);
		}
	};

	/**
  * Get one status
  * @param robotName to get status
  * @param partName 	to get status
  * @param callback		return callback(-1 if not found/data otherwise)
  * @param _full 	more data about status
  */
	Status.prototype.getStatus = function (robotName, partName, callback /*, _full*/) {
		var _this5 = this;

		return Promise.try(function (_) {
			_this5.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager'
				}
			}, _this5.onGetManagedObjectsGetStatus.bind(_this5, robotName, partName, callback));
		}).catch(function (err) {
			Logger.error(err);
		});
	};

	/**
  * Callback on GetManagedObjects in GetStatus
  */
	Status.prototype.onGetManagedObjectsGetStatus = function (robotName, partName, callback, peerId, err, data) {
		var objectPathRobot = "/fr/partnering/Status/Robots/" + this.splitAndCamelCase(robotName, "-");
		var objectPathPart = "/fr/partnering/Status/Robots/" + this.splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
		var robotId = data[objectPathRobot]['fr.partnering.Status.Robot'].RobotId;
		this.selector.request({
			service: "status",
			func: "GetPart",
			obj: {
				interface: 'fr.partnering.Status.Part',
				path: objectPathPart
			}
		}, this.onGetPart.bind(this, robotId, robotName, callback));
	};

	/**
  * Callback on GetPart
  */
	Status.prototype.onGetPart = function (robotId, robotName, callback, peerId, err, data) {
		var sendData = [];
		sendData.push(data);
		this._getRobotModelFromRecv2(sendData, robotId, robotName);
		if (err != null) {
			if (typeof callback === 'function') callback(-1);
		} else {
			if (typeof callback === 'function') callback(this.robotModel);
		}
	};

	/**
  * Get all status
  * @param robotName to get status
  * @param partName 	to get status
  * @param callback		return callback(-1 if not found/data otherwise)
  * @param _full 	more data about status
  */
	Status.prototype.getAllStatuses = function (robotName, callback) {
		this.selector.request({
			service: 'status',
			func: 'GetManagedObjects',
			obj: {
				interface: 'org.freedesktop.DBus.ObjectManager'
			}
		}, this.onGetManagedObjectsGetAllStatuses.bind(this, robotName, callback));
	};

	/**
  * Callback on GetManagedObjects in GetAllStatuses
  */
	Status.prototype.onGetManagedObjectsGetAllStatuses = function (robotName, callback, peerId, err, data) {
		var objectPath = "/fr/partnering/Status/Robots/" + this.splitAndCamelCase(robotName, "-");
		if (data[objectPath] != null) {
			if (data[objectPath]['fr.partnering.Status.Robot'] != null) {
				var robotId = data[objectPath]['fr.partnering.Status.Robot'].RobotId;
				//var full = _full || false;
				this.selector.request({
					service: "status",
					func: "GetAllParts",
					obj: {
						interface: 'fr.partnering.Status.Robot',
						path: objectPath
					}
				}, this.onGetAllParts.bind(this, robotId, robotName, callback));
			} else {
				Logger.error("Interface fr.partnering.Status.Robot doesn't exist!");
			}
		} else {
			Logger.error("ObjectPath " + objectPath + " doesn't exist!");
		}
	};

	/**
  * Callback on GetAllParts
  */
	Status.prototype.onGetAllParts = function (robotId, robotName, callback, peerId, err, data) {
		if (err != null) {
			if (typeof callback === 'function') callback(-1);
			throw new Error(err);
		} else {
			this._getRobotModelFromRecv2(data, robotId, robotName);
			if (typeof callback === 'function') callback(this.robotModel);
		}
	};

	Status.prototype.splitAndCamelCase = function (inString, delimiter) {
		var arraySplitString = inString.split(delimiter);
		var outCamelString = '';
		arraySplitString.forEach(function (str) {
			outCamelString += str.charAt(0).toUpperCase() + str.substring(1);
		});
		return outCamelString;
	};
})();

},{"./watcher.js":10,"bluebird":undefined,"debug":1,"util":8}],10:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('eventemitter3');
var debug = require('debug')('status:watcher');
var debugError = require('debug')('status:watcher:errors');
//! const getTimeSampling = require('./timecontrol.js').getTimeSampling;

'use strict';

var StopCondition = function (_Error) {
	_inherits(StopCondition, _Error);

	function StopCondition(msg) {
		_classCallCheck(this, StopCondition);

		var _this = _possibleConstructorReturn(this, (StopCondition.__proto__ || Object.getPrototypeOf(StopCondition)).call(this, msg));

		_this.name = 'StopCondition';
		return _this;
	}

	return StopCondition;
}(Error);

var Watcher = function (_EventEmitter) {
	_inherits(Watcher, _EventEmitter);

	/**
  * @param emit emit data (mandatory)
  * @param config to get data from server
  */
	function Watcher(selector, options) {
		_classCallCheck(this, Watcher);

		var _this2 = _possibleConstructorReturn(this, (Watcher.__proto__ || Object.getPrototypeOf(Watcher)).call(this));

		_this2.selector = selector;
		_this2.subscriptions = [];
		_this2.state = 'running';

		_this2.reconnectionPeriod = 0; // initial period between reconnections
		_this2.maxReconnectionPeriod = 60000; // max 1 min

		// Increase number of listeners (SHOULD BE AVOIDED)
		_this2.selector.setMaxListeners(0);
		_this2.selector._connection.setMaxListeners(0);

		/** initialise options for request **/
		if (options.signal == null) {
			options.signal = 'StatusesBuffered';
		}

		_this2._statusesDictionary = {};
		debug(options);

		_this2.watch(options); // start watcher
		return _this2;
	}

	_createClass(Watcher, [{
		key: 'watch',
		value: function watch(options) {
			var _this3 = this;

			debug('in watch');
			new Promise(function (resolve, reject) {
				_this3.selector.request({
					service: 'status',
					func: 'GetManagedObjects',
					obj: {
						interface: 'org.freedesktop.DBus.ObjectManager'
					}
				}, function (peerId, err, data) {
					if (err != null) {
						reject(err);
						return;
					}
					if (_this3.state === 'stopped') {
						reject(new StopCondition());
						return;
					}
					debug('Request:emitData');
					// Parse status data
					debug(data);
					data = _this3._parseGetManagedObjectsData(data);
					debug(data);
					for (var deviceName in data.devices) {
						var device = data.devices[deviceName];
						if (device.parts.length === 0) {
							// TODO there should be a signal indicating
							// that the objects paths has all be loaded...
							// Indeed, the parts may not have been loaded yet
							reject('Error: No part yet');
							return;
						}
						var dataToEmit = {
							parts: device.parts,
							robotId: device.robotId,
							robotName: device.robotName,
							peerId: peerId
							// Sending part data device (robot) by device
						};_this3.emit('data', dataToEmit);
					}
					resolve();
				});
			}).then(function () {
				return new Promise(function (resolve, reject) {
					_this3.selector.request({
						service: 'status',
						func: 'Get',
						obj: {
							interface: 'org.freedesktop.DBus.Properties',
							path: '/fr/partnering/Status'
						},
						data: {
							interface_name: 'fr.partnering.Status',
							property_name: 'StatusesDictionary'
						}
					}, function (peerId, err, data) {
						if (err != null) {
							reject(err);
							return;
						}
						if (_this3.state === 'stopped') {
							reject(new StopCondition());
							return;
						}
						if (data != null) {
							_this3._statusesDictionary = data;
						} else {
							reject('No StatusesDictionary data');
							return;
						}
						resolve();
					});
				});
			}).then(function () {
				debug('Subscribing');
				return new Promise(function (resolve, reject) {
					var subscription = _this3.selector.subscribe({
						service: "status",
						func: options.signal
					}, function (peerId, err, data) {
						if (err != null) {
							reject(err);
							return;
						}
						if (data != null) {
							data = _this3._parseStatusChangedData(data[0]);
							for (var deviceName in data.devices) {
								var device = data.devices[deviceName];
								var dataToEmit = {
									parts: device.parts,
									robotId: device.robotId,
									robotName: device.robotName,
									peerId: peerId
								};
								_this3.emit('data', dataToEmit);
							}
						}
						_this3.reconnectionPeriod = 0; // reset period on subscription requests
						resolve();
					});
					_this3.subscriptions.push(subscription);
				});
			}).catch(function (err) {
				// watcher stopped : do nothing
				if (err.name === 'StopCondition') {
					return;
				}
				// try to restart later
				debugError(err);
				_this3._closeSubscriptions(); // should not be necessary
				// increase delay by 1 sec
				_this3.reconnectionPeriod = _this3.reconnectionPeriod + 1000;
				if (_this3.reconnectionPeriod > _this3.maxReconnectionPeriod) {
					// max 5min
					_this3.reconnectionPeriod = _this3.maxReconnectionPeriod;
				}
				_this3.watchTentative = setTimeout(function () {
					_this3.watch(options);
				}, _this3.reconnectionPeriod); // try again later
			});
		}

		/**
   * Parse objectManager introspect data to feed back status manager
   *
   * @param {Object} data raw data from getManagedObjects
   * @return {Object{String,String,Array of Array of PartInfo} parsedData
   */

	}, {
		key: '_parseGetManagedObjectsData',
		value: function _parseGetManagedObjectsData(data) {
			var parsedData = {
				devices: {}
			};
			if (data == null) {
				return parsedData;
			}

			// For each object path
			for (var path in data) {
				var obj = data[path];
				var splitPath = path.split('/');
				if (splitPath.length === 6) {
					// with device path, split path has 6 items
					for (var iface in obj) {
						if (iface === "fr.partnering.Status.Robot") {
							// Interface of the device objects
							var device = obj[iface];
							// Find product name and id
							var robotName = splitPath[5].toLowerCase();
							var selDevice = parsedData.devices[robotName];
							if (selDevice == null) {
								selDevice = {
									parts: []
								};
								parsedData.devices[robotName] = selDevice;
							}
							selDevice.robotName = device.RobotName;
							selDevice.robotId = device.RobotId;
						}
					}
				} else if (splitPath.length === 8) {
					// with part path, split path has 8 items
					for (var _iface in obj) {
						if (_iface === "fr.partnering.Status.Part") {
							// Interface of the part objects
							var part = obj[_iface];
							// Find product name
							var _robotName = splitPath[5].toLowerCase();
							var _selDevice = parsedData.devices[_robotName];
							if (_selDevice == null) {
								_selDevice = {
									parts: []
								};
								parsedData.devices[_robotName] = _selDevice;
							}
							// Build part array
							// TODO optimize how the data are used :
							// actually converting object to array then
							// from array to object again...
							var newPart = [];
							newPart[0] = part.PartId;
							newPart[1] = part.Category;
							newPart[2] = part.PartName;
							newPart[3] = ""; // Label is unused in practice
							newPart[4] = part.Time;
							newPart[5] = part.Code;
							newPart[6] = part.CodeRef;
							newPart[7] = part.Msg;
							newPart[8] = part.CritLevel;
							newPart[9] = ""; // Description is unused in practice

							_selDevice.parts.push(newPart);
						}
					}
				} else {
					debugError("Undefined path format");
				}
			}

			// Read Robot name and robot Id
			// Read Part data
			return parsedData;
		}
	}, {
		key: '_parseStatusChangedData',
		value: function _parseStatusChangedData(data) {
			var _this4 = this;

			var parsedData = {};
			data.forEach(function (event) {
				var robotName = event[0];
				var robotId = event[1];
				var time = event[2];
				var statusEventId = event[3];
				var code = event[4];
				var robotNameLowerCase = robotName.toLowerCase();
				if (_this4._statusesDictionary[statusEventId][0] !== statusEventId) {
					console.error("Malformed statuses dictionary");
					return;
				}
				var partId = _this4._statusesDictionary[statusEventId][1];
				var codeRef = _this4._statusesDictionary[statusEventId][2];
				var partName = _this4._statusesDictionary[statusEventId][3];
				var category = _this4._statusesDictionary[statusEventId][4];
				var msg = _this4._statusesDictionary[statusEventId][5];
				var critLevel = _this4._statusesDictionary[statusEventId][6];
				var label = ""; // Label is unused in practice
				var description = ""; // Description is unused in practice
				if (parsedData.devices == null) {
					parsedData.devices = [];
				}
				if (parsedData.devices[robotNameLowerCase] == null) {
					parsedData.devices[robotNameLowerCase] = {};
				}
				parsedData.devices[robotNameLowerCase].robotId = robotId;
				parsedData.devices[robotNameLowerCase].robotName = robotName;
				if (parsedData.devices[robotNameLowerCase].parts == null) {
					parsedData.devices[robotNameLowerCase].parts = [];
				}
				var newPart = [];
				newPart[0] = partId;
				newPart[1] = category;
				newPart[2] = partName;
				newPart[3] = label;
				newPart[4] = time;
				newPart[5] = code;
				newPart[6] = codeRef;
				newPart[7] = msg;
				newPart[8] = critLevel;
				newPart[9] = description;
				parsedData.devices[robotNameLowerCase].parts.push(newPart);
			});
			return parsedData;
		}

		// Close all subscriptions if any

	}, {
		key: '_closeSubscriptions',
		value: function _closeSubscriptions() {
			debug('In closeSubscription');
			for (var i in this.subscriptions) {
				this.subscriptions[i].close();
			}
			this.subscriptions = [];
		}
	}, {
		key: 'stop',
		value: function stop() {
			debug('In stop');
			this.state = 'stopped';
			if (this.watchTentative != null) {
				clearTimeout(this.watchTentative);
			}
			this._closeSubscriptions();
			this.emit('stop');
			this.removeAllListeners();
		}
	}]);

	return Watcher;
}(EventEmitter);

module.exports = Watcher;

},{"debug":1,"eventemitter3":3}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvZGVidWcvc3JjL2RlYnVnLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJzcmMvc3RhdHVzLmpzIiwic3JjL3dhdGNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDekxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDMWtCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF3QkE7Ozs7Ozs7Ozs7OztBQVlBLENBQUMsWUFBVTtBQUNWLEtBQU0sUUFBUSxRQUFRLE9BQVIsRUFBaUIsUUFBakIsQ0FBZDtBQUNBLEtBQUksVUFBVSxRQUFRLGNBQVIsQ0FBZDs7QUFFQSxLQUFJLFlBQVksRUFBRSxPQUFPLE1BQVAsS0FBa0IsV0FBcEIsQ0FBaEI7QUFDQSxLQUFJLENBQUMsU0FBTCxFQUFnQjtBQUFFLE1BQUksVUFBVSxRQUFRLFVBQVIsQ0FBZDtBQUFvQyxFQUF0RCxNQUNLO0FBQUUsTUFBSSxVQUFV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ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBUaGlzIGlzIHRoZSB3ZWIgYnJvd3NlciBpbXBsZW1lbnRhdGlvbiBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcbmV4cG9ydHMuc2F2ZSA9IHNhdmU7XG5leHBvcnRzLmxvYWQgPSBsb2FkO1xuZXhwb3J0cy51c2VDb2xvcnMgPSB1c2VDb2xvcnM7XG5leHBvcnRzLnN0b3JhZ2UgPSAndW5kZWZpbmVkJyAhPSB0eXBlb2YgY2hyb21lXG4gICAgICAgICAgICAgICAmJiAndW5kZWZpbmVkJyAhPSB0eXBlb2YgY2hyb21lLnN0b3JhZ2VcbiAgICAgICAgICAgICAgICAgID8gY2hyb21lLnN0b3JhZ2UubG9jYWxcbiAgICAgICAgICAgICAgICAgIDogbG9jYWxzdG9yYWdlKCk7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuICAnbGlnaHRzZWFncmVlbicsXG4gICdmb3Jlc3RncmVlbicsXG4gICdnb2xkZW5yb2QnLFxuICAnZG9kZ2VyYmx1ZScsXG4gICdkYXJrb3JjaGlkJyxcbiAgJ2NyaW1zb24nXG5dO1xuXG4vKipcbiAqIEN1cnJlbnRseSBvbmx5IFdlYktpdC1iYXNlZCBXZWIgSW5zcGVjdG9ycywgRmlyZWZveCA+PSB2MzEsXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cbiAqIHRvIHN1cHBvcnQgXCIlY1wiIENTUyBjdXN0b21pemF0aW9ucy5cbiAqXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xuICovXG5cbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcbiAgLy8gTkI6IEluIGFuIEVsZWN0cm9uIHByZWxvYWQgc2NyaXB0LCBkb2N1bWVudCB3aWxsIGJlIGRlZmluZWQgYnV0IG5vdCBmdWxseVxuICAvLyBpbml0aWFsaXplZC4gU2luY2Ugd2Uga25vdyB3ZSdyZSBpbiBDaHJvbWUsIHdlJ2xsIGp1c3QgZGV0ZWN0IHRoaXMgY2FzZVxuICAvLyBleHBsaWNpdGx5XG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucHJvY2VzcyAmJiB3aW5kb3cucHJvY2Vzcy50eXBlID09PSAncmVuZGVyZXInKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBpcyB3ZWJraXQ/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE2NDU5NjA2LzM3Njc3M1xuICAvLyBkb2N1bWVudCBpcyB1bmRlZmluZWQgaW4gcmVhY3QtbmF0aXZlOiBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QtbmF0aXZlL3B1bGwvMTYzMlxuICByZXR1cm4gKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuV2Via2l0QXBwZWFyYW5jZSkgfHxcbiAgICAvLyBpcyBmaXJlYnVnPyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zOTgxMjAvMzc2NzczXG4gICAgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5jb25zb2xlICYmICh3aW5kb3cuY29uc29sZS5maXJlYnVnIHx8ICh3aW5kb3cuY29uc29sZS5leGNlcHRpb24gJiYgd2luZG93LmNvbnNvbGUudGFibGUpKSkgfHxcbiAgICAvLyBpcyBmaXJlZm94ID49IHYzMT9cbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1Rvb2xzL1dlYl9Db25zb2xlI1N0eWxpbmdfbWVzc2FnZXNcbiAgICAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSkgfHxcbiAgICAvLyBkb3VibGUgY2hlY2sgd2Via2l0IGluIHVzZXJBZ2VudCBqdXN0IGluIGNhc2Ugd2UgYXJlIGluIGEgd29ya2VyXG4gICAgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9hcHBsZXdlYmtpdFxcLyhcXGQrKS8pKTtcbn1cblxuLyoqXG4gKiBNYXAgJWogdG8gYEpTT04uc3RyaW5naWZ5KClgLCBzaW5jZSBubyBXZWIgSW5zcGVjdG9ycyBkbyB0aGF0IGJ5IGRlZmF1bHQuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbih2KSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHYpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gJ1tVbmV4cGVjdGVkSlNPTlBhcnNlRXJyb3JdOiAnICsgZXJyLm1lc3NhZ2U7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBDb2xvcml6ZSBsb2cgYXJndW1lbnRzIGlmIGVuYWJsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBcmdzKGFyZ3MpIHtcbiAgdmFyIHVzZUNvbG9ycyA9IHRoaXMudXNlQ29sb3JzO1xuXG4gIGFyZ3NbMF0gPSAodXNlQ29sb3JzID8gJyVjJyA6ICcnKVxuICAgICsgdGhpcy5uYW1lc3BhY2VcbiAgICArICh1c2VDb2xvcnMgPyAnICVjJyA6ICcgJylcbiAgICArIGFyZ3NbMF1cbiAgICArICh1c2VDb2xvcnMgPyAnJWMgJyA6ICcgJylcbiAgICArICcrJyArIGV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcblxuICBpZiAoIXVzZUNvbG9ycykgcmV0dXJuO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncy5zcGxpY2UoMSwgMCwgYywgJ2NvbG9yOiBpbmhlcml0JylcblxuICAvLyB0aGUgZmluYWwgXCIlY1wiIGlzIHNvbWV3aGF0IHRyaWNreSwgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBvdGhlclxuICAvLyBhcmd1bWVudHMgcGFzc2VkIGVpdGhlciBiZWZvcmUgb3IgYWZ0ZXIgdGhlICVjLCBzbyB3ZSBuZWVkIHRvXG4gIC8vIGZpZ3VyZSBvdXQgdGhlIGNvcnJlY3QgaW5kZXggdG8gaW5zZXJ0IHRoZSBDU1MgaW50b1xuICB2YXIgaW5kZXggPSAwO1xuICB2YXIgbGFzdEMgPSAwO1xuICBhcmdzWzBdLnJlcGxhY2UoLyVbYS16QS1aJV0vZywgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICBpZiAoJyUlJyA9PT0gbWF0Y2gpIHJldHVybjtcbiAgICBpbmRleCsrO1xuICAgIGlmICgnJWMnID09PSBtYXRjaCkge1xuICAgICAgLy8gd2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiB0aGUgKmxhc3QqICVjXG4gICAgICAvLyAodGhlIHVzZXIgbWF5IGhhdmUgcHJvdmlkZWQgdGhlaXIgb3duKVxuICAgICAgbGFzdEMgPSBpbmRleDtcbiAgICB9XG4gIH0pO1xuXG4gIGFyZ3Muc3BsaWNlKGxhc3RDLCAwLCBjKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIHRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LzksIHdoZXJlXG4gIC8vIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gIHJldHVybiAnb2JqZWN0JyA9PT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5zdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByID0gZXhwb3J0cy5zdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG5cbiAgLy8gSWYgZGVidWcgaXNuJ3Qgc2V0IGluIExTLCBhbmQgd2UncmUgaW4gRWxlY3Ryb24sIHRyeSB0byBsb2FkICRERUJVR1xuICBpZiAoIXIgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICdlbnYnIGluIHByb2Nlc3MpIHtcbiAgICByID0gcHJvY2Vzcy5lbnYuREVCVUc7XG4gIH1cblxuICByZXR1cm4gcjtcbn1cblxuLyoqXG4gKiBFbmFibGUgbmFtZXNwYWNlcyBsaXN0ZWQgaW4gYGxvY2FsU3RvcmFnZS5kZWJ1Z2AgaW5pdGlhbGx5LlxuICovXG5cbmV4cG9ydHMuZW5hYmxlKGxvYWQoKSk7XG5cbi8qKlxuICogTG9jYWxzdG9yYWdlIGF0dGVtcHRzIHRvIHJldHVybiB0aGUgbG9jYWxzdG9yYWdlLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugc2FmYXJpIHRocm93c1xuICogd2hlbiBhIHVzZXIgZGlzYWJsZXMgY29va2llcy9sb2NhbHN0b3JhZ2VcbiAqIGFuZCB5b3UgYXR0ZW1wdCB0byBhY2Nlc3MgaXQuXG4gKlxuICogQHJldHVybiB7TG9jYWxTdG9yYWdlfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbG9jYWxzdG9yYWdlKCkge1xuICB0cnkge1xuICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlO1xuICB9IGNhdGNoIChlKSB7fVxufVxuIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIGNvbW1vbiBsb2dpYyBmb3IgYm90aCB0aGUgTm9kZS5qcyBhbmQgd2ViIGJyb3dzZXJcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZURlYnVnLmRlYnVnID0gY3JlYXRlRGVidWdbJ2RlZmF1bHQnXSA9IGNyZWF0ZURlYnVnO1xuZXhwb3J0cy5jb2VyY2UgPSBjb2VyY2U7XG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xuZXhwb3J0cy5lbmFibGUgPSBlbmFibGU7XG5leHBvcnRzLmVuYWJsZWQgPSBlbmFibGVkO1xuZXhwb3J0cy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG4gKi9cblxuZXhwb3J0cy5uYW1lcyA9IFtdO1xuZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cbiAqXG4gKiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlciBvciB1cHBlci1jYXNlIGxldHRlciwgaS5lLiBcIm5cIiBhbmQgXCJOXCIuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzID0ge307XG5cbi8qKlxuICogUHJldmlvdXMgbG9nIHRpbWVzdGFtcC5cbiAqL1xuXG52YXIgcHJldlRpbWU7XG5cbi8qKlxuICogU2VsZWN0IGEgY29sb3IuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZWxlY3RDb2xvcihuYW1lc3BhY2UpIHtcbiAgdmFyIGhhc2ggPSAwLCBpO1xuXG4gIGZvciAoaSBpbiBuYW1lc3BhY2UpIHtcbiAgICBoYXNoICA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpICsgbmFtZXNwYWNlLmNoYXJDb2RlQXQoaSk7XG4gICAgaGFzaCB8PSAwOyAvLyBDb252ZXJ0IHRvIDMyYml0IGludGVnZXJcbiAgfVxuXG4gIHJldHVybiBleHBvcnRzLmNvbG9yc1tNYXRoLmFicyhoYXNoKSAlIGV4cG9ydHMuY29sb3JzLmxlbmd0aF07XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVzcGFjZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGNyZWF0ZURlYnVnKG5hbWVzcGFjZSkge1xuXG4gIGZ1bmN0aW9uIGRlYnVnKCkge1xuICAgIC8vIGRpc2FibGVkP1xuICAgIGlmICghZGVidWcuZW5hYmxlZCkgcmV0dXJuO1xuXG4gICAgdmFyIHNlbGYgPSBkZWJ1ZztcblxuICAgIC8vIHNldCBgZGlmZmAgdGltZXN0YW1wXG4gICAgdmFyIGN1cnIgPSArbmV3IERhdGUoKTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuICAgIHNlbGYuZGlmZiA9IG1zO1xuICAgIHNlbGYucHJldiA9IHByZXZUaW1lO1xuICAgIHNlbGYuY3VyciA9IGN1cnI7XG4gICAgcHJldlRpbWUgPSBjdXJyO1xuXG4gICAgLy8gdHVybiB0aGUgYGFyZ3VtZW50c2AgaW50byBhIHByb3BlciBBcnJheVxuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBhcmdzWzBdID0gZXhwb3J0cy5jb2VyY2UoYXJnc1swXSk7XG5cbiAgICBpZiAoJ3N0cmluZycgIT09IHR5cGVvZiBhcmdzWzBdKSB7XG4gICAgICAvLyBhbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlT1xuICAgICAgYXJncy51bnNoaWZ0KCclTycpO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXpBLVolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xuICAgICAgLy8gaWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuICAgICAgaWYgKG1hdGNoID09PSAnJSUnKSByZXR1cm4gbWF0Y2g7XG4gICAgICBpbmRleCsrO1xuICAgICAgdmFyIGZvcm1hdHRlciA9IGV4cG9ydHMuZm9ybWF0dGVyc1tmb3JtYXRdO1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcbiAgICAgICAgdmFyIHZhbCA9IGFyZ3NbaW5kZXhdO1xuICAgICAgICBtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuICAgICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG5cbiAgICAvLyBhcHBseSBlbnYtc3BlY2lmaWMgZm9ybWF0dGluZyAoY29sb3JzLCBldGMuKVxuICAgIGV4cG9ydHMuZm9ybWF0QXJncy5jYWxsKHNlbGYsIGFyZ3MpO1xuXG4gICAgdmFyIGxvZ0ZuID0gZGVidWcubG9nIHx8IGV4cG9ydHMubG9nIHx8IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSk7XG4gICAgbG9nRm4uYXBwbHkoc2VsZiwgYXJncyk7XG4gIH1cblxuICBkZWJ1Zy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gIGRlYnVnLmVuYWJsZWQgPSBleHBvcnRzLmVuYWJsZWQobmFtZXNwYWNlKTtcbiAgZGVidWcudXNlQ29sb3JzID0gZXhwb3J0cy51c2VDb2xvcnMoKTtcbiAgZGVidWcuY29sb3IgPSBzZWxlY3RDb2xvcihuYW1lc3BhY2UpO1xuXG4gIC8vIGVudi1zcGVjaWZpYyBpbml0aWFsaXphdGlvbiBsb2dpYyBmb3IgZGVidWcgaW5zdGFuY2VzXG4gIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZXhwb3J0cy5pbml0KSB7XG4gICAgZXhwb3J0cy5pbml0KGRlYnVnKTtcbiAgfVxuXG4gIHJldHVybiBkZWJ1Zztcbn1cblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG4gIGV4cG9ydHMuc2F2ZShuYW1lc3BhY2VzKTtcblxuICBleHBvcnRzLm5hbWVzID0gW107XG4gIGV4cG9ydHMuc2tpcHMgPSBbXTtcblxuICB2YXIgc3BsaXQgPSAodHlwZW9mIG5hbWVzcGFjZXMgPT09ICdzdHJpbmcnID8gbmFtZXNwYWNlcyA6ICcnKS5zcGxpdCgvW1xccyxdKy8pO1xuICB2YXIgbGVuID0gc3BsaXQubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoIXNwbGl0W2ldKSBjb250aW51ZTsgLy8gaWdub3JlIGVtcHR5IHN0cmluZ3NcbiAgICBuYW1lc3BhY2VzID0gc3BsaXRbaV0ucmVwbGFjZSgvXFwqL2csICcuKj8nKTtcbiAgICBpZiAobmFtZXNwYWNlc1swXSA9PT0gJy0nKSB7XG4gICAgICBleHBvcnRzLnNraXBzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzLnN1YnN0cigxKSArICckJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHBvcnRzLm5hbWVzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzICsgJyQnKSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGlzYWJsZSBkZWJ1ZyBvdXRwdXQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkaXNhYmxlKCkge1xuICBleHBvcnRzLmVuYWJsZSgnJyk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBtb2RlIG5hbWUgaXMgZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGVkKG5hbWUpIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5za2lwcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLnNraXBzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ29lcmNlIGB2YWxgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBjb2VyY2UodmFsKSB7XG4gIGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcbiAgcmV0dXJuIHZhbDtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgLCBwcmVmaXggPSAnfic7XG5cbi8qKlxuICogQ29uc3RydWN0b3IgdG8gY3JlYXRlIGEgc3RvcmFnZSBmb3Igb3VyIGBFRWAgb2JqZWN0cy5cbiAqIEFuIGBFdmVudHNgIGluc3RhbmNlIGlzIGEgcGxhaW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgYXJlIGV2ZW50IG5hbWVzLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEV2ZW50cygpIHt9XG5cbi8vXG4vLyBXZSB0cnkgdG8gbm90IGluaGVyaXQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuIEluIHNvbWUgZW5naW5lcyBjcmVhdGluZyBhblxuLy8gaW5zdGFuY2UgaW4gdGhpcyB3YXkgaXMgZmFzdGVyIHRoYW4gY2FsbGluZyBgT2JqZWN0LmNyZWF0ZShudWxsKWAgZGlyZWN0bHkuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gY2hhcmFjdGVyIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90XG4vLyBvdmVycmlkZGVuIG9yIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vXG5pZiAoT2JqZWN0LmNyZWF0ZSkge1xuICBFdmVudHMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAvL1xuICAvLyBUaGlzIGhhY2sgaXMgbmVlZGVkIGJlY2F1c2UgdGhlIGBfX3Byb3RvX19gIHByb3BlcnR5IGlzIHN0aWxsIGluaGVyaXRlZCBpblxuICAvLyBzb21lIG9sZCBicm93c2VycyBsaWtlIEFuZHJvaWQgNCwgaVBob25lIDUuMSwgT3BlcmEgMTEgYW5kIFNhZmFyaSA1LlxuICAvL1xuICBpZiAoIW5ldyBFdmVudHMoKS5fX3Byb3RvX18pIHByZWZpeCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIGV2ZW50IGxpc3RlbmVyLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gU3BlY2lmeSBpZiB0aGUgbGlzdGVuZXIgaXMgYSBvbmUtdGltZSBsaXN0ZW5lci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBgRXZlbnRFbWl0dGVyYCBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xufVxuXG4vKipcbiAqIFJldHVybiBhbiBhcnJheSBsaXN0aW5nIHRoZSBldmVudHMgZm9yIHdoaWNoIHRoZSBlbWl0dGVyIGhhcyByZWdpc3RlcmVkXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogQHJldHVybnMge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIG5hbWVzID0gW11cbiAgICAsIGV2ZW50c1xuICAgICwgbmFtZTtcblxuICBpZiAodGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gKGV2ZW50cyA9IHRoaXMuX2V2ZW50cykpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtCb29sZWFufSBleGlzdHMgT25seSBjaGVjayBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0FycmF5fEJvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCwgZXhpc3RzKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBhdmFpbGFibGUgPSB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAoZXhpc3RzKSByZXR1cm4gISFhdmFpbGFibGU7XG4gIGlmICghYXZhaWxhYmxlKSByZXR1cm4gW107XG4gIGlmIChhdmFpbGFibGUuZm4pIHJldHVybiBbYXZhaWxhYmxlLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGF2YWlsYWJsZS5sZW5ndGgsIGVlID0gbmV3IEFycmF5KGwpOyBpIDwgbDsgaSsrKSB7XG4gICAgZWVbaV0gPSBhdmFpbGFibGVbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIENhbGxzIGVhY2ggb2YgdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBldmVudCBoYWQgbGlzdGVuZXJzLCBlbHNlIGBmYWxzZWAuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgYXJnc1xuICAgICwgaTtcblxuICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnMuZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgY2FzZSAxOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQpLCB0cnVlO1xuICAgICAgY2FzZSAyOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExKSwgdHJ1ZTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIpLCB0cnVlO1xuICAgICAgY2FzZSA0OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMpLCB0cnVlO1xuICAgICAgY2FzZSA1OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgNjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCwgYTUpLCB0cnVlO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuZm4uYXBwbHkobGlzdGVuZXJzLmNvbnRleHQsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoXG4gICAgICAsIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0ub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzW2ldLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBjYXNlIDQ6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIsIGEzKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogQWRkIGEgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXIsIHRoaXMuX2V2ZW50c0NvdW50Kys7XG4gIGVsc2UgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGEgb25lLXRpbWUgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzLCB0cnVlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyLCB0aGlzLl9ldmVudHNDb3VudCsrO1xuICBlbHNlIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW3RoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB0aGUgbGlzdGVuZXJzIG9mIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBtYXRjaCB0aGlzIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBPbmx5IHJlbW92ZSB0aGUgbGlzdGVuZXJzIHRoYXQgaGF2ZSB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25lLXRpbWUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbiwgY29udGV4dCwgb25jZSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gdGhpcztcbiAgaWYgKCFmbikge1xuICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChcbiAgICAgICAgIGxpc3RlbmVycy5mbiA9PT0gZm5cbiAgICAgICYmICghb25jZSB8fCBsaXN0ZW5lcnMub25jZSlcbiAgICAgICYmICghY29udGV4dCB8fCBsaXN0ZW5lcnMuY29udGV4dCA9PT0gY29udGV4dClcbiAgICApIHtcbiAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50cyA9IFtdLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChcbiAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmblxuICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpXG4gICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gICAgLy9cbiAgICBpZiAoZXZlbnRzLmxlbmd0aCkgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICAgIGVsc2UgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycywgb3IgdGhvc2Ugb2YgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IFtldmVudF0gVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICB2YXIgZXZ0O1xuXG4gIGlmIChldmVudCkge1xuICAgIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG4gICAgaWYgKHRoaXMuX2V2ZW50c1tldnRdKSB7XG4gICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgcHJlZml4LlxuLy9cbkV2ZW50RW1pdHRlci5wcmVmaXhlZCA9IHByZWZpeDtcblxuLy9cbi8vIEFsbG93IGBFdmVudEVtaXR0ZXJgIHRvIGJlIGltcG9ydGVkIGFzIG1vZHVsZSBuYW1lc3BhY2UuXG4vL1xuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbmlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIG1vZHVsZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbn1cbiIsIi8qKlxuICogSGVscGVycy5cbiAqL1xuXG52YXIgcyA9IDEwMDA7XG52YXIgbSA9IHMgKiA2MDtcbnZhciBoID0gbSAqIDYwO1xudmFyIGQgPSBoICogMjQ7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzTmFOKHZhbCkgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMubG9uZyA/IGZtdExvbmcodmFsKSA6IGZtdFNob3J0KHZhbCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICd2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIHZhbGlkIG51bWJlci4gdmFsPScgK1xuICAgICAgSlNPTi5zdHJpbmdpZnkodmFsKVxuICApO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHN0ciA9IFN0cmluZyhzdHIpO1xuICBpZiAoc3RyLmxlbmd0aCA+IDEwMCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtaWxsaXNlY29uZHM/fG1zZWNzP3xtc3xzZWNvbmRzP3xzZWNzP3xzfG1pbnV0ZXM/fG1pbnM/fG18aG91cnM/fGhycz98aHxkYXlzP3xkfHllYXJzP3x5cnM/fHkpPyQvaS5leGVjKFxuICAgIHN0clxuICApO1xuICBpZiAoIW1hdGNoKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ3llYXJzJzpcbiAgICBjYXNlICd5ZWFyJzpcbiAgICBjYXNlICd5cnMnOlxuICAgIGNhc2UgJ3lyJzpcbiAgICBjYXNlICd5JzpcbiAgICAgIHJldHVybiBuICogeTtcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkO1xuICAgIGNhc2UgJ2hvdXJzJzpcbiAgICBjYXNlICdob3VyJzpcbiAgICBjYXNlICdocnMnOlxuICAgIGNhc2UgJ2hyJzpcbiAgICBjYXNlICdoJzpcbiAgICAgIHJldHVybiBuICogaDtcbiAgICBjYXNlICdtaW51dGVzJzpcbiAgICBjYXNlICdtaW51dGUnOlxuICAgIGNhc2UgJ21pbnMnOlxuICAgIGNhc2UgJ21pbic6XG4gICAgY2FzZSAnbSc6XG4gICAgICByZXR1cm4gbiAqIG07XG4gICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgY2FzZSAnc2Vjb25kJzpcbiAgICBjYXNlICdzZWNzJzpcbiAgICBjYXNlICdzZWMnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21pbGxpc2Vjb25kcyc6XG4gICAgY2FzZSAnbWlsbGlzZWNvbmQnOlxuICAgIGNhc2UgJ21zZWNzJzpcbiAgICBjYXNlICdtc2VjJzpcbiAgICBjYXNlICdtcyc6XG4gICAgICByZXR1cm4gbjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIFNob3J0IGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdFNob3J0KG1zKSB7XG4gIGlmIChtcyA+PSBkKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJztcbiAgfVxuICBpZiAobXMgPj0gaCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCc7XG4gIH1cbiAgaWYgKG1zID49IG0pIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICB9XG4gIGlmIChtcyA+PSBzKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJztcbiAgfVxuICByZXR1cm4gbXMgKyAnbXMnO1xufVxuXG4vKipcbiAqIExvbmcgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10TG9uZyhtcykge1xuICByZXR1cm4gcGx1cmFsKG1zLCBkLCAnZGF5JykgfHxcbiAgICBwbHVyYWwobXMsIGgsICdob3VyJykgfHxcbiAgICBwbHVyYWwobXMsIG0sICdtaW51dGUnKSB8fFxuICAgIHBsdXJhbChtcywgcywgJ3NlY29uZCcpIHx8XG4gICAgbXMgKyAnIG1zJztcbn1cblxuLyoqXG4gKiBQbHVyYWxpemF0aW9uIGhlbHBlci5cbiAqL1xuXG5mdW5jdGlvbiBwbHVyYWwobXMsIG4sIG5hbWUpIHtcbiAgaWYgKG1zIDwgbikge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAobXMgPCBuICogMS41KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IobXMgLyBuKSArICcgJyArIG5hbWU7XG4gIH1cbiAgcmV0dXJuIE1hdGguY2VpbChtcyAvIG4pICsgJyAnICsgbmFtZSArICdzJztcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDogUGFydG5lcmluZyAzLjAgKDIwMDctMjAxNilcbiAqIEF1dGhvciA6IFN5bHZhaW4gTWFow6kgPHN5bHZhaW4ubWFoZUBwYXJ0bmVyaW5nLmZyPlxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIGRpeWEtc2RrLlxuICpcbiAqIGRpeWEtc2RrIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIGRpeWEtc2RrIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIGRpeWEtc2RrLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cblxuXG5cblxuLyogbWF5YS1jbGllbnRcbiAqIENvcHlyaWdodCAoYykgMjAxNCwgUGFydG5lcmluZyBSb2JvdGljcywgQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgbGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3JcbiAqIG1vZGlmeSBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5IHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IHZlcnNpb25cbiAqXHQzLjAgb2YgdGhlIExpY2Vuc2UuIFRoaXMgbGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZVxuICogdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW5cbiAqIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVJcbiAqIFBVUlBPU0UuIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBsaWJyYXJ5LlxuICovXG4oZnVuY3Rpb24oKXtcblx0Y29uc3QgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdzdGF0dXMnKTtcblx0bGV0IFdhdGNoZXIgPSByZXF1aXJlKCcuL3dhdGNoZXIuanMnKTtcblxuXHRsZXQgaXNCcm93c2VyID0gISh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyk7XG5cdGlmICghaXNCcm93c2VyKSB7IHZhciBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTsgfVxuXHRlbHNlIHsgdmFyIFByb21pc2UgPSB3aW5kb3cuUHJvbWlzZTsgfVxuXHRsZXQgRGl5YVNlbGVjdG9yID0gZDEuRGl5YVNlbGVjdG9yO1xuXHRsZXQgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8gTG9nZ2luZyB1dGlsaXR5IG1ldGhvZHMgLy8vLy8vLy8vLy8vLy8vLy8vXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblx0dmFyIERFQlVHID0gdHJ1ZTtcblx0dmFyIExvZ2dlciA9IHtcblx0XHRsb2c6IGZ1bmN0aW9uKG1lc3NhZ2Upe1xuXHRcdFx0aWYgKERFQlVHKSBjb25zb2xlLmxvZyhtZXNzYWdlKTtcblx0XHR9LFxuXG5cdFx0ZXJyb3I6IGZ1bmN0aW9uKG1lc3NhZ2Upe1xuXHRcdFx0aWYgKERFQlVHKSBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICpcdGNhbGxiYWNrIDogZnVuY3Rpb24gY2FsbGVkIGFmdGVyIG1vZGVsIHVwZGF0ZWRcblx0ICogKi9cblx0ZnVuY3Rpb24gU3RhdHVzKHNlbGVjdG9yKXtcblx0XHR0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3I7XG5cdFx0dGhpcy5fY29kZXIgPSBzZWxlY3Rvci5lbmNvZGUoKTtcblx0XHR0aGlzLndhdGNoZXJzID0gW107XG5cblx0XHQvKiogbW9kZWwgb2Ygcm9ib3QgOiBhdmFpbGFibGUgcGFydHMgYW5kIHN0YXR1cyAqKi9cblx0XHR0aGlzLnJvYm90TW9kZWwgPSBbXTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogU3Vic2NyaWJlIHRvIGVycm9yL3N0YXR1cyB1cGRhdGVzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLndhdGNoID0gZnVuY3Rpb24ob3B0aW9ucywgY2FsbGJhY2spIHtcblxuXHRcdC8vIGRvIG5vdCBjcmVhdGUgd2F0Y2hlciB3aXRob3V0IGEgY2FsbGJhY2tcblx0XHRpZiAoY2FsbGJhY2sgPT0gbnVsbCB8fCB0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblxuXHRcdGxldCB3YXRjaGVyID0gbmV3IFdhdGNoZXIodGhpcy5zZWxlY3Rvciwgb3B0aW9ucyk7XG5cblx0XHQvLyBhZGQgd2F0Y2hlciBpbiB3YXRjaGVyIGxpc3Rcblx0XHR0aGlzLndhdGNoZXJzLnB1c2god2F0Y2hlcik7XG5cblx0XHR3YXRjaGVyLm9uKCdkYXRhJywgKGRhdGEpID0+IHtcblx0XHRcdGRlYnVnKGRhdGEpXG5cdFx0XHRjYWxsYmFjayh0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKGRhdGEucGFydHMsXG5cdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEucm9ib3RJZCxcblx0XHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5yb2JvdE5hbWUpLFxuXHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnBlZXJJZClcblx0XHR9KTtcblx0XHR3YXRjaGVyLm9uKCdzdG9wJywgdGhpcy5fcmVtb3ZlV2F0Y2hlcik7XG5cblx0XHRyZXR1cm4gd2F0Y2hlcjtcblx0fTtcblxuXHQvKipcblx0ICogQ2FsbGJhY2sgdG8gcmVtb3ZlIHdhdGNoZXIgZnJvbSBsaXN0XG5cdCAqIEBwYXJhbSB3YXRjaGVyIHRvIGJlIHJlbW92ZWRcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuX3JlbW92ZVdhdGNoZXIgPSBmdW5jdGlvbiAod2F0Y2hlcikge1xuXHRcdC8vIGZpbmQgYW5kIHJlbW92ZSB3YXRjaGVyIGluIGxpc3Rcblx0XHR0aGlzLndhdGNoZXJzLmZpbmQoIChlbCwgaWQsIHdhdGNoZXJzKSA9PiB7XG5cdFx0XHRpZiAod2F0Y2hlciA9PT0gZWwpIHtcblx0XHRcdFx0d2F0Y2hlcnMuc3BsaWNlKGlkLCAxKTsgLy8gcmVtb3ZlXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0pXG5cdH07XG5cblx0LyoqXG5cdCAqIFN0b3AgYWxsIHdhdGNoZXJzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmNsb3NlU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uICgpIHtcblx0XHRjb25zb2xlLndhcm4oJ0RlcHJlY2F0ZWQgZnVuY3Rpb24gdXNlIHN0b3BXYXRjaGVycyBpbnN0ZWFkJyk7XG5cdFx0dGhpcy5zdG9wV2F0Y2hlcnMoKTtcblx0fTtcblxuXHRTdGF0dXMucHJvdG90eXBlLnN0b3BXYXRjaGVycyA9IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLndhdGNoZXJzLmZvckVhY2goIHdhdGNoZXIgPT4ge1xuXHRcdFx0Ly8gcmVtb3ZlIGxpc3RlbmVyIG9uIHN0b3AgZXZlbnQgdG8gYXZvaWQgcHVyZ2luZyB3YXRjaGVycyB0d2ljZVxuXHRcdFx0d2F0Y2hlci5yZW1vdmVMaXN0ZW5lcignc3RvcCcsIHRoaXMuX3JlbW92ZVdhdGNoZXIpO1xuXHRcdFx0d2F0Y2hlci5zdG9wKCk7XG5cdFx0fSk7XG5cdFx0dGhpcy53YXRjaGVycyA9IFtdO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBVcGRhdGUgaW50ZXJuYWwgcm9ib3QgbW9kZWwgd2l0aCByZWNlaXZlZCBkYXRhICh2ZXJzaW9uIDIpXG5cdCAqIEBwYXJhbSAge0FycmF5IG9mIEFycmF5IG9mIFBhcnRJbmZvIChzdHJ1Y3QpfSBkYXRhIGRhdGEgcmVjZWl2ZWQgZnJvbVxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEaXlhTm9kZSBieSB3ZWJzb2NrZXRcblx0ICogQHBhcmFtICB7aW50fSByb2JvdElkIGlkIG9mIHRoZSByb2JvdFxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHJvYm90TmFtZSBuYW1lIG9mIHRoZSByb2JvdFxuXHQgKiBAcmV0dXJuIHtbdHlwZV19XHRcdFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuX2dldFJvYm90TW9kZWxGcm9tUmVjdjIgPSBmdW5jdGlvbihkYXRhLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9ib3RJZCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvYm90TmFtZSkge1xuXHRcdGlmICh0aGlzLnJvYm90TW9kZWwgPT0gbnVsbClcblx0XHRcdHRoaXMucm9ib3RNb2RlbCA9IFtdO1xuXG5cdFx0aWYgKHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSAhPSBudWxsKVxuXHRcdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdLnBhcnRzID0ge307IC8vIHJlc2V0IHBhcnRzXG5cblx0XHRpZiAodGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdID09IG51bGwpXG5cdFx0XHR0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0gPSB7fTtcblxuXHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSA9IHtcblx0XHRcdHJvYm90OiB7XG5cdFx0XHRcdG5hbWU6IHJvYm90TmFtZVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKiogZXh0cmFjdCBwYXJ0cyBpbmZvICoqL1xuXHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXS5wYXJ0cyA9IHt9O1xuXHRcdGxldCByUGFydHMgPSB0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0ucGFydHM7XG5cblx0XHRkYXRhLmZvckVhY2goZCA9PiB7XG5cdFx0XHRsZXQgcGFydElkID0gZFswXTtcblx0XHRcdGxldCBjYXRlZ29yeSA9IGRbMV07XG5cdFx0XHRsZXQgcGFydE5hbWUgPSBkWzJdO1xuXHRcdFx0bGV0IGxhYmVsID0gZFszXTtcblx0XHRcdGxldCB0aW1lID0gZFs0XTtcblx0XHRcdGxldCBjb2RlID0gZFs1XTtcblx0XHRcdGxldCBjb2RlUmVmID0gZFs2XTtcblx0XHRcdGxldCBtc2cgPSBkWzddO1xuXHRcdFx0bGV0IGNyaXRMZXZlbCA9IGRbOF07XG5cdFx0XHRsZXQgZGVzY3JpcHRpb24gPSBkWzldO1xuXG5cdFx0XHRpZiAoclBhcnRzW3BhcnRJZF0gPT0gbnVsbCkge1xuXHRcdFx0XHRyUGFydHNbcGFydElkXSA9IHt9O1xuXHRcdFx0fVxuXHRcdFx0LyogdXBkYXRlIHBhcnQgY2F0ZWdvcnkgKi9cblx0XHRcdHJQYXJ0c1twYXJ0SWRdLmNhdGVnb3J5ID0gY2F0ZWdvcnk7XG5cdFx0XHQvKiB1cGRhdGUgcGFydCBuYW1lICovXG5cdFx0XHRyUGFydHNbcGFydElkXS5uYW1lID0gcGFydE5hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdC8qIHVwZGF0ZSBwYXJ0IGxhYmVsICovXG5cdFx0XHRyUGFydHNbcGFydElkXS5sYWJlbCA9IGxhYmVsO1xuXG5cdFx0XHQvKiB1cGRhdGUgZXJyb3IgKi9cblx0XHRcdC8qKiB1cGRhdGUgZXJyb3JMaXN0ICoqL1xuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdCA9PSBudWxsKVxuXHRcdFx0XHRyUGFydHNbcGFydElkXS5lcnJvckxpc3QgPSB7fTtcblxuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdFtjb2RlUmVmXSA9PSBudWxsKVxuXHRcdFx0XHRyUGFydHNbcGFydElkXS5lcnJvckxpc3RbY29kZVJlZl0gPSB7XG5cdFx0XHRcdFx0bXNnOiBtc2csXG5cdFx0XHRcdFx0Y3JpdExldmVsOiBjcml0TGV2ZWwsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG5cdFx0XHRcdH07XG5cdFx0XHRsZXQgZXZ0c190bXAgPSB7XG5cdFx0XHRcdHRpbWU6IHRoaXMuX2NvZGVyLmZyb20odGltZSksXG5cdFx0XHRcdGNvZGU6IHRoaXMuX2NvZGVyLmZyb20oY29kZSksXG5cdFx0XHRcdGNvZGVSZWY6IHRoaXMuX2NvZGVyLmZyb20oY29kZVJlZilcblx0XHRcdH07XG5cdFx0XHRpZiAoclBhcnRzW3BhcnRJZF0uZXZ0cyA9PSBudWxsKSB7XG5cdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmV2dHMgPSBbXTtcblx0XHRcdH1cblx0XHRcdHJQYXJ0c1twYXJ0SWRdLmV2dHMucHVzaChldnRzX3RtcCk7XG5cdFx0fSlcblx0XHRyZXR1cm4gdGhpcy5yb2JvdE1vZGVsO1xuXHR9O1xuXG5cdC8qKiBjcmVhdGUgU3RhdHVzIHNlcnZpY2UgKiovXG5cdERpeWFTZWxlY3Rvci5wcm90b3R5cGUuU3RhdHVzID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gbmV3IFN0YXR1cyh0aGlzKTtcblx0fTtcblxuXHQvKipcblx0ICogU2V0IG9uIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGZpbmQgc3RhdHVzIHRvIG1vZGlmeVxuXHQgKiBAcGFyYW0gcGFydE5hbWUgXHR0byBmaW5kIHN0YXR1cyB0byBtb2RpZnlcblx0ICogQHBhcmFtIGNvZGVcdFx0bmV3Q29kZVxuXHQgKiBAcGFyYW0gc291cmNlXHRcdHNvdXJjZVxuXHQgKiBAcGFyYW0gY2FsbGJhY2tcdFx0cmV0dXJuIGNhbGxiYWNrICg8Ym9vbD5zdWNjZXNzKVxuXHQgKi9cblx0RGl5YVNlbGVjdG9yLnByb3RvdHlwZS5zZXRTdGF0dXMgPSBmdW5jdGlvbihyb2JvdE5hbWUsIHBhcnROYW1lLCBjb2RlLCBzb3VyY2UsIGNhbGxiYWNrKSB7XG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KF8gPT4ge1xuXHRcdFx0dmFyIG9iamVjdFBhdGggPSBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1cy9Sb2JvdHMvXCIgKyB0aGlzLnNwbGl0QW5kQ2FtZWxDYXNlKHJvYm90TmFtZSwgXCItXCIpICsgXCIvUGFydHMvXCIgKyBwYXJ0TmFtZTtcblx0XHRcdHRoaXMucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRcdGZ1bmM6IFwiU2V0UGFydFwiLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0XHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHQvL3JvYm90TmFtZTogcm9ib3ROYW1lLFxuXHRcdFx0XHRcdGNvZGU6IGNvZGUsXG5cdFx0XHRcdFx0Ly9wYXJ0TmFtZTogcGFydE5hbWUsXG5cdFx0XHRcdFx0c291cmNlOiBzb3VyY2UgfCAxXG5cdFx0XHRcdH1cblx0XHRcdH0sIHRoaXMub25TZXRQYXJ0LmJpbmQodGhpcywgY2FsbGJhY2spKTtcblx0XHR9KVxuXHRcdC5jYXRjaChlcnIgPT4ge1xuXHRcdFx0TG9nZ2VyLmVycm9yKGVycilcblx0XHR9KVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBvbiBTZXRQYXJ0XG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLm9uU2V0UGFydCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBwZWVySWQsIGVyciwgZGF0YSkge1xuXHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soZmFsc2UpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKHRydWUpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgb25lIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGdldCBzdGF0dXNcblx0ICogQHBhcmFtIHBhcnROYW1lIFx0dG8gZ2V0IHN0YXR1c1xuXHQgKiBAcGFyYW0gY2FsbGJhY2tcdFx0cmV0dXJuIGNhbGxiYWNrKC0xIGlmIG5vdCBmb3VuZC9kYXRhIG90aGVyd2lzZSlcblx0ICogQHBhcmFtIF9mdWxsIFx0bW9yZSBkYXRhIGFib3V0IHN0YXR1c1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5nZXRTdGF0dXMgPSBmdW5jdGlvbihyb2JvdE5hbWUsIHBhcnROYW1lLCBjYWxsYmFjay8qLCBfZnVsbCovKSB7XG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KF8gPT4ge1xuXHRcdFx0dGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0XHRcdGZ1bmM6ICdHZXRNYW5hZ2VkT2JqZWN0cycsXG5cdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdGludGVyZmFjZTogJ29yZy5mcmVlZGVza3RvcC5EQnVzLk9iamVjdE1hbmFnZXInLFxuXHRcdFx0XHR9XG5cdFx0XHR9LCB0aGlzLm9uR2V0TWFuYWdlZE9iamVjdHNHZXRTdGF0dXMuYmluZCh0aGlzLCByb2JvdE5hbWUsIHBhcnROYW1lLCBjYWxsYmFjaykpO1xuXHRcdH0pXG5cdFx0LmNhdGNoKGVyciA9PiB7XG5cdFx0XHRMb2dnZXIuZXJyb3IoZXJyKTtcblx0XHR9KVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBvbiBHZXRNYW5hZ2VkT2JqZWN0cyBpbiBHZXRTdGF0dXNcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUub25HZXRNYW5hZ2VkT2JqZWN0c0dldFN0YXR1cyA9IGZ1bmN0aW9uKHJvYm90TmFtZSwgcGFydE5hbWUsIGNhbGxiYWNrLCBwZWVySWQsIGVyciwgZGF0YSkge1xuXHRcdGxldCBvYmplY3RQYXRoUm9ib3QgPSBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1cy9Sb2JvdHMvXCIgKyB0aGlzLnNwbGl0QW5kQ2FtZWxDYXNlKHJvYm90TmFtZSwgXCItXCIpO1xuXHRcdGxldCBvYmplY3RQYXRoUGFydCA9IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9cIiArIHRoaXMuc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIikgKyBcIi9QYXJ0cy9cIiArIHBhcnROYW1lO1xuXHRcdGxldCByb2JvdElkID0gZGF0YVtvYmplY3RQYXRoUm9ib3RdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90SWRcblx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdGZ1bmM6IFwiR2V0UGFydFwiLFxuXHRcdFx0b2JqOiB7XG5cdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnLFxuXHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoUGFydFxuXHRcdFx0fVxuXHRcdH0sIHRoaXMub25HZXRQYXJ0LmJpbmQodGhpcywgcm9ib3RJZCwgcm9ib3ROYW1lLCBjYWxsYmFjaykpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIG9uIEdldFBhcnRcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUub25HZXRQYXJ0ID0gZnVuY3Rpb24ocm9ib3RJZCwgcm9ib3ROYW1lLCBjYWxsYmFjaywgcGVlcklkLCBlcnIsIGRhdGEpIHtcblx0XHRsZXQgc2VuZERhdGEgPSBbXVxuXHRcdHNlbmREYXRhLnB1c2goZGF0YSlcblx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soLTEpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgYWxsIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGdldCBzdGF0dXNcblx0ICogQHBhcmFtIHBhcnROYW1lIFx0dG8gZ2V0IHN0YXR1c1xuXHQgKiBAcGFyYW0gY2FsbGJhY2tcdFx0cmV0dXJuIGNhbGxiYWNrKC0xIGlmIG5vdCBmb3VuZC9kYXRhIG90aGVyd2lzZSlcblx0ICogQHBhcmFtIF9mdWxsIFx0bW9yZSBkYXRhIGFib3V0IHN0YXR1c1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5nZXRBbGxTdGF0dXNlcyA9IGZ1bmN0aW9uKHJvYm90TmFtZSwgY2FsbGJhY2spIHtcblx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0b2JqOiB7XG5cdFx0XHRcdGludGVyZmFjZTogJ29yZy5mcmVlZGVza3RvcC5EQnVzLk9iamVjdE1hbmFnZXInLFxuXHRcdFx0fVxuXHRcdH0sIHRoaXMub25HZXRNYW5hZ2VkT2JqZWN0c0dldEFsbFN0YXR1c2VzLmJpbmQodGhpcywgcm9ib3ROYW1lLCBjYWxsYmFjaykpXG5cdH07XG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIG9uIEdldE1hbmFnZWRPYmplY3RzIGluIEdldEFsbFN0YXR1c2VzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLm9uR2V0TWFuYWdlZE9iamVjdHNHZXRBbGxTdGF0dXNlcyA9IGZ1bmN0aW9uKHJvYm90TmFtZSwgY2FsbGJhY2ssIHBlZXJJZCwgZXJyLCBkYXRhKSB7XG5cdFx0bGV0IG9iamVjdFBhdGggPSBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1cy9Sb2JvdHMvXCIgKyB0aGlzLnNwbGl0QW5kQ2FtZWxDYXNlKHJvYm90TmFtZSwgXCItXCIpO1xuXHRcdGlmIChkYXRhW29iamVjdFBhdGhdICE9IG51bGwpIHtcblx0XHRcdGlmIChkYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddICE9IG51bGwpIHtcblx0XHRcdFx0bGV0IHJvYm90SWQgPSBkYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90SWRcblx0XHRcdFx0Ly92YXIgZnVsbCA9IF9mdWxsIHx8IGZhbHNlO1xuXHRcdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRcdFx0ZnVuYzogXCJHZXRBbGxQYXJ0c1wiLFxuXHRcdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnLFxuXHRcdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgdGhpcy5vbkdldEFsbFBhcnRzLmJpbmQodGhpcywgcm9ib3RJZCwgcm9ib3ROYW1lLCBjYWxsYmFjaykpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiSW50ZXJmYWNlIGZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90IGRvZXNuJ3QgZXhpc3QhXCIpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRMb2dnZXIuZXJyb3IoXCJPYmplY3RQYXRoIFwiICsgb2JqZWN0UGF0aCArIFwiIGRvZXNuJ3QgZXhpc3QhXCIpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBvbiBHZXRBbGxQYXJ0c1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5vbkdldEFsbFBhcnRzID0gZnVuY3Rpb24ocm9ib3RJZCwgcm9ib3ROYW1lLCBjYWxsYmFjaywgcGVlcklkLCBlcnIsIGRhdGEpIHtcblx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKC0xKTtcblx0XHRcdHRocm93IG5ldyBFcnJvcihlcnIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKGRhdGEsIHJvYm90SWQsIHJvYm90TmFtZSk7XG5cdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwpO1xuXHRcdH1cblx0fVxuXG5cdFN0YXR1cy5wcm90b3R5cGUuc3BsaXRBbmRDYW1lbENhc2UgPSBmdW5jdGlvbihpblN0cmluZywgZGVsaW1pdGVyKSB7XG5cdFx0bGV0IGFycmF5U3BsaXRTdHJpbmcgPSBpblN0cmluZy5zcGxpdChkZWxpbWl0ZXIpO1xuXHRcdGxldCBvdXRDYW1lbFN0cmluZyA9ICcnO1xuXHRcdGFycmF5U3BsaXRTdHJpbmcuZm9yRWFjaChzdHIgPT4ge1xuXHRcdFx0b3V0Q2FtZWxTdHJpbmcgKz0gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyLnN1YnN0cmluZygxKTtcblx0XHR9KVxuXHRcdHJldHVybiBvdXRDYW1lbFN0cmluZztcblx0fVxuXG59KSgpXG4iLCJjb25zdCBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJyk7XG5jb25zdCBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ3N0YXR1czp3YXRjaGVyJyk7XG5jb25zdCBkZWJ1Z0Vycm9yID0gcmVxdWlyZSgnZGVidWcnKSgnc3RhdHVzOndhdGNoZXI6ZXJyb3JzJyk7XG4vLyEgY29uc3QgZ2V0VGltZVNhbXBsaW5nID0gcmVxdWlyZSgnLi90aW1lY29udHJvbC5qcycpLmdldFRpbWVTYW1wbGluZztcblxuJ3VzZSBzdHJpY3QnO1xuXG5jbGFzcyBTdG9wQ29uZGl0aW9uIGV4dGVuZHMgRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihtc2cpIHtcblx0XHRzdXBlcihtc2cpO1xuXHRcdHRoaXMubmFtZT0nU3RvcENvbmRpdGlvbidcblx0fVxufVxuXG5jbGFzcyBXYXRjaGVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblx0LyoqXG5cdCAqIEBwYXJhbSBlbWl0IGVtaXQgZGF0YSAobWFuZGF0b3J5KVxuXHQgKiBAcGFyYW0gY29uZmlnIHRvIGdldCBkYXRhIGZyb20gc2VydmVyXG5cdCAqL1xuXHRjb25zdHJ1Y3RvciAoc2VsZWN0b3IsIG9wdGlvbnMpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yO1xuXHRcdHRoaXMuc3Vic2NyaXB0aW9ucyA9IFtdO1xuXHRcdHRoaXMuc3RhdGUgPSAncnVubmluZyc7XG5cblx0XHR0aGlzLnJlY29ubmVjdGlvblBlcmlvZCA9IDA7IC8vIGluaXRpYWwgcGVyaW9kIGJldHdlZW4gcmVjb25uZWN0aW9uc1xuXHRcdHRoaXMubWF4UmVjb25uZWN0aW9uUGVyaW9kID0gNjAwMDA7IC8vIG1heCAxIG1pblxuXG5cdFx0Ly8gSW5jcmVhc2UgbnVtYmVyIG9mIGxpc3RlbmVycyAoU0hPVUxEIEJFIEFWT0lERUQpXG5cdFx0dGhpcy5zZWxlY3Rvci5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cdFx0dGhpcy5zZWxlY3Rvci5fY29ubmVjdGlvbi5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cblx0XHQvKiogaW5pdGlhbGlzZSBvcHRpb25zIGZvciByZXF1ZXN0ICoqL1xuXHRcdGlmIChvcHRpb25zLnNpZ25hbCA9PSBudWxsKSB7XG5cdFx0XHRvcHRpb25zLnNpZ25hbCA9ICdTdGF0dXNlc0J1ZmZlcmVkJztcblx0XHR9XG5cblx0XHR0aGlzLl9zdGF0dXNlc0RpY3Rpb25hcnkgPSB7fTtcblx0XHRkZWJ1ZyhvcHRpb25zKTtcblxuXHRcdHRoaXMud2F0Y2gob3B0aW9ucyk7IC8vIHN0YXJ0IHdhdGNoZXJcblx0fVxuXG5cdHdhdGNoIChvcHRpb25zKSB7XG5cdFx0ZGVidWcoJ2luIHdhdGNoJyk7XG5cdFx0bmV3IFByb21pc2UoIChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdvcmcuZnJlZWRlc2t0b3AuREJ1cy5PYmplY3RNYW5hZ2VyJyxcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkgIHtcblx0XHRcdFx0XHRyZWplY3QoZXJyKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMuc3RhdGUgPT09ICdzdG9wcGVkJykge1xuXHRcdFx0XHRcdHJlamVjdChuZXcgU3RvcENvbmRpdGlvbigpKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0ZGVidWcoJ1JlcXVlc3Q6ZW1pdERhdGEnKTtcblx0XHRcdFx0Ly8gUGFyc2Ugc3RhdHVzIGRhdGFcblx0XHRcdFx0ZGVidWcoZGF0YSk7XG5cdFx0XHRcdGRhdGEgPSB0aGlzLl9wYXJzZUdldE1hbmFnZWRPYmplY3RzRGF0YShkYXRhKTtcblx0XHRcdFx0ZGVidWcoZGF0YSk7XG5cdFx0XHRcdGZvciAobGV0IGRldmljZU5hbWUgaW4gZGF0YS5kZXZpY2VzKSB7XG5cdFx0XHRcdFx0bGV0IGRldmljZSA9IGRhdGEuZGV2aWNlc1tkZXZpY2VOYW1lXVxuXHRcdFx0XHRcdGlmIChkZXZpY2UucGFydHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0XHQvLyBUT0RPIHRoZXJlIHNob3VsZCBiZSBhIHNpZ25hbCBpbmRpY2F0aW5nXG5cdFx0XHRcdFx0XHQvLyB0aGF0IHRoZSBvYmplY3RzIHBhdGhzIGhhcyBhbGwgYmUgbG9hZGVkLi4uXG5cdFx0XHRcdFx0XHQvLyBJbmRlZWQsIHRoZSBwYXJ0cyBtYXkgbm90IGhhdmUgYmVlbiBsb2FkZWQgeWV0XG5cdFx0XHRcdFx0XHRyZWplY3QoJ0Vycm9yOiBObyBwYXJ0IHlldCcpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRsZXQgZGF0YVRvRW1pdCA9IHtcblx0XHRcdFx0XHRcdHBhcnRzOiBkZXZpY2UucGFydHMsXG5cdFx0XHRcdFx0XHRyb2JvdElkOiBkZXZpY2Uucm9ib3RJZCxcblx0XHRcdFx0XHRcdHJvYm90TmFtZTogZGV2aWNlLnJvYm90TmFtZSxcblx0XHRcdFx0XHRcdHBlZXJJZDogcGVlcklkLFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBTZW5kaW5nIHBhcnQgZGF0YSBkZXZpY2UgKHJvYm90KSBieSBkZXZpY2Vcblx0XHRcdFx0XHR0aGlzLmVtaXQoJ2RhdGEnLCBkYXRhVG9FbWl0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHR9KTtcblx0XHR9KVxuXHRcdC50aGVuKCAoKSA9PiB7XG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UgKCAocmVzb2x2ZSwgcmVqZWN0KSA9PiAge1xuXHRcdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRcdGZ1bmM6ICdHZXQnLFxuXHRcdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdFx0aW50ZXJmYWNlOiAnb3JnLmZyZWVkZXNrdG9wLkRCdXMuUHJvcGVydGllcycsXG5cdFx0XHRcdFx0XHRwYXRoOiAnL2ZyL3BhcnRuZXJpbmcvU3RhdHVzJ1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdFx0aW50ZXJmYWNlX25hbWU6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cycsXG5cdFx0XHRcdFx0XHRwcm9wZXJ0eV9uYW1lOiAnU3RhdHVzZXNEaWN0aW9uYXJ5J1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QoZXJyKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHRoaXMuc3RhdGUgPT09ICdzdG9wcGVkJykge1xuXHRcdFx0XHRcdFx0cmVqZWN0KG5ldyBTdG9wQ29uZGl0aW9uKCkpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoZGF0YSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHR0aGlzLl9zdGF0dXNlc0RpY3Rpb25hcnkgPSBkYXRhO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZWplY3QoJ05vIFN0YXR1c2VzRGljdGlvbmFyeSBkYXRhJyk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0fSlcblx0XHQudGhlbiggKCkgPT4ge1xuXHRcdFx0ZGVidWcoJ1N1YnNjcmliaW5nJyk7XG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UgKCAocmVzb2x2ZSwgcmVqZWN0KSA9PiAge1xuXHRcdFx0XHRsZXQgc3Vic2NyaXB0aW9uID0gdGhpcy5zZWxlY3Rvci5zdWJzY3JpYmUoe1xuXHRcdFx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRcdFx0ZnVuYzogb3B0aW9ucy5zaWduYWwsXG5cdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KGVycik7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChkYXRhICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdGRhdGEgPSB0aGlzLl9wYXJzZVN0YXR1c0NoYW5nZWREYXRhKGRhdGFbMF0pXG5cdFx0XHRcdFx0XHRmb3IgKGxldCBkZXZpY2VOYW1lIGluIGRhdGEuZGV2aWNlcykge1xuXHRcdFx0XHRcdFx0XHRsZXQgZGV2aWNlID0gZGF0YS5kZXZpY2VzW2RldmljZU5hbWVdXG5cdFx0XHRcdFx0XHRcdGxldCBkYXRhVG9FbWl0ID0ge1xuXHRcdFx0XHRcdFx0XHRcdHBhcnRzOiBkZXZpY2UucGFydHMsXG5cdFx0XHRcdFx0XHRcdFx0cm9ib3RJZDogZGV2aWNlLnJvYm90SWQsXG5cdFx0XHRcdFx0XHRcdFx0cm9ib3ROYW1lOiBkZXZpY2Uucm9ib3ROYW1lLFxuXHRcdFx0XHRcdFx0XHRcdHBlZXJJZDogcGVlcklkLFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHRoaXMuZW1pdCgnZGF0YScsIGRhdGFUb0VtaXQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLnJlY29ubmVjdGlvblBlcmlvZCA9IDA7IC8vIHJlc2V0IHBlcmlvZCBvbiBzdWJzY3JpcHRpb24gcmVxdWVzdHNcblx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdHRoaXMuc3Vic2NyaXB0aW9ucy5wdXNoKHN1YnNjcmlwdGlvbilcblx0XHRcdH0pXG5cdFx0fSlcblx0XHQuY2F0Y2goZXJyID0+IHtcblx0XHRcdC8vIHdhdGNoZXIgc3RvcHBlZCA6IGRvIG5vdGhpbmdcblx0XHRcdGlmIChlcnIubmFtZSA9PT0gJ1N0b3BDb25kaXRpb24nKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdC8vIHRyeSB0byByZXN0YXJ0IGxhdGVyXG5cdFx0XHRkZWJ1Z0Vycm9yKGVycik7XG5cdFx0XHR0aGlzLl9jbG9zZVN1YnNjcmlwdGlvbnMoKTsgLy8gc2hvdWxkIG5vdCBiZSBuZWNlc3Nhcnlcblx0XHRcdC8vIGluY3JlYXNlIGRlbGF5IGJ5IDEgc2VjXG5cdFx0XHR0aGlzLnJlY29ubmVjdGlvblBlcmlvZCA9IHRoaXMucmVjb25uZWN0aW9uUGVyaW9kICsgMTAwMDtcblx0XHRcdGlmICh0aGlzLnJlY29ubmVjdGlvblBlcmlvZCA+IHRoaXMubWF4UmVjb25uZWN0aW9uUGVyaW9kKSB7XG5cdFx0XHRcdC8vIG1heCA1bWluXG5cdFx0XHRcdHRoaXMucmVjb25uZWN0aW9uUGVyaW9kID0gdGhpcy5tYXhSZWNvbm5lY3Rpb25QZXJpb2Q7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLndhdGNoVGVudGF0aXZlID0gc2V0VGltZW91dCggKCkgPT4ge1xuXHRcdFx0XHR0aGlzLndhdGNoKG9wdGlvbnMpO1xuXHRcdFx0fSwgdGhpcy5yZWNvbm5lY3Rpb25QZXJpb2QpOyAvLyB0cnkgYWdhaW4gbGF0ZXJcblx0XHR9KTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFBhcnNlIG9iamVjdE1hbmFnZXIgaW50cm9zcGVjdCBkYXRhIHRvIGZlZWQgYmFjayBzdGF0dXMgbWFuYWdlclxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YSByYXcgZGF0YSBmcm9tIGdldE1hbmFnZWRPYmplY3RzXG5cdCAqIEByZXR1cm4ge09iamVjdHtTdHJpbmcsU3RyaW5nLEFycmF5IG9mIEFycmF5IG9mIFBhcnRJbmZvfSBwYXJzZWREYXRhXG5cdCAqL1xuXHRfcGFyc2VHZXRNYW5hZ2VkT2JqZWN0c0RhdGEgKGRhdGEpIHtcblx0XHRsZXQgcGFyc2VkRGF0YSA9IHtcblx0XHRcdGRldmljZXM6IHt9XG5cdFx0fVxuXHRcdGlmIChkYXRhID09IG51bGwpIHtcblx0XHRcdHJldHVybiBwYXJzZWREYXRhO1xuXHRcdH1cblxuXHRcdC8vIEZvciBlYWNoIG9iamVjdCBwYXRoXG5cdFx0Zm9yIChsZXQgcGF0aCBpbiBkYXRhKSB7XG5cdFx0XHRsZXQgb2JqID0gZGF0YVtwYXRoXTtcblx0XHRcdGxldCBzcGxpdFBhdGggPSBwYXRoLnNwbGl0KCcvJyk7XG5cdFx0XHRpZiAoc3BsaXRQYXRoLmxlbmd0aCA9PT0gNikge1xuXHRcdFx0XHQvLyB3aXRoIGRldmljZSBwYXRoLCBzcGxpdCBwYXRoIGhhcyA2IGl0ZW1zXG5cdFx0XHRcdGZvciAobGV0IGlmYWNlIGluIG9iaikge1xuXHRcdFx0XHRcdGlmIChpZmFjZSA9PT0gXCJmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdFwiKSB7XG5cdFx0XHRcdFx0XHQvLyBJbnRlcmZhY2Ugb2YgdGhlIGRldmljZSBvYmplY3RzXG5cdFx0XHRcdFx0XHRsZXQgZGV2aWNlID0gb2JqW2lmYWNlXTtcblx0XHRcdFx0XHRcdC8vIEZpbmQgcHJvZHVjdCBuYW1lIGFuZCBpZFxuXHRcdFx0XHRcdFx0bGV0IHJvYm90TmFtZSA9IHNwbGl0UGF0aFs1XS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdFx0bGV0IHNlbERldmljZSA9IHBhcnNlZERhdGEuZGV2aWNlc1tyb2JvdE5hbWVdO1xuXHRcdFx0XHRcdFx0aWYgKHNlbERldmljZSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHNlbERldmljZSA9IHtcblx0XHRcdFx0XHRcdFx0XHRwYXJ0czogW11cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lXSA9IHNlbERldmljZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHNlbERldmljZS5yb2JvdE5hbWUgPSBkZXZpY2UuUm9ib3ROYW1lO1xuXHRcdFx0XHRcdFx0c2VsRGV2aWNlLnJvYm90SWQgPSBkZXZpY2UuUm9ib3RJZDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoc3BsaXRQYXRoLmxlbmd0aCA9PT0gOCkge1xuXHRcdFx0XHQvLyB3aXRoIHBhcnQgcGF0aCwgc3BsaXQgcGF0aCBoYXMgOCBpdGVtc1xuXHRcdFx0XHRmb3IgKGxldCBpZmFjZSBpbiBvYmopIHtcblx0XHRcdFx0XHRpZiAoaWZhY2UgPT09IFwiZnIucGFydG5lcmluZy5TdGF0dXMuUGFydFwiKSB7XG5cdFx0XHRcdFx0XHQvLyBJbnRlcmZhY2Ugb2YgdGhlIHBhcnQgb2JqZWN0c1xuXHRcdFx0XHRcdFx0bGV0IHBhcnQgPSBvYmpbaWZhY2VdO1xuXHRcdFx0XHRcdFx0Ly8gRmluZCBwcm9kdWN0IG5hbWVcblx0XHRcdFx0XHRcdGxldCByb2JvdE5hbWUgPSBzcGxpdFBhdGhbNV0udG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRcdGxldCBzZWxEZXZpY2UgPSBwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lXTtcblx0XHRcdFx0XHRcdGlmIChzZWxEZXZpY2UgPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRzZWxEZXZpY2UgPSB7XG5cdFx0XHRcdFx0XHRcdFx0cGFydHM6IFtdXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cGFyc2VkRGF0YS5kZXZpY2VzW3JvYm90TmFtZV0gPSBzZWxEZXZpY2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQvLyBCdWlsZCBwYXJ0IGFycmF5XG5cdFx0XHRcdFx0XHQvLyBUT0RPIG9wdGltaXplIGhvdyB0aGUgZGF0YSBhcmUgdXNlZCA6XG5cdFx0XHRcdFx0XHQvLyBhY3R1YWxseSBjb252ZXJ0aW5nIG9iamVjdCB0byBhcnJheSB0aGVuXG5cdFx0XHRcdFx0XHQvLyBmcm9tIGFycmF5IHRvIG9iamVjdCBhZ2Fpbi4uLlxuXHRcdFx0XHRcdFx0bGV0IG5ld1BhcnQgPSBbXTtcblx0XHRcdFx0XHRcdG5ld1BhcnRbMF0gPSBwYXJ0LlBhcnRJZDtcblx0XHRcdFx0XHRcdG5ld1BhcnRbMV0gPSBwYXJ0LkNhdGVnb3J5O1xuXHRcdFx0XHRcdFx0bmV3UGFydFsyXSA9IHBhcnQuUGFydE5hbWU7XG5cdFx0XHRcdFx0XHRuZXdQYXJ0WzNdID0gXCJcIjsgLy8gTGFiZWwgaXMgdW51c2VkIGluIHByYWN0aWNlXG5cdFx0XHRcdFx0XHRuZXdQYXJ0WzRdID0gcGFydC5UaW1lO1xuXHRcdFx0XHRcdFx0bmV3UGFydFs1XSA9IHBhcnQuQ29kZTtcblx0XHRcdFx0XHRcdG5ld1BhcnRbNl0gPSBwYXJ0LkNvZGVSZWY7XG5cdFx0XHRcdFx0XHRuZXdQYXJ0WzddID0gcGFydC5Nc2c7XG5cdFx0XHRcdFx0XHRuZXdQYXJ0WzhdID0gcGFydC5Dcml0TGV2ZWw7XG5cdFx0XHRcdFx0XHRuZXdQYXJ0WzldID0gXCJcIiAvLyBEZXNjcmlwdGlvbiBpcyB1bnVzZWQgaW4gcHJhY3RpY2VcblxuXHRcdFx0XHRcdFx0c2VsRGV2aWNlLnBhcnRzLnB1c2gobmV3UGFydCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRlYnVnRXJyb3IoXCJVbmRlZmluZWQgcGF0aCBmb3JtYXRcIik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHQvLyBSZWFkIFJvYm90IG5hbWUgYW5kIHJvYm90IElkXG5cdFx0Ly8gUmVhZCBQYXJ0IGRhdGFcblx0XHRyZXR1cm4gcGFyc2VkRGF0YTtcblx0fVxuXG5cdF9wYXJzZVN0YXR1c0NoYW5nZWREYXRhIChkYXRhKSB7XG5cdFx0bGV0IHBhcnNlZERhdGEgPSB7fTtcblx0XHRkYXRhLmZvckVhY2goIChldmVudCkgPT4ge1xuXHRcdFx0bGV0IHJvYm90TmFtZSA9IGV2ZW50WzBdO1xuXHRcdFx0bGV0IHJvYm90SWQgPSBldmVudFsxXTtcblx0XHRcdGxldCB0aW1lID0gZXZlbnRbMl07XG5cdFx0XHRsZXQgc3RhdHVzRXZlbnRJZCA9IGV2ZW50WzNdO1xuXHRcdFx0bGV0IGNvZGUgPSBldmVudFs0XTtcblx0XHRcdGxldCByb2JvdE5hbWVMb3dlckNhc2UgPSByb2JvdE5hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdGlmICh0aGlzLl9zdGF0dXNlc0RpY3Rpb25hcnlbc3RhdHVzRXZlbnRJZF1bMF0gIT09IHN0YXR1c0V2ZW50SWQpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihcIk1hbGZvcm1lZCBzdGF0dXNlcyBkaWN0aW9uYXJ5XCIpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRsZXQgcGFydElkID0gdGhpcy5fc3RhdHVzZXNEaWN0aW9uYXJ5W3N0YXR1c0V2ZW50SWRdWzFdO1xuXHRcdFx0bGV0IGNvZGVSZWYgPSB0aGlzLl9zdGF0dXNlc0RpY3Rpb25hcnlbc3RhdHVzRXZlbnRJZF1bMl07XG5cdFx0XHRsZXQgcGFydE5hbWUgPSB0aGlzLl9zdGF0dXNlc0RpY3Rpb25hcnlbc3RhdHVzRXZlbnRJZF1bM107XG5cdFx0XHRsZXQgY2F0ZWdvcnkgPSB0aGlzLl9zdGF0dXNlc0RpY3Rpb25hcnlbc3RhdHVzRXZlbnRJZF1bNF07XG5cdFx0XHRsZXQgbXNnID0gdGhpcy5fc3RhdHVzZXNEaWN0aW9uYXJ5W3N0YXR1c0V2ZW50SWRdWzVdO1xuXHRcdFx0bGV0IGNyaXRMZXZlbCA9IHRoaXMuX3N0YXR1c2VzRGljdGlvbmFyeVtzdGF0dXNFdmVudElkXVs2XTtcblx0XHRcdGxldCBsYWJlbCA9IFwiXCI7IC8vIExhYmVsIGlzIHVudXNlZCBpbiBwcmFjdGljZVxuXHRcdFx0bGV0IGRlc2NyaXB0aW9uID0gXCJcIjsgLy8gRGVzY3JpcHRpb24gaXMgdW51c2VkIGluIHByYWN0aWNlXG5cdFx0XHRpZiAocGFyc2VkRGF0YS5kZXZpY2VzID09IG51bGwpIHtcblx0XHRcdFx0cGFyc2VkRGF0YS5kZXZpY2VzID0gW107XG5cdFx0XHR9XG5cdFx0XHRpZiAocGFyc2VkRGF0YS5kZXZpY2VzW3JvYm90TmFtZUxvd2VyQ2FzZV0gPT0gbnVsbCkge1xuXHRcdFx0XHRwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lTG93ZXJDYXNlXSA9IHt9O1xuXHRcdFx0fVxuXHRcdFx0cGFyc2VkRGF0YS5kZXZpY2VzW3JvYm90TmFtZUxvd2VyQ2FzZV0ucm9ib3RJZCA9IHJvYm90SWQ7XG5cdFx0XHRwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lTG93ZXJDYXNlXS5yb2JvdE5hbWUgPSByb2JvdE5hbWU7XG5cdFx0XHRpZiAocGFyc2VkRGF0YS5kZXZpY2VzW3JvYm90TmFtZUxvd2VyQ2FzZV0ucGFydHMgPT0gbnVsbCkge1xuXHRcdFx0XHRwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lTG93ZXJDYXNlXS5wYXJ0cyA9IFtdO1xuXHRcdFx0fVxuXHRcdFx0bGV0IG5ld1BhcnQgPSBbXTtcblx0XHRcdG5ld1BhcnRbMF0gPSBwYXJ0SWQ7XG5cdFx0XHRuZXdQYXJ0WzFdID0gY2F0ZWdvcnk7XG5cdFx0XHRuZXdQYXJ0WzJdID0gcGFydE5hbWU7XG5cdFx0XHRuZXdQYXJ0WzNdID0gbGFiZWw7XG5cdFx0XHRuZXdQYXJ0WzRdID0gdGltZTtcblx0XHRcdG5ld1BhcnRbNV0gPSBjb2RlO1xuXHRcdFx0bmV3UGFydFs2XSA9IGNvZGVSZWY7XG5cdFx0XHRuZXdQYXJ0WzddID0gbXNnO1xuXHRcdFx0bmV3UGFydFs4XSA9IGNyaXRMZXZlbDtcblx0XHRcdG5ld1BhcnRbOV0gPSBkZXNjcmlwdGlvbjtcblx0XHRcdHBhcnNlZERhdGEuZGV2aWNlc1tyb2JvdE5hbWVMb3dlckNhc2VdLnBhcnRzLnB1c2gobmV3UGFydCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHBhcnNlZERhdGE7XG5cdH1cblxuXHQvLyBDbG9zZSBhbGwgc3Vic2NyaXB0aW9ucyBpZiBhbnlcblx0X2Nsb3NlU3Vic2NyaXB0aW9ucyAoKSB7XG5cdFx0ZGVidWcoJ0luIGNsb3NlU3Vic2NyaXB0aW9uJyk7XG5cdFx0Zm9yKHZhciBpIGluIHRoaXMuc3Vic2NyaXB0aW9ucykge1xuXHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zW2ldLmNsb3NlKCk7XG5cdFx0fVxuXHRcdHRoaXMuc3Vic2NyaXB0aW9ucyA9IFtdO1xuXHR9XG5cblx0c3RvcCAoKSB7XG5cdFx0ZGVidWcoJ0luIHN0b3AnKTtcblx0XHR0aGlzLnN0YXRlID0gJ3N0b3BwZWQnO1xuXHRcdGlmICh0aGlzLndhdGNoVGVudGF0aXZlICE9IG51bGwpIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aGlzLndhdGNoVGVudGF0aXZlKTtcblx0XHR9XG5cdFx0dGhpcy5fY2xvc2VTdWJzY3JpcHRpb25zKCk7XG5cdFx0dGhpcy5lbWl0KCdzdG9wJyk7XG5cdFx0dGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdhdGNoZXI7XG4iXX0=
