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
'use strict';

/*
 * Copyright : Partnering 3.0 (2007-2019)
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

(function () {
	var ConnectorV1 = require("./v1/connector.js");
	var ConnectorV2 = require('./v2/connector.js');

	var DiyaSelector = d1.DiyaSelector;

	/** create Status service **/
	DiyaSelector.prototype.Status = function () {
		var _this = this;

		return new Promise(function (resolve, reject) {
			_this.request({
				service: 'status',
				func: 'GetAPIVersion'
			}, function (peerId, err, data) {
				if (err == null) {
					resolve(data);
				} else {
					reject(err);
				}
			});
		}).then(function (data) {
			if (data === 2) {
				return new ConnectorV2(_this);
			} else {
				throw new Error('Cannot instantiate connector');
			}
		}).catch(function (err) {
			if (err.includes("Method 'GetAPIVersion' not found in introspection data")) {
				return new ConnectorV1(_this);
			} else {
				throw new Error(err);
			}
		});
	};
})();

},{"./v1/connector.js":7,"./v2/connector.js":8}],7:[function(require,module,exports){
/*
 * Copyright : Partnering 3.0 (2007-2019)
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

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var isBrowser = typeof window !== 'undefined';
var Promise;
if (!isBrowser) {
	Promise = require('bluebird');
} else {
	Promise = window.Promise;
}

var ConnectorV1 = function () {
	/**
  *	callback : function called after model updated
  * */
	function ConnectorV1(selector) {
		_classCallCheck(this, ConnectorV1);

		this.selector = selector;
		this._coder = selector.encode();
		this.subscriptions = [];

		/** model of robot : available parts and status **/
		this.robotModel = [];
		return this;
	}

	/**
  * Subscribe to error/status updates
  */


	_createClass(ConnectorV1, [{
		key: 'watch',
		value: function watch(robotNames, callback) {
			var _this = this;

			this.selector.setMaxListeners(0);
			this.selector._connection.setMaxListeners(0);
			var sendData = [];
			return Promise.try(function () {
				_this.selector.request({
					service: 'status',
					func: 'GetManagedObjects',
					obj: {
						interface: 'org.freedesktop.DBus.ObjectManager'
					}
				}, function (peerId, err, objData) {
					// get all object paths, interfaces and properties children of Status
					var robotName = '';
					var robotId = 1;
					for (var objectPath in objData) {
						if (objData[objectPath]['fr.partnering.Status.Robot'] != null) {
							robotName = objData[objectPath]['fr.partnering.Status.Robot'].RobotName;
							robotId = objData[objectPath]['fr.partnering.Status.Robot'].RobotId;
							_this.getAllStatuses(robotName, function (model) {
								callback(model, peerId);
							});
						}
						if (objData[objectPath]['fr.partnering.Status.Part'] != null) {
							var subs = _this.selector.subscribe({ // subscribes to status changes for all parts
								service: 'status',
								func: 'StatusChanged',
								obj: {
									interface: 'fr.partnering.Status.Part',
									path: objectPath
								},
								data: robotNames
							}, function (peerId, err, data) {
								if (err != null) {
									Logger.error("StatusSubscribe:" + err);
								} else {
									sendData[0] = data;
									_this._getRobotModelFromRecv(sendData, robotId, robotName);
									if (typeof callback === 'function') {
										callback(_this.robotModel, peerId);
									}
								}
							});
							_this.subscriptions.push(subs);
						}
					}
				});
			}).catch(function (err) {
				Logger.error(err);
			});
		}

		/**
   * Close all subscriptions
   */

	}, {
		key: 'closeSubscriptions',
		value: function closeSubscriptions() {
			for (var i in this.subscriptions) {
				this.subscriptions[i].close();
			}
			this.subscriptions = [];
			this.robotModel = [];
		}

		/**
   * Update internal robot model with received data (version 2)
   * @param  {Object} data data received from DiyaNode by websocket
   * @return {[type]} [description]
   */

	}, {
		key: '_getRobotModelFromRecv',
		value: function _getRobotModelFromRecv(data, robotId, robotName) {
			var _this2 = this;

			if (this.robotModel == null) this.robotModel = [];

			if (this.robotModel[robotId] != null) this.robotModel[robotId].parts = {}; // reset parts

			if (this.robotModel[robotId] == null) this.robotModel[robotId] = {};

			this.robotModel[robotId] = {
				robot: {
					name: robotName
				}
			};

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
				rParts[partId].category = category;
				rParts[partId].name = partName.toLowerCase();
				rParts[partId].label = label;

				if (rParts[partId].errorList == null) rParts[partId].errorList = {};

				if (rParts[partId].errorList[codeRef] == null) rParts[partId].errorList[codeRef] = {
					msg: msg,
					critLevel: critLevel,
					description: description
				};
				var evts_tmp = {
					time: _this2._coder.from(time),
					code: _this2._coder.from(code),
					codeRef: _this2._coder.from(codeRef)
				};
				if (Array.isArray(evts_tmp.code) || Array.isArray(evts_tmp.time) || Array.isArray(evts_tmp.codeRef)) {
					if (evts_tmp.code.length === evts_tmp.codeRef.length && evts_tmp.code.length === evts_tmp.time.length) {
						rParts[partId].evts = [];
						for (var i = 0; i < evts_tmp.code.length; i++) {
							rParts[partId].evts.push({
								time: evts_tmp.time[i],
								code: evts_tmp.code[i],
								codeRef: evts_tmp.codeRef[i]
							});
						}
					} else {
						Logger.error("Status:Inconsistant lengths of buffers (time/code/codeRef)");
					}
				} else {
					/** just in case, to provide backward compatibility **/
					/** set received event **/
					rParts[partId].evts = [{
						time: evts_tmp.time,
						code: evts_tmp.code,
						codeRef: evts_tmp.codeRef
					}];
				}
			});
		}

		/**
  * Set on status
  * @param robotName to find status to modify
  * @param partName 	to find status to modify
  * @param code      newCode
  * @param source    source
  * @param callback  return callback (<bool>success)
  */

	}, {
		key: 'setStatus',
		value: function setStatus(robotName, partName, code, source, callback) {
			var _this3 = this;

			return Promise.try(function () {
				var objectPath = "/fr/partnering/Status/Robots/" + _this3._splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
				_this3.request({
					service: "status",
					func: "SetPart",
					obj: {
						interface: 'fr.partnering.Status.Part',
						path: objectPath
					},
					data: {
						code: code,
						source: source | 1
					}
				}, _this3._onSetPart.bind(_this3, callback));
			}).catch(function (err) {
				Logger.error(err);
			});
		}

		/**
   * Callback on SetPart
   */

	}, {
		key: '_onSetPart',
		value: function _onSetPart(callback, peerId, err, data) {
			if (err != null) {
				if (typeof callback === 'function') callback(false);
			} else {
				if (typeof callback === 'function') callback(true);
			}
		}

		/**
   * Get one status
   * @param robotName to get status
   * @param partName 	to get status
   * @param callback  return callback(-1 if not found/data otherwise)
   * @param _full     more data about status
   */

	}, {
		key: 'getStatus',
		value: function getStatus(robotName, partName, callback /*, _full*/) {
			var _this4 = this;

			return Promise.try(function () {
				_this4.selector.request({
					service: 'status',
					func: 'GetManagedObjects',
					obj: {
						interface: 'org.freedesktop.DBus.ObjectManager'
					}
				}, _this4.onGetManagedObjectsGetStatus.bind(_this4, robotName, partName, callback));
			}).catch(function (err) {
				Logger.error(err);
			});
		}

		/**
   * Callback on GetManagedObjects in GetStatus
   */

	}, {
		key: 'onGetManagedObjectsGetStatus',
		value: function onGetManagedObjectsGetStatus(robotName, partName, callback, peerId, err, data) {
			var objectPathRobot = "/fr/partnering/Status/Robots/" + this._splitAndCamelCase(robotName, "-");
			var objectPathPart = "/fr/partnering/Status/Robots/" + this._splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
			var robotId = data[objectPathRobot]['fr.partnering.Status.Robot'].RobotId;
			this.selector.request({
				service: "status",
				func: "GetPart",
				obj: {
					interface: 'fr.partnering.Status.Part',
					path: objectPathPart
				}
			}, this._onGetPart.bind(this, robotId, robotName, callback));
		}

		/**
   * Callback on GetPart
   */

	}, {
		key: '_onGetPart',
		value: function _onGetPart(robotId, robotName, callback, peerId, err, data) {
			var sendData = [];
			sendData.push(data);
			this._getRobotModelFromRecv(sendData, robotId, robotName);
			if (err != null) {
				if (typeof callback === 'function') callback(-1);
			} else {
				if (typeof callback === 'function') callback(this.robotModel);
			}
		}

		/**
   * Get all status
   * @param robotName to get status
   * @param partName 	to get status
   * @param callback		return callback(-1 if not found/data otherwise)
   * @param _full 	more data about status
   */

	}, {
		key: 'getAllStatuses',
		value: function getAllStatuses(robotName, callback) {
			this.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager'
				}
			}, this._onGetManagedObjectsGetAllStatuses.bind(this, robotName, callback));
		}

		/**
   * Callback on GetManagedObjects in GetAllStatuses
   */

	}, {
		key: '_onGetManagedObjectsGetAllStatuses',
		value: function _onGetManagedObjectsGetAllStatuses(robotName, callback, peerId, err, data) {
			var objectPath = "/fr/partnering/Status/Robots/" + this._splitAndCamelCase(robotName, "-");
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
					}, this._onGetAllParts.bind(this, robotId, robotName, callback));
				} else {
					Logger.error("Interface fr.partnering.Status.Robot doesn't exist!");
				}
			} else {
				Logger.error("ObjectPath " + objectPath + " doesn't exist!");
			}
		}

		/**
   * Callback on GetAllParts
   */

	}, {
		key: '_onGetAllParts',
		value: function _onGetAllParts(robotId, robotName, callback, peerId, err, data) {
			if (err != null) {
				if (typeof callback === 'function') callback(-1);
				throw new Error(err);
			} else {
				this._getRobotModelFromRecv(data, robotId, robotName);
				if (typeof callback === 'function') callback(this.robotModel);
			}
		}
	}, {
		key: '_splitAndCamelCase',
		value: function _splitAndCamelCase(inString, delimiter) {
			var arraySplitString = inString.split(delimiter);
			var outCamelString = '';
			arraySplitString.forEach(function (str) {
				outCamelString += str.charAt(0).toUpperCase() + str.substring(1);
			});
			return outCamelString;
		}
	}]);

	return ConnectorV1;
}();

module.exports = ConnectorV1;

},{"bluebird":undefined}],8:[function(require,module,exports){
/*
 * Copyright : Partnering 3.0 (2007-2019)
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

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = require('debug')('status:connector');

var Watcher = require('./watcher.js');
var ConnectorV1 = require('../v1/connector.js');

var ConnectorV2 = function (_ConnectorV) {
	_inherits(ConnectorV2, _ConnectorV);

	/**
  *	callback : function called after model updated
  * */
	function ConnectorV2(selector) {
		var _ret;

		_classCallCheck(this, ConnectorV2);

		var _this = _possibleConstructorReturn(this, (ConnectorV2.__proto__ || Object.getPrototypeOf(ConnectorV2)).call(this, selector));

		_this.watchers = [];
		return _ret = _this, _possibleConstructorReturn(_this, _ret);
	}

	/**
  * Subscribe to error/status updates
  */


	_createClass(ConnectorV2, [{
		key: 'watch',
		value: function watch(options, callback) {
			var _this2 = this;

			// do not create watcher without a callback
			if (callback == null || typeof callback !== 'function') {
				return null;
			}

			var watcher = new Watcher(this.selector, options);

			// add watcher in watcher list
			this.watchers.push(watcher);

			watcher.on('data', function (data) {
				debug(data);
				callback(_this2._getRobotModelFromRecv(data.parts, data.robotId, data.robotName), data.peerId);
			});
			watcher.on('stop', this._removeWatcher);

			return watcher;
		}

		/**
   * Callback to remove watcher from list
   * @param watcher to be removed
   */

	}, {
		key: '_removeWatcher',
		value: function _removeWatcher(watcher) {
			// find and remove watcher in list
			this.watchers.find(function (el, id, watchers) {
				if (watcher === el) {
					watchers.splice(id, 1); // remove
					return true;
				}
				return false;
			});
		}
	}, {
		key: 'stopWatchers',
		value: function stopWatchers() {
			var _this3 = this;

			this.watchers.forEach(function (watcher) {
				// remove listener on stop event to avoid purging watchers twice
				watcher.removeListener('stop', _this3._removeWatcher);
				watcher.stop();
			});
			this.watchers = [];
		}
	}, {
		key: 'closeSubscriptions',
		value: function closeSubscriptions() {
			console.warn('Deprecared function, use stopWatchers instead');
			this.stopWatchers();
		}

		/**
   * Update internal robot model with received data (version 2)
   * @param  {Array of Array of PartInfo (struct)} data data received from
   *                                                    DiyaNode by websocket
   * @param  {int} robotId id of the robot
   * @param  {string} robotName name of the robot
   * @return {[type]} description]
   */

	}, {
		key: '_getRobotModelFromRecv',
		value: function _getRobotModelFromRecv(data, robotId, robotName) {
			var _this4 = this;

			if (this.robotModel == null) this.robotModel = [];

			if (this.robotModel[robotId] != null) this.robotModel[robotId].parts = {};

			if (this.robotModel[robotId] == null) this.robotModel[robotId] = {};

			this.robotModel[robotId] = {
				robot: {
					name: robotName
				}
			};

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
				rParts[partId].category = category;
				rParts[partId].name = partName.toLowerCase();
				rParts[partId].label = label;

				if (rParts[partId].errorList == null) rParts[partId].errorList = {};

				if (rParts[partId].errorList[codeRef] == null) rParts[partId].errorList[codeRef] = {
					msg: msg,
					critLevel: critLevel,
					description: description
				};
				var evts_tmp = {
					time: _this4._coder.from(time),
					code: _this4._coder.from(code),
					codeRef: _this4._coder.from(codeRef)
				};
				if (rParts[partId].evts == null) {
					rParts[partId].evts = [];
				}
				rParts[partId].evts.push(evts_tmp);
			});
			return this.robotModel;
		}
	}]);

	return ConnectorV2;
}(ConnectorV1);

module.exports = ConnectorV2;

},{"../v1/connector.js":7,"./watcher.js":9,"debug":1}],9:[function(require,module,exports){
/*
 * Copyright : Partnering 3.0 (2007-2019)
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

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('eventemitter3');
var debug = require('debug')('status:watcher');
var debugError = require('debug')('status:watcher:errors');

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
						};
						// Sending part data device (robot) by device
						_this3.emit('data', dataToEmit);
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
			var peers = this.selector._connection.peers().map(function (peer) {
				return peer.toLowerCase().replace('-', '');
			});
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
							// Find product name and id
							var robotName = splitPath[5].toLowerCase();
							if (peers.includes(robotName)) {
								// Interface of the device objects
								var device = obj[iface];
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
					}
				} else if (splitPath.length === 8) {
					// with part path, split path has 8 items
					for (var _iface in obj) {
						if (_iface === "fr.partnering.Status.Part") {
							// Find product name
							var _robotName = splitPath[5].toLowerCase();
							if (peers.includes(_robotName)) {
								// Interface of the part objects
								var part = obj[_iface];
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

},{"debug":1,"eventemitter3":3}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvZGVidWcvc3JjL2RlYnVnLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwic3JjL3N0YXR1cy5qcyIsInNyYy92MS9jb25uZWN0b3IuanMiLCJzcmMvdjIvY29ubmVjdG9yLmpzIiwic3JjL3YyL3dhdGNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDekxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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bUIsa0JBQW5CLEVBQXVDLEtBQXZDLENBQTZDLElBQTdDLENBQWtELE9BQWxEO0FBQ0EsSUExQ0Q7QUEyQ0EsVUFBTyxVQUFQO0FBQ0E7O0FBRUQ7Ozs7d0NBQ3VCO0FBQ3RCLFNBQU0sc0JBQU47QUFDQSxRQUFLLElBQUksQ0FBVCxJQUFjLEtBQUssYUFBbkIsRUFBa0M7QUFDakMsU0FBSyxhQUFMLENBQW1CLENBQW5CLEVBQXNCLEtBQXRCO0FBQ0E7QUFDRCxRQUFLLGFBQUwsR0FBcUIsRUFBckI7QUFDQTs7O3lCQUVPO0FBQ1AsU0FBTSxTQUFOO0FBQ0EsUUFBSyxLQUFMLEdBQWEsU0FBYjtBQUNBLE9BQUksS0FBSyxjQUFMLElBQXVCLElBQTNCLEVBQWlDO0FBQ2hDLGlCQUFhLEtBQUssY0FBbEI7QUFDQTtBQUNELFFBQUssbUJBQUw7QUFDQSxRQUFLLElBQUwsQ0FBVSxNQUFWO0FBQ0EsUUFBSyxrQkFBTDtBQUNBOzs7O0VBdFRvQixZOztBQXlUdEIsT0FBTyxPQUFQLEdBQWlCLE9BQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogVGhpcyBpcyB0aGUgd2ViIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZVxuICAgICAgICAgICAgICAgJiYgJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZS5zdG9yYWdlXG4gICAgICAgICAgICAgICAgICA/IGNocm9tZS5zdG9yYWdlLmxvY2FsXG4gICAgICAgICAgICAgICAgICA6IGxvY2Fsc3RvcmFnZSgpO1xuXG4vKipcbiAqIENvbG9ycy5cbiAqL1xuXG5leHBvcnRzLmNvbG9ycyA9IFtcbiAgJ2xpZ2h0c2VhZ3JlZW4nLFxuICAnZm9yZXN0Z3JlZW4nLFxuICAnZ29sZGVucm9kJyxcbiAgJ2RvZGdlcmJsdWUnLFxuICAnZGFya29yY2hpZCcsXG4gICdjcmltc29uJ1xuXTtcblxuLyoqXG4gKiBDdXJyZW50bHkgb25seSBXZWJLaXQtYmFzZWQgV2ViIEluc3BlY3RvcnMsIEZpcmVmb3ggPj0gdjMxLFxuICogYW5kIHRoZSBGaXJlYnVnIGV4dGVuc2lvbiAoYW55IEZpcmVmb3ggdmVyc2lvbikgYXJlIGtub3duXG4gKiB0byBzdXBwb3J0IFwiJWNcIiBDU1MgY3VzdG9taXphdGlvbnMuXG4gKlxuICogVE9ETzogYWRkIGEgYGxvY2FsU3RvcmFnZWAgdmFyaWFibGUgdG8gZXhwbGljaXRseSBlbmFibGUvZGlzYWJsZSBjb2xvcnNcbiAqL1xuXG5mdW5jdGlvbiB1c2VDb2xvcnMoKSB7XG4gIC8vIE5COiBJbiBhbiBFbGVjdHJvbiBwcmVsb2FkIHNjcmlwdCwgZG9jdW1lbnQgd2lsbCBiZSBkZWZpbmVkIGJ1dCBub3QgZnVsbHlcbiAgLy8gaW5pdGlhbGl6ZWQuIFNpbmNlIHdlIGtub3cgd2UncmUgaW4gQ2hyb21lLCB3ZSdsbCBqdXN0IGRldGVjdCB0aGlzIGNhc2VcbiAgLy8gZXhwbGljaXRseVxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnByb2Nlc3MgJiYgd2luZG93LnByb2Nlc3MudHlwZSA9PT0gJ3JlbmRlcmVyJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gaXMgd2Via2l0PyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNjQ1OTYwNi8zNzY3NzNcbiAgLy8gZG9jdW1lbnQgaXMgdW5kZWZpbmVkIGluIHJlYWN0LW5hdGl2ZTogaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0LW5hdGl2ZS9wdWxsLzE2MzJcbiAgcmV0dXJuICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLldlYmtpdEFwcGVhcmFuY2UpIHx8XG4gICAgLy8gaXMgZmlyZWJ1Zz8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzk4MTIwLzM3Njc3M1xuICAgICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuY29uc29sZSAmJiAod2luZG93LmNvbnNvbGUuZmlyZWJ1ZyB8fCAod2luZG93LmNvbnNvbGUuZXhjZXB0aW9uICYmIHdpbmRvdy5jb25zb2xlLnRhYmxlKSkpIHx8XG4gICAgLy8gaXMgZmlyZWZveCA+PSB2MzE/XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Ub29scy9XZWJfQ29uc29sZSNTdHlsaW5nX21lc3NhZ2VzXG4gICAgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9maXJlZm94XFwvKFxcZCspLykgJiYgcGFyc2VJbnQoUmVnRXhwLiQxLCAxMCkgPj0gMzEpIHx8XG4gICAgLy8gZG91YmxlIGNoZWNrIHdlYmtpdCBpbiB1c2VyQWdlbnQganVzdCBpbiBjYXNlIHdlIGFyZSBpbiBhIHdvcmtlclxuICAgICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvYXBwbGV3ZWJraXRcXC8oXFxkKykvKSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuICdbVW5leHBlY3RlZEpTT05QYXJzZUVycm9yXTogJyArIGVyci5tZXNzYWdlO1xuICB9XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncyhhcmdzKSB7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybjtcblxuICB2YXIgYyA9ICdjb2xvcjogJyArIHRoaXMuY29sb3I7XG4gIGFyZ3Muc3BsaWNlKDEsIDAsIGMsICdjb2xvcjogaW5oZXJpdCcpXG5cbiAgLy8gdGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcbiAgLy8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuICAvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGxhc3RDID0gMDtcbiAgYXJnc1swXS5yZXBsYWNlKC8lW2EtekEtWiVdL2csIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgaWYgKCclJScgPT09IG1hdGNoKSByZXR1cm47XG4gICAgaW5kZXgrKztcbiAgICBpZiAoJyVjJyA9PT0gbWF0Y2gpIHtcbiAgICAgIC8vIHdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuICAgICAgLy8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcbiAgICAgIGxhc3RDID0gaW5kZXg7XG4gICAgfVxuICB9KTtcblxuICBhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG59XG5cbi8qKlxuICogSW52b2tlcyBgY29uc29sZS5sb2coKWAgd2hlbiBhdmFpbGFibGUuXG4gKiBOby1vcCB3aGVuIGBjb25zb2xlLmxvZ2AgaXMgbm90IGEgXCJmdW5jdGlvblwiLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gbG9nKCkge1xuICAvLyB0aGlzIGhhY2tlcnkgaXMgcmVxdWlyZWQgZm9yIElFOC85LCB3aGVyZVxuICAvLyB0aGUgYGNvbnNvbGUubG9nYCBmdW5jdGlvbiBkb2Vzbid0IGhhdmUgJ2FwcGx5J1xuICByZXR1cm4gJ29iamVjdCcgPT09IHR5cGVvZiBjb25zb2xlXG4gICAgJiYgY29uc29sZS5sb2dcbiAgICAmJiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuY2FsbChjb25zb2xlLmxvZywgY29uc29sZSwgYXJndW1lbnRzKTtcbn1cblxuLyoqXG4gKiBTYXZlIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG4gIHRyeSB7XG4gICAgaWYgKG51bGwgPT0gbmFtZXNwYWNlcykge1xuICAgICAgZXhwb3J0cy5zdG9yYWdlLnJlbW92ZUl0ZW0oJ2RlYnVnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMuc3RvcmFnZS5kZWJ1ZyA9IG5hbWVzcGFjZXM7XG4gICAgfVxuICB9IGNhdGNoKGUpIHt9XG59XG5cbi8qKlxuICogTG9hZCBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSByZXR1cm5zIHRoZSBwcmV2aW91c2x5IHBlcnNpc3RlZCBkZWJ1ZyBtb2Rlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbG9hZCgpIHtcbiAgdmFyIHI7XG4gIHRyeSB7XG4gICAgciA9IGV4cG9ydHMuc3RvcmFnZS5kZWJ1ZztcbiAgfSBjYXRjaChlKSB7fVxuXG4gIC8vIElmIGRlYnVnIGlzbid0IHNldCBpbiBMUywgYW5kIHdlJ3JlIGluIEVsZWN0cm9uLCB0cnkgdG8gbG9hZCAkREVCVUdcbiAgaWYgKCFyICYmIHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiAnZW52JyBpbiBwcm9jZXNzKSB7XG4gICAgciA9IHByb2Nlc3MuZW52LkRFQlVHO1xuICB9XG5cbiAgcmV0dXJuIHI7XG59XG5cbi8qKlxuICogRW5hYmxlIG5hbWVzcGFjZXMgbGlzdGVkIGluIGBsb2NhbFN0b3JhZ2UuZGVidWdgIGluaXRpYWxseS5cbiAqL1xuXG5leHBvcnRzLmVuYWJsZShsb2FkKCkpO1xuXG4vKipcbiAqIExvY2Fsc3RvcmFnZSBhdHRlbXB0cyB0byByZXR1cm4gdGhlIGxvY2Fsc3RvcmFnZS5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNhZmFyaSB0aHJvd3NcbiAqIHdoZW4gYSB1c2VyIGRpc2FibGVzIGNvb2tpZXMvbG9jYWxzdG9yYWdlXG4gKiBhbmQgeW91IGF0dGVtcHQgdG8gYWNjZXNzIGl0LlxuICpcbiAqIEByZXR1cm4ge0xvY2FsU3RvcmFnZX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvY2Fsc3RvcmFnZSgpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZTtcbiAgfSBjYXRjaCAoZSkge31cbn1cbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVEZWJ1Zy5kZWJ1ZyA9IGNyZWF0ZURlYnVnWydkZWZhdWx0J10gPSBjcmVhdGVEZWJ1ZztcbmV4cG9ydHMuY29lcmNlID0gY29lcmNlO1xuZXhwb3J0cy5kaXNhYmxlID0gZGlzYWJsZTtcbmV4cG9ydHMuZW5hYmxlID0gZW5hYmxlO1xuZXhwb3J0cy5lbmFibGVkID0gZW5hYmxlZDtcbmV4cG9ydHMuaHVtYW5pemUgPSByZXF1aXJlKCdtcycpO1xuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuICovXG5cbmV4cG9ydHMubmFtZXMgPSBbXTtcbmV4cG9ydHMuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG4gKlxuICogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXIgb3IgdXBwZXItY2FzZSBsZXR0ZXIsIGkuZS4gXCJuXCIgYW5kIFwiTlwiLlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycyA9IHt9O1xuXG4vKipcbiAqIFByZXZpb3VzIGxvZyB0aW1lc3RhbXAuXG4gKi9cblxudmFyIHByZXZUaW1lO1xuXG4vKipcbiAqIFNlbGVjdCBhIGNvbG9yLlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2VsZWN0Q29sb3IobmFtZXNwYWNlKSB7XG4gIHZhciBoYXNoID0gMCwgaTtcblxuICBmb3IgKGkgaW4gbmFtZXNwYWNlKSB7XG4gICAgaGFzaCAgPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIG5hbWVzcGFjZS5jaGFyQ29kZUF0KGkpO1xuICAgIGhhc2ggfD0gMDsgLy8gQ29udmVydCB0byAzMmJpdCBpbnRlZ2VyXG4gIH1cblxuICByZXR1cm4gZXhwb3J0cy5jb2xvcnNbTWF0aC5hYnMoaGFzaCkgJSBleHBvcnRzLmNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBjcmVhdGVEZWJ1ZyhuYW1lc3BhY2UpIHtcblxuICBmdW5jdGlvbiBkZWJ1ZygpIHtcbiAgICAvLyBkaXNhYmxlZD9cbiAgICBpZiAoIWRlYnVnLmVuYWJsZWQpIHJldHVybjtcblxuICAgIHZhciBzZWxmID0gZGVidWc7XG5cbiAgICAvLyBzZXQgYGRpZmZgIHRpbWVzdGFtcFxuICAgIHZhciBjdXJyID0gK25ldyBEYXRlKCk7XG4gICAgdmFyIG1zID0gY3VyciAtIChwcmV2VGltZSB8fCBjdXJyKTtcbiAgICBzZWxmLmRpZmYgPSBtcztcbiAgICBzZWxmLnByZXYgPSBwcmV2VGltZTtcbiAgICBzZWxmLmN1cnIgPSBjdXJyO1xuICAgIHByZXZUaW1lID0gY3VycjtcblxuICAgIC8vIHR1cm4gdGhlIGBhcmd1bWVudHNgIGludG8gYSBwcm9wZXIgQXJyYXlcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgYXJnc1swXSA9IGV4cG9ydHMuY29lcmNlKGFyZ3NbMF0pO1xuXG4gICAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgYXJnc1swXSkge1xuICAgICAgLy8gYW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJU9cbiAgICAgIGFyZ3MudW5zaGlmdCgnJU8nKTtcbiAgICB9XG5cbiAgICAvLyBhcHBseSBhbnkgYGZvcm1hdHRlcnNgIHRyYW5zZm9ybWF0aW9uc1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgYXJnc1swXSA9IGFyZ3NbMF0ucmVwbGFjZSgvJShbYS16QS1aJV0pL2csIGZ1bmN0aW9uKG1hdGNoLCBmb3JtYXQpIHtcbiAgICAgIC8vIGlmIHdlIGVuY291bnRlciBhbiBlc2NhcGVkICUgdGhlbiBkb24ndCBpbmNyZWFzZSB0aGUgYXJyYXkgaW5kZXhcbiAgICAgIGlmIChtYXRjaCA9PT0gJyUlJykgcmV0dXJuIG1hdGNoO1xuICAgICAgaW5kZXgrKztcbiAgICAgIHZhciBmb3JtYXR0ZXIgPSBleHBvcnRzLmZvcm1hdHRlcnNbZm9ybWF0XTtcbiAgICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZm9ybWF0dGVyKSB7XG4gICAgICAgIHZhciB2YWwgPSBhcmdzW2luZGV4XTtcbiAgICAgICAgbWF0Y2ggPSBmb3JtYXR0ZXIuY2FsbChzZWxmLCB2YWwpO1xuXG4gICAgICAgIC8vIG5vdyB3ZSBuZWVkIHRvIHJlbW92ZSBgYXJnc1tpbmRleF1gIHNpbmNlIGl0J3MgaW5saW5lZCBpbiB0aGUgYGZvcm1hdGBcbiAgICAgICAgYXJncy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBpbmRleC0tO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuXG4gICAgLy8gYXBwbHkgZW52LXNwZWNpZmljIGZvcm1hdHRpbmcgKGNvbG9ycywgZXRjLilcbiAgICBleHBvcnRzLmZvcm1hdEFyZ3MuY2FsbChzZWxmLCBhcmdzKTtcblxuICAgIHZhciBsb2dGbiA9IGRlYnVnLmxvZyB8fCBleHBvcnRzLmxvZyB8fCBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpO1xuICAgIGxvZ0ZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICB9XG5cbiAgZGVidWcubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICBkZWJ1Zy5lbmFibGVkID0gZXhwb3J0cy5lbmFibGVkKG5hbWVzcGFjZSk7XG4gIGRlYnVnLnVzZUNvbG9ycyA9IGV4cG9ydHMudXNlQ29sb3JzKCk7XG4gIGRlYnVnLmNvbG9yID0gc2VsZWN0Q29sb3IobmFtZXNwYWNlKTtcblxuICAvLyBlbnYtc3BlY2lmaWMgaW5pdGlhbGl6YXRpb24gbG9naWMgZm9yIGRlYnVnIGluc3RhbmNlc1xuICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGV4cG9ydHMuaW5pdCkge1xuICAgIGV4cG9ydHMuaW5pdChkZWJ1Zyk7XG4gIH1cblxuICByZXR1cm4gZGVidWc7XG59XG5cbi8qKlxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuICogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuICBleHBvcnRzLnNhdmUobmFtZXNwYWNlcyk7XG5cbiAgZXhwb3J0cy5uYW1lcyA9IFtdO1xuICBleHBvcnRzLnNraXBzID0gW107XG5cbiAgdmFyIHNwbGl0ID0gKHR5cGVvZiBuYW1lc3BhY2VzID09PSAnc3RyaW5nJyA/IG5hbWVzcGFjZXMgOiAnJykuc3BsaXQoL1tcXHMsXSsvKTtcbiAgdmFyIGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKCFzcGxpdFtpXSkgY29udGludWU7IC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG4gICAgbmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG4gICAgaWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xuICAgICAgZXhwb3J0cy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcy5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGlzYWJsZSgpIHtcbiAgZXhwb3J0cy5lbmFibGUoJycpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5uYW1lc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG4gIHJldHVybiB2YWw7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG4gICwgcHJlZml4ID0gJ34nO1xuXG4vKipcbiAqIENvbnN0cnVjdG9yIHRvIGNyZWF0ZSBhIHN0b3JhZ2UgZm9yIG91ciBgRUVgIG9iamVjdHMuXG4gKiBBbiBgRXZlbnRzYCBpbnN0YW5jZSBpcyBhIHBsYWluIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIGFyZSBldmVudCBuYW1lcy5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFdmVudHMoKSB7fVxuXG4vL1xuLy8gV2UgdHJ5IHRvIG5vdCBpbmhlcml0IGZyb20gYE9iamVjdC5wcm90b3R5cGVgLiBJbiBzb21lIGVuZ2luZXMgY3JlYXRpbmcgYW5cbi8vIGluc3RhbmNlIGluIHRoaXMgd2F5IGlzIGZhc3RlciB0aGFuIGNhbGxpbmcgYE9iamVjdC5jcmVhdGUobnVsbClgIGRpcmVjdGx5LlxuLy8gSWYgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIG5vdCBzdXBwb3J0ZWQgd2UgcHJlZml4IHRoZSBldmVudCBuYW1lcyB3aXRoIGFcbi8vIGNoYXJhY3RlciB0byBtYWtlIHN1cmUgdGhhdCB0aGUgYnVpbHQtaW4gb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdFxuLy8gb3ZlcnJpZGRlbiBvciB1c2VkIGFzIGFuIGF0dGFjayB2ZWN0b3IuXG4vL1xuaWYgKE9iamVjdC5jcmVhdGUpIHtcbiAgRXZlbnRzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgLy9cbiAgLy8gVGhpcyBoYWNrIGlzIG5lZWRlZCBiZWNhdXNlIHRoZSBgX19wcm90b19fYCBwcm9wZXJ0eSBpcyBzdGlsbCBpbmhlcml0ZWQgaW5cbiAgLy8gc29tZSBvbGQgYnJvd3NlcnMgbGlrZSBBbmRyb2lkIDQsIGlQaG9uZSA1LjEsIE9wZXJhIDExIGFuZCBTYWZhcmkgNS5cbiAgLy9cbiAgaWYgKCFuZXcgRXZlbnRzKCkuX19wcm90b19fKSBwcmVmaXggPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBldmVudCBsaXN0ZW5lci5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29uY2U9ZmFsc2VdIFNwZWNpZnkgaWYgdGhlIGxpc3RlbmVyIGlzIGEgb25lLXRpbWUgbGlzdGVuZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFRShmbiwgY29udGV4dCwgb25jZSkge1xuICB0aGlzLmZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMub25jZSA9IG9uY2UgfHwgZmFsc2U7XG59XG5cbi8qKlxuICogTWluaW1hbCBgRXZlbnRFbWl0dGVyYCBpbnRlcmZhY2UgdGhhdCBpcyBtb2xkZWQgYWdhaW5zdCB0aGUgTm9kZS5qc1xuICogYEV2ZW50RW1pdHRlcmAgaW50ZXJmYWNlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXMgcmVnaXN0ZXJlZFxuICogbGlzdGVuZXJzLlxuICpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uIGV2ZW50TmFtZXMoKSB7XG4gIHZhciBuYW1lcyA9IFtdXG4gICAgLCBldmVudHNcbiAgICAsIG5hbWU7XG5cbiAgaWYgKHRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSByZXR1cm4gbmFtZXM7XG5cbiAgZm9yIChuYW1lIGluIChldmVudHMgPSB0aGlzLl9ldmVudHMpKSB7XG4gICAgaWYgKGhhcy5jYWxsKGV2ZW50cywgbmFtZSkpIG5hbWVzLnB1c2gocHJlZml4ID8gbmFtZS5zbGljZSgxKSA6IG5hbWUpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgICByZXR1cm4gbmFtZXMuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZXZlbnRzKSk7XG4gIH1cblxuICByZXR1cm4gbmFtZXM7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZXhpc3RzIE9ubHkgY2hlY2sgaWYgdGhlcmUgYXJlIGxpc3RlbmVycy5cbiAqIEByZXR1cm5zIHtBcnJheXxCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnQsIGV4aXN0cykge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudFxuICAgICwgYXZhaWxhYmxlID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGV4aXN0cykgcmV0dXJuICEhYXZhaWxhYmxlO1xuICBpZiAoIWF2YWlsYWJsZSkgcmV0dXJuIFtdO1xuICBpZiAoYXZhaWxhYmxlLmZuKSByZXR1cm4gW2F2YWlsYWJsZS5mbl07XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdmFpbGFibGUubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gYXZhaWxhYmxlW2ldLmZuO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBDYWxscyBlYWNoIG9mIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHJldHVybnMge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgZXZlbnQgaGFkIGxpc3RlbmVycywgZWxzZSBgZmFsc2VgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldmVudCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChsaXN0ZW5lcnMub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgbGlzdGVuZXJzLmZuLmFwcGx5KGxpc3RlbmVycy5jb250ZXh0LCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyc1tpXS5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgc3dpdGNoIChsZW4pIHtcbiAgICAgICAgY2FzZSAxOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCk7IGJyZWFrO1xuICAgICAgICBjYXNlIDI6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSk7IGJyZWFrO1xuICAgICAgICBjYXNlIDM6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIpOyBicmVhaztcbiAgICAgICAgY2FzZSA0OiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyLCBhMyk7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIEFkZCBhIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyLCB0aGlzLl9ldmVudHNDb3VudCsrO1xuICBlbHNlIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW3RoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCBhIG9uZS10aW1lIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcywgdHJ1ZSlcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lciwgdGhpcy5fZXZlbnRzQ291bnQrKztcbiAgZWxzZSBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFt0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhlIGxpc3RlbmVycyBvZiBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBPbmx5IHJlbW92ZSB0aGUgbGlzdGVuZXJzIHRoYXQgbWF0Y2ggdGhpcyBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgT25seSByZW1vdmUgdGhlIGxpc3RlbmVycyB0aGF0IGhhdmUgdGhpcyBjb250ZXh0LlxuICogQHBhcmFtIHtCb29sZWFufSBvbmNlIE9ubHkgcmVtb3ZlIG9uZS10aW1lIGxpc3RlbmVycy5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIHRoaXM7XG4gIGlmICghZm4pIHtcbiAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAoXG4gICAgICAgICBsaXN0ZW5lcnMuZm4gPT09IGZuXG4gICAgICAmJiAoIW9uY2UgfHwgbGlzdGVuZXJzLm9uY2UpXG4gICAgICAmJiAoIWNvbnRleHQgfHwgbGlzdGVuZXJzLmNvbnRleHQgPT09IGNvbnRleHQpXG4gICAgKSB7XG4gICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvciAodmFyIGkgPSAwLCBldmVudHMgPSBbXSwgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoXG4gICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbiAhPT0gZm5cbiAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVyc1tpXS5vbmNlKVxuICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnNbaV0uY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICkge1xuICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnNbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vXG4gICAgLy8gUmVzZXQgdGhlIGFycmF5LCBvciByZW1vdmUgaXQgY29tcGxldGVseSBpZiB3ZSBoYXZlIG5vIG1vcmUgbGlzdGVuZXJzLlxuICAgIC8vXG4gICAgaWYgKGV2ZW50cy5sZW5ndGgpIHRoaXMuX2V2ZW50c1tldnRdID0gZXZlbnRzLmxlbmd0aCA9PT0gMSA/IGV2ZW50c1swXSA6IGV2ZW50cztcbiAgICBlbHNlIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMsIG9yIHRob3NlIG9mIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBbZXZlbnRdIFRoZSBldmVudCBuYW1lLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgdmFyIGV2dDtcblxuICBpZiAoZXZlbnQpIHtcbiAgICBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuICAgIGlmICh0aGlzLl9ldmVudHNbZXZ0XSkge1xuICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gQWxpYXMgbWV0aG9kcyBuYW1lcyBiZWNhdXNlIHBlb3BsZSByb2xsIGxpa2UgdGhhdC5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuLy9cbi8vIFRoaXMgZnVuY3Rpb24gZG9lc24ndCBhcHBseSBhbnltb3JlLlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBFeHBvc2UgdGhlIHByZWZpeC5cbi8vXG5FdmVudEVtaXR0ZXIucHJlZml4ZWQgPSBwcmVmaXg7XG5cbi8vXG4vLyBBbGxvdyBgRXZlbnRFbWl0dGVyYCB0byBiZSBpbXBvcnRlZCBhcyBtb2R1bGUgbmFtZXNwYWNlLlxuLy9cbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5pZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG59XG4iLCIvKipcbiAqIEhlbHBlcnMuXG4gKi9cblxudmFyIHMgPSAxMDAwO1xudmFyIG0gPSBzICogNjA7XG52YXIgaCA9IG0gKiA2MDtcbnZhciBkID0gaCAqIDI0O1xudmFyIHkgPSBkICogMzY1LjI1O1xuXG4vKipcbiAqIFBhcnNlIG9yIGZvcm1hdCB0aGUgZ2l2ZW4gYHZhbGAuXG4gKlxuICogT3B0aW9uczpcbiAqXG4gKiAgLSBgbG9uZ2AgdmVyYm9zZSBmb3JtYXR0aW5nIFtmYWxzZV1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IHZhbFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHRocm93cyB7RXJyb3J9IHRocm93IGFuIGVycm9yIGlmIHZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgbnVtYmVyXG4gKiBAcmV0dXJuIHtTdHJpbmd8TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsO1xuICBpZiAodHlwZSA9PT0gJ3N0cmluZycgJiYgdmFsLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gcGFyc2UodmFsKTtcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnbnVtYmVyJyAmJiBpc05hTih2YWwpID09PSBmYWxzZSkge1xuICAgIHJldHVybiBvcHRpb25zLmxvbmcgPyBmbXRMb25nKHZhbCkgOiBmbXRTaG9ydCh2YWwpO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihcbiAgICAndmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSB2YWxpZCBudW1iZXIuIHZhbD0nICtcbiAgICAgIEpTT04uc3RyaW5naWZ5KHZhbClcbiAgKTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGBzdHJgIGFuZCByZXR1cm4gbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICBzdHIgPSBTdHJpbmcoc3RyKTtcbiAgaWYgKHN0ci5sZW5ndGggPiAxMDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG1hdGNoID0gL14oKD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhcbiAgICBzdHJcbiAgKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneXJzJzpcbiAgICBjYXNlICd5cic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnZGF5cyc6XG4gICAgY2FzZSAnZGF5JzpcbiAgICBjYXNlICdkJzpcbiAgICAgIHJldHVybiBuICogZDtcbiAgICBjYXNlICdob3Vycyc6XG4gICAgY2FzZSAnaG91cic6XG4gICAgY2FzZSAnaHJzJzpcbiAgICBjYXNlICdocic6XG4gICAgY2FzZSAnaCc6XG4gICAgICByZXR1cm4gbiAqIGg7XG4gICAgY2FzZSAnbWludXRlcyc6XG4gICAgY2FzZSAnbWludXRlJzpcbiAgICBjYXNlICdtaW5zJzpcbiAgICBjYXNlICdtaW4nOlxuICAgIGNhc2UgJ20nOlxuICAgICAgcmV0dXJuIG4gKiBtO1xuICAgIGNhc2UgJ3NlY29uZHMnOlxuICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgY2FzZSAnc2Vjcyc6XG4gICAgY2FzZSAnc2VjJzpcbiAgICBjYXNlICdzJzpcbiAgICAgIHJldHVybiBuICogcztcbiAgICBjYXNlICdtaWxsaXNlY29uZHMnOlxuICAgIGNhc2UgJ21pbGxpc2Vjb25kJzpcbiAgICBjYXNlICdtc2Vjcyc6XG4gICAgY2FzZSAnbXNlYyc6XG4gICAgY2FzZSAnbXMnOlxuICAgICAgcmV0dXJuIG47XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBTaG9ydCBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBmbXRTaG9ydChtcykge1xuICBpZiAobXMgPj0gZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIH1cbiAgaWYgKG1zID49IGgpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICB9XG4gIGlmIChtcyA+PSBtKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgfVxuICBpZiAobXMgPj0gcykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIH1cbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgcmV0dXJuIHBsdXJhbChtcywgZCwgJ2RheScpIHx8XG4gICAgcGx1cmFsKG1zLCBoLCAnaG91cicpIHx8XG4gICAgcGx1cmFsKG1zLCBtLCAnbWludXRlJykgfHxcbiAgICBwbHVyYWwobXMsIHMsICdzZWNvbmQnKSB8fFxuICAgIG1zICsgJyBtcyc7XG59XG5cbi8qKlxuICogUGx1cmFsaXphdGlvbiBoZWxwZXIuXG4gKi9cblxuZnVuY3Rpb24gcGx1cmFsKG1zLCBuLCBuYW1lKSB7XG4gIGlmIChtcyA8IG4pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKG1zIDwgbiAqIDEuNSkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKG1zIC8gbikgKyAnICcgKyBuYW1lO1xuICB9XG4gIHJldHVybiBNYXRoLmNlaWwobXMgLyBuKSArICcgJyArIG5hbWUgKyAncyc7XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLypcbiAqIENvcHlyaWdodCA6IFBhcnRuZXJpbmcgMy4wICgyMDA3LTIwMTkpXG4gKiBBdXRob3IgOiBTeWx2YWluIE1haMOpIDxzeWx2YWluLm1haGVAcGFydG5lcmluZy5mcj5cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBkaXlhLXNkay5cbiAqXG4gKiBkaXlhLXNkayBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBkaXlhLXNkayBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCBkaXlhLXNkay4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXHRjb25zdCBDb25uZWN0b3JWMSA9IHJlcXVpcmUoXCIuL3YxL2Nvbm5lY3Rvci5qc1wiKTtcblx0Y29uc3QgQ29ubmVjdG9yVjIgPSByZXF1aXJlKGAuL3YyL2Nvbm5lY3Rvci5qc2ApXG5cblx0bGV0IERpeWFTZWxlY3RvciA9IGQxLkRpeWFTZWxlY3RvcjtcblxuXHQvKiogY3JlYXRlIFN0YXR1cyBzZXJ2aWNlICoqL1xuXHREaXlhU2VsZWN0b3IucHJvdG90eXBlLlN0YXR1cyA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoIChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHRoaXMucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnR2V0QVBJVmVyc2lvbicsXG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0aWYgKGVyciA9PSBudWxsKSB7XG5cdFx0XHRcdFx0cmVzb2x2ZShkYXRhKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZWplY3QoZXJyKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9KVxuXHRcdC50aGVuKCAoZGF0YSkgPT4ge1xuXHRcdFx0aWYgKGRhdGEgPT09IDIpIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBDb25uZWN0b3JWMih0aGlzKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluc3RhbnRpYXRlIGNvbm5lY3RvcicpXG5cdFx0XHR9XG5cdFx0fSlcblx0XHQuY2F0Y2goIChlcnIpID0+IHtcblx0XHRcdGlmIChlcnIuaW5jbHVkZXMoXCJNZXRob2QgJ0dldEFQSVZlcnNpb24nIG5vdCBmb3VuZCBpbiBpbnRyb3NwZWN0aW9uIGRhdGFcIikpIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBDb25uZWN0b3JWMSh0aGlzKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihlcnIpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xufSkoKVxuIiwiLypcbiAqIENvcHlyaWdodCA6IFBhcnRuZXJpbmcgMy4wICgyMDA3LTIwMTkpXG4gKiBBdXRob3IgOiBTeWx2YWluIE1haMOpIDxzeWx2YWluLm1haGVAcGFydG5lcmluZy5mcj5cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBkaXlhLXNkay5cbiAqXG4gKiBkaXlhLXNkayBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBkaXlhLXNkayBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCBkaXlhLXNkay4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBpc0Jyb3dzZXIgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpO1xudmFyIFByb21pc2U7XG5pZiAoIWlzQnJvd3NlcikgeyBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTsgfVxuZWxzZSB7IFByb21pc2UgPSB3aW5kb3cuUHJvbWlzZTsgfVxuXG5cbmNsYXNzIENvbm5lY3RvclYxIHtcblx0LyoqXG5cdCAqXHRjYWxsYmFjayA6IGZ1bmN0aW9uIGNhbGxlZCBhZnRlciBtb2RlbCB1cGRhdGVkXG5cdCAqICovXG5cdGNvbnN0cnVjdG9yKHNlbGVjdG9yKSB7XG5cdFx0dGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yO1xuXHRcdHRoaXMuX2NvZGVyID0gc2VsZWN0b3IuZW5jb2RlKCk7XG5cdFx0dGhpcy5zdWJzY3JpcHRpb25zID0gW107XG5cblx0XHQvKiogbW9kZWwgb2Ygcm9ib3QgOiBhdmFpbGFibGUgcGFydHMgYW5kIHN0YXR1cyAqKi9cblx0XHR0aGlzLnJvYm90TW9kZWwgPSBbXTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8qKlxuXHQgKiBTdWJzY3JpYmUgdG8gZXJyb3Ivc3RhdHVzIHVwZGF0ZXNcblx0ICovXG5cdHdhdGNoIChyb2JvdE5hbWVzLCBjYWxsYmFjaykge1xuXHRcdHRoaXMuc2VsZWN0b3Iuc2V0TWF4TGlzdGVuZXJzKDApO1xuXHRcdHRoaXMuc2VsZWN0b3IuX2Nvbm5lY3Rpb24uc2V0TWF4TGlzdGVuZXJzKDApO1xuXHRcdGxldCBzZW5kRGF0YSA9IFtdO1xuXHRcdHJldHVybiBQcm9taXNlLnRyeSggKCkgPT4ge1xuXHRcdFx0dGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0XHRcdGZ1bmM6ICdHZXRNYW5hZ2VkT2JqZWN0cycsXG5cdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdGludGVyZmFjZTogJ29yZy5mcmVlZGVza3RvcC5EQnVzLk9iamVjdE1hbmFnZXInLFxuXHRcdFx0XHR9XG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIG9iakRhdGEpID0+IHsgLy8gZ2V0IGFsbCBvYmplY3QgcGF0aHMsIGludGVyZmFjZXMgYW5kIHByb3BlcnRpZXMgY2hpbGRyZW4gb2YgU3RhdHVzXG5cdFx0XHRcdGxldCByb2JvdE5hbWUgPSAnJztcblx0XHRcdFx0bGV0IHJvYm90SWQgPSAxO1xuXHRcdFx0XHRmb3IgKGxldCBvYmplY3RQYXRoIGluIG9iakRhdGEpIHtcblx0XHRcdFx0XHRpZiAob2JqRGF0YVtvYmplY3RQYXRoXVsnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRyb2JvdE5hbWUgPSBvYmpEYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90TmFtZTtcblx0XHRcdFx0XHRcdHJvYm90SWQgPSBvYmpEYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90SWQ7XG5cdFx0XHRcdFx0XHR0aGlzLmdldEFsbFN0YXR1c2VzKHJvYm90TmFtZSwgZnVuY3Rpb24gKG1vZGVsKSB7XG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrKG1vZGVsLCBwZWVySWQpO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKG9iakRhdGFbb2JqZWN0UGF0aF1bJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnXSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRsZXQgc3VicyA9IHRoaXMuc2VsZWN0b3Iuc3Vic2NyaWJlKHsvLyBzdWJzY3JpYmVzIHRvIHN0YXR1cyBjaGFuZ2VzIGZvciBhbGwgcGFydHNcblx0XHRcdFx0XHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0XHRcdFx0XHRcdGZ1bmM6ICdTdGF0dXNDaGFuZ2VkJyxcblx0XHRcdFx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCcsXG5cdFx0XHRcdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRkYXRhOiByb2JvdE5hbWVzXG5cdFx0XHRcdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiU3RhdHVzU3Vic2NyaWJlOlwiICsgZXJyKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRzZW5kRGF0YVswXSA9IGRhdGE7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5fZ2V0Um9ib3RNb2RlbEZyb21SZWN2KHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGNhbGxiYWNrKHRoaXMucm9ib3RNb2RlbCwgcGVlcklkKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zLnB1c2goc3Vicyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH0pXG5cdFx0LmNhdGNoKCBlcnIgPT4ge1xuXHRcdFx0TG9nZ2VyLmVycm9yKGVycik7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogQ2xvc2UgYWxsIHN1YnNjcmlwdGlvbnNcblx0ICovXG5cdGNsb3NlU3Vic2NyaXB0aW9ucyAoKSB7XG5cdFx0Zm9yICh2YXIgaSBpbiB0aGlzLnN1YnNjcmlwdGlvbnMpIHtcblx0XHRcdHRoaXMuc3Vic2NyaXB0aW9uc1tpXS5jbG9zZSgpO1xuXHRcdH1cblx0XHR0aGlzLnN1YnNjcmlwdGlvbnMgPSBbXTtcblx0XHR0aGlzLnJvYm90TW9kZWwgPSBbXTtcblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgaW50ZXJuYWwgcm9ib3QgbW9kZWwgd2l0aCByZWNlaXZlZCBkYXRhICh2ZXJzaW9uIDIpXG5cdCAqIEBwYXJhbSAge09iamVjdH0gZGF0YSBkYXRhIHJlY2VpdmVkIGZyb20gRGl5YU5vZGUgYnkgd2Vic29ja2V0XG5cdCAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0X2dldFJvYm90TW9kZWxGcm9tUmVjdiAoZGF0YSwgcm9ib3RJZCwgcm9ib3ROYW1lKSB7XG5cdFx0aWYgKHRoaXMucm9ib3RNb2RlbCA9PSBudWxsKVxuXHRcdFx0dGhpcy5yb2JvdE1vZGVsID0gW107XG5cblx0XHRpZiAodGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdICE9IG51bGwpXG5cdFx0XHR0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0ucGFydHMgPSB7fTsgLy8gcmVzZXQgcGFydHNcblxuXHRcdGlmICh0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0gPT0gbnVsbClcblx0XHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSA9IHt9O1xuXG5cdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdID0ge1xuXHRcdFx0cm9ib3Q6IHtcblx0XHRcdFx0bmFtZTogcm9ib3ROYW1lXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXS5wYXJ0cyA9IHt9O1xuXHRcdGxldCByUGFydHMgPSB0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0ucGFydHM7XG5cblx0XHRkYXRhLmZvckVhY2goIGQgPT4ge1xuXHRcdFx0bGV0IHBhcnRJZCA9IGRbMF07XG5cdFx0XHRsZXQgY2F0ZWdvcnkgPSBkWzFdO1xuXHRcdFx0bGV0IHBhcnROYW1lID0gZFsyXTtcblx0XHRcdGxldCBsYWJlbCA9IGRbM107XG5cdFx0XHRsZXQgdGltZSA9IGRbNF07XG5cdFx0XHRsZXQgY29kZSA9IGRbNV07XG5cdFx0XHRsZXQgY29kZVJlZiA9IGRbNl07XG5cdFx0XHRsZXQgbXNnID0gZFs3XTtcblx0XHRcdGxldCBjcml0TGV2ZWwgPSBkWzhdO1xuXHRcdFx0bGV0IGRlc2NyaXB0aW9uID0gZFs5XTtcblxuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdID09IG51bGwpIHtcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0gPSB7fTtcblx0XHRcdH1cblx0XHRcdHJQYXJ0c1twYXJ0SWRdLmNhdGVnb3J5ID0gY2F0ZWdvcnk7XG5cdFx0XHRyUGFydHNbcGFydElkXS5uYW1lID0gcGFydE5hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdHJQYXJ0c1twYXJ0SWRdLmxhYmVsID0gbGFiZWw7XG5cblx0XHRcdGlmIChyUGFydHNbcGFydElkXS5lcnJvckxpc3QgPT0gbnVsbClcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0ID0ge307XG5cblx0XHRcdGlmIChyUGFydHNbcGFydElkXS5lcnJvckxpc3RbY29kZVJlZl0gPT0gbnVsbClcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0W2NvZGVSZWZdID0ge1xuXHRcdFx0XHRcdG1zZzogbXNnLFxuXHRcdFx0XHRcdGNyaXRMZXZlbDogY3JpdExldmVsLFxuXHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuXHRcdFx0XHR9O1xuXHRcdFx0bGV0IGV2dHNfdG1wID0ge1xuXHRcdFx0XHR0aW1lOiB0aGlzLl9jb2Rlci5mcm9tKHRpbWUpLFxuXHRcdFx0XHRjb2RlOiB0aGlzLl9jb2Rlci5mcm9tKGNvZGUpLFxuXHRcdFx0XHRjb2RlUmVmOiB0aGlzLl9jb2Rlci5mcm9tKGNvZGVSZWYpXG5cdFx0XHR9O1xuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoZXZ0c190bXAuY29kZSkgfHwgQXJyYXkuaXNBcnJheShldnRzX3RtcC50aW1lKVxuXHRcdFx0XHR8fCBBcnJheS5pc0FycmF5KGV2dHNfdG1wLmNvZGVSZWYpKSB7XG5cdFx0XHRcdGlmIChldnRzX3RtcC5jb2RlLmxlbmd0aCA9PT0gZXZ0c190bXAuY29kZVJlZi5sZW5ndGhcblx0XHRcdFx0XHQmJiBldnRzX3RtcC5jb2RlLmxlbmd0aCA9PT0gZXZ0c190bXAudGltZS5sZW5ndGgpIHtcblx0XHRcdFx0XHRyUGFydHNbcGFydElkXS5ldnRzID0gW107XG5cdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBldnRzX3RtcC5jb2RlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRyUGFydHNbcGFydElkXS5ldnRzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHR0aW1lOiBldnRzX3RtcC50aW1lW2ldLFxuXHRcdFx0XHRcdFx0XHRjb2RlOiBldnRzX3RtcC5jb2RlW2ldLFxuXHRcdFx0XHRcdFx0XHRjb2RlUmVmOiBldnRzX3RtcC5jb2RlUmVmW2ldXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiU3RhdHVzOkluY29uc2lzdGFudCBsZW5ndGhzIG9mIGJ1ZmZlcnMgKHRpbWUvY29kZS9jb2RlUmVmKVwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHsgLyoqIGp1c3QgaW4gY2FzZSwgdG8gcHJvdmlkZSBiYWNrd2FyZCBjb21wYXRpYmlsaXR5ICoqL1xuXHRcdFx0XHQvKiogc2V0IHJlY2VpdmVkIGV2ZW50ICoqL1xuXHRcdFx0XHRyUGFydHNbcGFydElkXS5ldnRzID0gW3tcblx0XHRcdFx0XHR0aW1lOiBldnRzX3RtcC50aW1lLFxuXHRcdFx0XHRcdGNvZGU6IGV2dHNfdG1wLmNvZGUsXG5cdFx0XHRcdFx0Y29kZVJlZjogZXZ0c190bXAuY29kZVJlZlxuXHRcdFx0XHR9XTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG4gICAgLyoqXG5cdCAqIFNldCBvbiBzdGF0dXNcblx0ICogQHBhcmFtIHJvYm90TmFtZSB0byBmaW5kIHN0YXR1cyB0byBtb2RpZnlcblx0ICogQHBhcmFtIHBhcnROYW1lIFx0dG8gZmluZCBzdGF0dXMgdG8gbW9kaWZ5XG5cdCAqIEBwYXJhbSBjb2RlICAgICAgbmV3Q29kZVxuXHQgKiBAcGFyYW0gc291cmNlICAgIHNvdXJjZVxuXHQgKiBAcGFyYW0gY2FsbGJhY2sgIHJldHVybiBjYWxsYmFjayAoPGJvb2w+c3VjY2Vzcylcblx0ICovXG5cdHNldFN0YXR1cyAocm9ib3ROYW1lLCBwYXJ0TmFtZSwgY29kZSwgc291cmNlLCBjYWxsYmFjaykge1xuXHRcdHJldHVybiBQcm9taXNlLnRyeSggKCkgPT4ge1xuXHRcdFx0dmFyIG9iamVjdFBhdGggPSBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1cy9Sb2JvdHMvXCIgKyB0aGlzLl9zcGxpdEFuZENhbWVsQ2FzZShyb2JvdE5hbWUsIFwiLVwiKSArIFwiL1BhcnRzL1wiICsgcGFydE5hbWU7XG5cdFx0XHR0aGlzLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiBcInN0YXR1c1wiLFxuXHRcdFx0XHRmdW5jOiBcIlNldFBhcnRcIixcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCcsXG5cdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0Y29kZTogY29kZSxcblx0XHRcdFx0XHRzb3VyY2U6IHNvdXJjZSB8IDFcblx0XHRcdFx0fVxuXHRcdFx0fSwgdGhpcy5fb25TZXRQYXJ0LmJpbmQodGhpcywgY2FsbGJhY2spKTtcblx0XHR9KVxuXHRcdC5jYXRjaCggZXJyID0+IHtcblx0XHRcdExvZ2dlci5lcnJvcihlcnIpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIG9uIFNldFBhcnRcblx0ICovXG5cdF9vblNldFBhcnQgKGNhbGxiYWNrLCBwZWVySWQsIGVyciwgZGF0YSkge1xuXHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soZmFsc2UpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayh0cnVlKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogR2V0IG9uZSBzdGF0dXNcblx0ICogQHBhcmFtIHJvYm90TmFtZSB0byBnZXQgc3RhdHVzXG5cdCAqIEBwYXJhbSBwYXJ0TmFtZSBcdHRvIGdldCBzdGF0dXNcblx0ICogQHBhcmFtIGNhbGxiYWNrICByZXR1cm4gY2FsbGJhY2soLTEgaWYgbm90IGZvdW5kL2RhdGEgb3RoZXJ3aXNlKVxuXHQgKiBAcGFyYW0gX2Z1bGwgICAgIG1vcmUgZGF0YSBhYm91dCBzdGF0dXNcblx0ICovXG5cdGdldFN0YXR1cyAocm9ib3ROYW1lLCBwYXJ0TmFtZSwgY2FsbGJhY2svKiwgX2Z1bGwqLykge1xuXHRcdHJldHVybiBQcm9taXNlLnRyeSggKCkgPT4ge1xuXHRcdFx0dGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0XHRcdGZ1bmM6ICdHZXRNYW5hZ2VkT2JqZWN0cycsXG5cdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdGludGVyZmFjZTogJ29yZy5mcmVlZGVza3RvcC5EQnVzLk9iamVjdE1hbmFnZXInLFxuXHRcdFx0XHR9XG5cdFx0XHR9LCB0aGlzLm9uR2V0TWFuYWdlZE9iamVjdHNHZXRTdGF0dXMuYmluZCh0aGlzLCByb2JvdE5hbWUsIHBhcnROYW1lLCBjYWxsYmFjaykpO1xuXHRcdH0pXG5cdFx0LmNhdGNoKCBlcnIgPT4ge1xuXHRcdFx0TG9nZ2VyLmVycm9yKGVycik7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogQ2FsbGJhY2sgb24gR2V0TWFuYWdlZE9iamVjdHMgaW4gR2V0U3RhdHVzXG5cdCAqL1xuXHRvbkdldE1hbmFnZWRPYmplY3RzR2V0U3RhdHVzIChyb2JvdE5hbWUsIHBhcnROYW1lLCBjYWxsYmFjaywgcGVlcklkLCBlcnIsIGRhdGEpIHtcblx0XHRsZXQgb2JqZWN0UGF0aFJvYm90ID0gXCIvZnIvcGFydG5lcmluZy9TdGF0dXMvUm9ib3RzL1wiICsgdGhpcy5fc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIik7XG5cdFx0bGV0IG9iamVjdFBhdGhQYXJ0ID0gXCIvZnIvcGFydG5lcmluZy9TdGF0dXMvUm9ib3RzL1wiICsgdGhpcy5fc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIikgKyBcIi9QYXJ0cy9cIiArIHBhcnROYW1lO1xuXHRcdGxldCByb2JvdElkID0gZGF0YVtvYmplY3RQYXRoUm9ib3RdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90SWRcblx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdGZ1bmM6IFwiR2V0UGFydFwiLFxuXHRcdFx0b2JqOiB7XG5cdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnLFxuXHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoUGFydFxuXHRcdFx0fVxuXHRcdH0sIHRoaXMuX29uR2V0UGFydC5iaW5kKHRoaXMsIHJvYm90SWQsIHJvYm90TmFtZSwgY2FsbGJhY2spKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBvbiBHZXRQYXJ0XG5cdCAqL1xuXHRfb25HZXRQYXJ0IChyb2JvdElkLCByb2JvdE5hbWUsIGNhbGxiYWNrLCBwZWVySWQsIGVyciwgZGF0YSkge1xuXHRcdGxldCBzZW5kRGF0YSA9IFtdXG5cdFx0c2VuZERhdGEucHVzaChkYXRhKVxuXHRcdHRoaXMuX2dldFJvYm90TW9kZWxGcm9tUmVjdihzZW5kRGF0YSwgcm9ib3RJZCwgcm9ib3ROYW1lKTtcblx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKC0xKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2sodGhpcy5yb2JvdE1vZGVsKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogR2V0IGFsbCBzdGF0dXNcblx0ICogQHBhcmFtIHJvYm90TmFtZSB0byBnZXQgc3RhdHVzXG5cdCAqIEBwYXJhbSBwYXJ0TmFtZSBcdHRvIGdldCBzdGF0dXNcblx0ICogQHBhcmFtIGNhbGxiYWNrXHRcdHJldHVybiBjYWxsYmFjaygtMSBpZiBub3QgZm91bmQvZGF0YSBvdGhlcndpc2UpXG5cdCAqIEBwYXJhbSBfZnVsbCBcdG1vcmUgZGF0YSBhYm91dCBzdGF0dXNcblx0ICovXG5cdGdldEFsbFN0YXR1c2VzIChyb2JvdE5hbWUsIGNhbGxiYWNrKSB7XG5cdFx0dGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0ZnVuYzogJ0dldE1hbmFnZWRPYmplY3RzJyxcblx0XHRcdG9iajoge1xuXHRcdFx0XHRpbnRlcmZhY2U6ICdvcmcuZnJlZWRlc2t0b3AuREJ1cy5PYmplY3RNYW5hZ2VyJyxcblx0XHRcdH1cblx0XHR9LCB0aGlzLl9vbkdldE1hbmFnZWRPYmplY3RzR2V0QWxsU3RhdHVzZXMuYmluZCh0aGlzLCByb2JvdE5hbWUsIGNhbGxiYWNrKSlcblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBvbiBHZXRNYW5hZ2VkT2JqZWN0cyBpbiBHZXRBbGxTdGF0dXNlc1xuXHQgKi9cblx0X29uR2V0TWFuYWdlZE9iamVjdHNHZXRBbGxTdGF0dXNlcyAocm9ib3ROYW1lLCBjYWxsYmFjaywgcGVlcklkLCBlcnIsIGRhdGEpIHtcblx0XHRsZXQgb2JqZWN0UGF0aCA9IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9cIiArIHRoaXMuX3NwbGl0QW5kQ2FtZWxDYXNlKHJvYm90TmFtZSwgXCItXCIpO1xuXHRcdGlmIChkYXRhW29iamVjdFBhdGhdICE9IG51bGwpIHtcblx0XHRcdGlmIChkYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddICE9IG51bGwpIHtcblx0XHRcdFx0bGV0IHJvYm90SWQgPSBkYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90SWRcblx0XHRcdFx0Ly92YXIgZnVsbCA9IF9mdWxsIHx8IGZhbHNlO1xuXHRcdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRcdFx0ZnVuYzogXCJHZXRBbGxQYXJ0c1wiLFxuXHRcdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnLFxuXHRcdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgdGhpcy5fb25HZXRBbGxQYXJ0cy5iaW5kKHRoaXMsIHJvYm90SWQsIHJvYm90TmFtZSwgY2FsbGJhY2spKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdExvZ2dlci5lcnJvcihcIkludGVyZmFjZSBmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCBkb2Vzbid0IGV4aXN0IVwiKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0TG9nZ2VyLmVycm9yKFwiT2JqZWN0UGF0aCBcIiArIG9iamVjdFBhdGggKyBcIiBkb2Vzbid0IGV4aXN0IVwiKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQ2FsbGJhY2sgb24gR2V0QWxsUGFydHNcblx0ICovXG5cdF9vbkdldEFsbFBhcnRzIChyb2JvdElkLCByb2JvdE5hbWUsIGNhbGxiYWNrLCBwZWVySWQsIGVyciwgZGF0YSkge1xuXHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soLTEpO1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGVycik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuX2dldFJvYm90TW9kZWxGcm9tUmVjdihkYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2sodGhpcy5yb2JvdE1vZGVsKTtcblx0XHR9XG5cdH1cblxuXHRfc3BsaXRBbmRDYW1lbENhc2UgKGluU3RyaW5nLCBkZWxpbWl0ZXIpIHtcblx0XHRsZXQgYXJyYXlTcGxpdFN0cmluZyA9IGluU3RyaW5nLnNwbGl0KGRlbGltaXRlcik7XG5cdFx0bGV0IG91dENhbWVsU3RyaW5nID0gJyc7XG5cdFx0YXJyYXlTcGxpdFN0cmluZy5mb3JFYWNoKCBzdHIgPT4ge1xuXHRcdFx0b3V0Q2FtZWxTdHJpbmcgKz0gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyLnN1YnN0cmluZygxKTtcblx0XHR9KTtcblx0XHRyZXR1cm4gb3V0Q2FtZWxTdHJpbmc7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb25uZWN0b3JWMTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgOiBQYXJ0bmVyaW5nIDMuMCAoMjAwNy0yMDE5KVxuICogQXV0aG9yIDogU3lsdmFpbiBNYWjDqSA8c3lsdmFpbi5tYWhlQHBhcnRuZXJpbmcuZnI+XG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgZGl5YS1zZGsuXG4gKlxuICogZGl5YS1zZGsgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogZGl5YS1zZGsgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggZGl5YS1zZGsuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ3N0YXR1czpjb25uZWN0b3InKTtcblxudmFyIFdhdGNoZXIgPSByZXF1aXJlKCcuL3dhdGNoZXIuanMnKTtcbnZhciBDb25uZWN0b3JWMSA9IHJlcXVpcmUoJy4uL3YxL2Nvbm5lY3Rvci5qcycpO1xuXG5jbGFzcyBDb25uZWN0b3JWMiBleHRlbmRzIENvbm5lY3RvclYxIHtcblx0LyoqXG5cdCAqXHRjYWxsYmFjayA6IGZ1bmN0aW9uIGNhbGxlZCBhZnRlciBtb2RlbCB1cGRhdGVkXG5cdCAqICovXG5cdGNvbnN0cnVjdG9yKHNlbGVjdG9yKSB7XG5cdFx0c3VwZXIoc2VsZWN0b3IpO1xuXHRcdHRoaXMud2F0Y2hlcnMgPSBbXTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8qKlxuXHQgKiBTdWJzY3JpYmUgdG8gZXJyb3Ivc3RhdHVzIHVwZGF0ZXNcblx0ICovXG5cdHdhdGNoIChvcHRpb25zLCBjYWxsYmFjaykge1xuXG5cdFx0Ly8gZG8gbm90IGNyZWF0ZSB3YXRjaGVyIHdpdGhvdXQgYSBjYWxsYmFja1xuXHRcdGlmIChjYWxsYmFjayA9PSBudWxsIHx8IHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXG5cdFx0bGV0IHdhdGNoZXIgPSBuZXcgV2F0Y2hlcih0aGlzLnNlbGVjdG9yLCBvcHRpb25zKTtcblxuXHRcdC8vIGFkZCB3YXRjaGVyIGluIHdhdGNoZXIgbGlzdFxuXHRcdHRoaXMud2F0Y2hlcnMucHVzaCh3YXRjaGVyKTtcblxuXHRcdHdhdGNoZXIub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xuXHRcdFx0ZGVidWcoZGF0YSk7XG5cdFx0XHRjYWxsYmFjayh0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YoZGF0YS5wYXJ0cyxcblx0XHRcdFx0ZGF0YS5yb2JvdElkLFxuXHRcdFx0XHRkYXRhLnJvYm90TmFtZSksXG5cdFx0XHRcdGRhdGEucGVlcklkKVxuXHRcdH0pO1xuXHRcdHdhdGNoZXIub24oJ3N0b3AnLCB0aGlzLl9yZW1vdmVXYXRjaGVyKTtcblxuXHRcdHJldHVybiB3YXRjaGVyO1xuXHR9XG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIHRvIHJlbW92ZSB3YXRjaGVyIGZyb20gbGlzdFxuXHQgKiBAcGFyYW0gd2F0Y2hlciB0byBiZSByZW1vdmVkXG5cdCAqL1xuXHRfcmVtb3ZlV2F0Y2hlciAod2F0Y2hlcikge1xuXHRcdC8vIGZpbmQgYW5kIHJlbW92ZSB3YXRjaGVyIGluIGxpc3Rcblx0XHR0aGlzLndhdGNoZXJzLmZpbmQoIChlbCwgaWQsIHdhdGNoZXJzKSA9PiB7XG5cdFx0XHRpZiAod2F0Y2hlciA9PT0gZWwpIHtcblx0XHRcdFx0d2F0Y2hlcnMuc3BsaWNlKGlkLCAxKTsgLy8gcmVtb3ZlXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0pO1xuXHR9XG5cblx0c3RvcFdhdGNoZXJzICgpIHtcblx0XHR0aGlzLndhdGNoZXJzLmZvckVhY2goIHdhdGNoZXIgPT4ge1xuXHRcdFx0Ly8gcmVtb3ZlIGxpc3RlbmVyIG9uIHN0b3AgZXZlbnQgdG8gYXZvaWQgcHVyZ2luZyB3YXRjaGVycyB0d2ljZVxuXHRcdFx0d2F0Y2hlci5yZW1vdmVMaXN0ZW5lcignc3RvcCcsIHRoaXMuX3JlbW92ZVdhdGNoZXIpO1xuXHRcdFx0d2F0Y2hlci5zdG9wKCk7XG5cdFx0fSk7XG5cdFx0dGhpcy53YXRjaGVycyA9IFtdO1xuXHR9XG5cblx0Y2xvc2VTdWJzY3JpcHRpb25zICgpIHtcblx0XHRjb25zb2xlLndhcm4oJ0RlcHJlY2FyZWQgZnVuY3Rpb24sIHVzZSBzdG9wV2F0Y2hlcnMgaW5zdGVhZCcpO1xuXHRcdHRoaXMuc3RvcFdhdGNoZXJzKCk7XG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlIGludGVybmFsIHJvYm90IG1vZGVsIHdpdGggcmVjZWl2ZWQgZGF0YSAodmVyc2lvbiAyKVxuXHQgKiBAcGFyYW0gIHtBcnJheSBvZiBBcnJheSBvZiBQYXJ0SW5mbyAoc3RydWN0KX0gZGF0YSBkYXRhIHJlY2VpdmVkIGZyb21cblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGl5YU5vZGUgYnkgd2Vic29ja2V0XG5cdCAqIEBwYXJhbSAge2ludH0gcm9ib3RJZCBpZCBvZiB0aGUgcm9ib3Rcblx0ICogQHBhcmFtICB7c3RyaW5nfSByb2JvdE5hbWUgbmFtZSBvZiB0aGUgcm9ib3Rcblx0ICogQHJldHVybiB7W3R5cGVdfSBkZXNjcmlwdGlvbl1cblx0ICovXG5cdF9nZXRSb2JvdE1vZGVsRnJvbVJlY3YgKGRhdGEsIHJvYm90SWQsIHJvYm90TmFtZSkge1xuXHRcdGlmICh0aGlzLnJvYm90TW9kZWwgPT0gbnVsbClcblx0XHRcdHRoaXMucm9ib3RNb2RlbCA9IFtdO1xuXG5cdFx0aWYgKHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSAhPSBudWxsKVxuXHRcdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdLnBhcnRzID0ge307XG5cblx0XHRpZiAodGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdID09IG51bGwpXG5cdFx0XHR0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0gPSB7fTtcblxuXHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSA9IHtcblx0XHRcdHJvYm90OiB7XG5cdFx0XHRcdG5hbWU6IHJvYm90TmFtZVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0ucGFydHMgPSB7fTtcblx0XHRsZXQgclBhcnRzID0gdGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdLnBhcnRzO1xuXG5cdFx0ZGF0YS5mb3JFYWNoKCBkID0+IHtcblx0XHRcdGxldCBwYXJ0SWQgPSBkWzBdO1xuXHRcdFx0bGV0IGNhdGVnb3J5ID0gZFsxXTtcblx0XHRcdGxldCBwYXJ0TmFtZSA9IGRbMl07XG5cdFx0XHRsZXQgbGFiZWwgPSBkWzNdO1xuXHRcdFx0bGV0IHRpbWUgPSBkWzRdO1xuXHRcdFx0bGV0IGNvZGUgPSBkWzVdO1xuXHRcdFx0bGV0IGNvZGVSZWYgPSBkWzZdO1xuXHRcdFx0bGV0IG1zZyA9IGRbN107XG5cdFx0XHRsZXQgY3JpdExldmVsID0gZFs4XTtcblx0XHRcdGxldCBkZXNjcmlwdGlvbiA9IGRbOV07XG5cblx0XHRcdGlmIChyUGFydHNbcGFydElkXSA9PSBudWxsKSB7XG5cdFx0XHRcdHJQYXJ0c1twYXJ0SWRdID0ge307XG5cdFx0XHR9XG5cdFx0XHRyUGFydHNbcGFydElkXS5jYXRlZ29yeSA9IGNhdGVnb3J5O1xuXHRcdFx0clBhcnRzW3BhcnRJZF0ubmFtZSA9IHBhcnROYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRyUGFydHNbcGFydElkXS5sYWJlbCA9IGxhYmVsO1xuXG5cdFx0XHRpZiAoclBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0ID09IG51bGwpXG5cdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdCA9IHt9O1xuXG5cdFx0XHRpZiAoclBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0W2NvZGVSZWZdID09IG51bGwpXG5cdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdFtjb2RlUmVmXSA9IHtcblx0XHRcdFx0XHRtc2c6IG1zZyxcblx0XHRcdFx0XHRjcml0TGV2ZWw6IGNyaXRMZXZlbCxcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cblx0XHRcdFx0fTtcblx0XHRcdGxldCBldnRzX3RtcCA9IHtcblx0XHRcdFx0dGltZTogdGhpcy5fY29kZXIuZnJvbSh0aW1lKSxcblx0XHRcdFx0Y29kZTogdGhpcy5fY29kZXIuZnJvbShjb2RlKSxcblx0XHRcdFx0Y29kZVJlZjogdGhpcy5fY29kZXIuZnJvbShjb2RlUmVmKVxuXHRcdFx0fTtcblx0XHRcdGlmIChyUGFydHNbcGFydElkXS5ldnRzID09IG51bGwpIHtcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXZ0cyA9IFtdO1xuXHRcdFx0fVxuXHRcdFx0clBhcnRzW3BhcnRJZF0uZXZ0cy5wdXNoKGV2dHNfdG1wKTtcblx0XHR9KTtcblx0XHRyZXR1cm4gdGhpcy5yb2JvdE1vZGVsO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29ubmVjdG9yVjI7IiwiLypcbiAqIENvcHlyaWdodCA6IFBhcnRuZXJpbmcgMy4wICgyMDA3LTIwMTkpXG4gKiBBdXRob3IgOiBTeWx2YWluIE1haMOpIDxzeWx2YWluLm1haGVAcGFydG5lcmluZy5mcj5cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBkaXlhLXNkay5cbiAqXG4gKiBkaXlhLXNkayBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBkaXlhLXNkayBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCBkaXlhLXNkay4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcbmNvbnN0IGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgnc3RhdHVzOndhdGNoZXInKTtcbmNvbnN0IGRlYnVnRXJyb3IgPSByZXF1aXJlKCdkZWJ1ZycpKCdzdGF0dXM6d2F0Y2hlcjplcnJvcnMnKTtcblxuY2xhc3MgU3RvcENvbmRpdGlvbiBleHRlbmRzIEVycm9yIHtcblx0Y29uc3RydWN0b3IobXNnKSB7XG5cdFx0c3VwZXIobXNnKTtcblx0XHR0aGlzLm5hbWUgPSAnU3RvcENvbmRpdGlvbic7XG5cdH1cbn1cblxuY2xhc3MgV2F0Y2hlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cdC8qKlxuXHQgKiBAcGFyYW0gZW1pdCBlbWl0IGRhdGEgKG1hbmRhdG9yeSlcblx0ICogQHBhcmFtIGNvbmZpZyB0byBnZXQgZGF0YSBmcm9tIHNlcnZlclxuXHQgKi9cblx0Y29uc3RydWN0b3IgKHNlbGVjdG9yLCBvcHRpb25zKSB7XG5cdFx0c3VwZXIoKTtcblxuXHRcdHRoaXMuc2VsZWN0b3IgPSBzZWxlY3Rvcjtcblx0XHR0aGlzLnN1YnNjcmlwdGlvbnMgPSBbXTtcblx0XHR0aGlzLnN0YXRlID0gJ3J1bm5pbmcnO1xuXG5cdFx0dGhpcy5yZWNvbm5lY3Rpb25QZXJpb2QgPSAwOyAvLyBpbml0aWFsIHBlcmlvZCBiZXR3ZWVuIHJlY29ubmVjdGlvbnNcblx0XHR0aGlzLm1heFJlY29ubmVjdGlvblBlcmlvZCA9IDYwMDAwOyAvLyBtYXggMSBtaW5cblxuXHRcdC8vIEluY3JlYXNlIG51bWJlciBvZiBsaXN0ZW5lcnMgKFNIT1VMRCBCRSBBVk9JREVEKVxuXHRcdHRoaXMuc2VsZWN0b3Iuc2V0TWF4TGlzdGVuZXJzKDApO1xuXHRcdHRoaXMuc2VsZWN0b3IuX2Nvbm5lY3Rpb24uc2V0TWF4TGlzdGVuZXJzKDApO1xuXG5cdFx0LyoqIGluaXRpYWxpc2Ugb3B0aW9ucyBmb3IgcmVxdWVzdCAqKi9cblx0XHRpZiAob3B0aW9ucy5zaWduYWwgPT0gbnVsbCkge1xuXHRcdFx0b3B0aW9ucy5zaWduYWwgPSAnU3RhdHVzZXNCdWZmZXJlZCc7XG5cdFx0fVxuXG5cdFx0dGhpcy5fc3RhdHVzZXNEaWN0aW9uYXJ5ID0ge307XG5cdFx0ZGVidWcob3B0aW9ucyk7XG5cblx0XHR0aGlzLndhdGNoKG9wdGlvbnMpOyAvLyBzdGFydCB3YXRjaGVyXG5cdH1cblxuXHR3YXRjaCAob3B0aW9ucykge1xuXHRcdGRlYnVnKCdpbiB3YXRjaCcpO1xuXHRcdG5ldyBQcm9taXNlKCAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHRcdFx0ZnVuYzogJ0dldE1hbmFnZWRPYmplY3RzJyxcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnb3JnLmZyZWVkZXNrdG9wLkRCdXMuT2JqZWN0TWFuYWdlcicsXG5cdFx0XHRcdH1cblx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRyZWplY3QoZXJyKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMuc3RhdGUgPT09ICdzdG9wcGVkJykge1xuXHRcdFx0XHRcdHJlamVjdChuZXcgU3RvcENvbmRpdGlvbigpKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0ZGVidWcoJ1JlcXVlc3Q6ZW1pdERhdGEnKTtcblx0XHRcdFx0Ly8gUGFyc2Ugc3RhdHVzIGRhdGFcblx0XHRcdFx0ZGVidWcoZGF0YSk7XG5cdFx0XHRcdGRhdGEgPSB0aGlzLl9wYXJzZUdldE1hbmFnZWRPYmplY3RzRGF0YShkYXRhKTtcblx0XHRcdFx0ZGVidWcoZGF0YSk7XG5cdFx0XHRcdGZvciAobGV0IGRldmljZU5hbWUgaW4gZGF0YS5kZXZpY2VzKSB7XG5cdFx0XHRcdFx0bGV0IGRldmljZSA9IGRhdGEuZGV2aWNlc1tkZXZpY2VOYW1lXTtcblx0XHRcdFx0XHRpZiAoZGV2aWNlLnBhcnRzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdFx0Ly8gVE9ETyB0aGVyZSBzaG91bGQgYmUgYSBzaWduYWwgaW5kaWNhdGluZ1xuXHRcdFx0XHRcdFx0Ly8gdGhhdCB0aGUgb2JqZWN0cyBwYXRocyBoYXMgYWxsIGJlIGxvYWRlZC4uLlxuXHRcdFx0XHRcdFx0Ly8gSW5kZWVkLCB0aGUgcGFydHMgbWF5IG5vdCBoYXZlIGJlZW4gbG9hZGVkIHlldFxuXHRcdFx0XHRcdFx0cmVqZWN0KCdFcnJvcjogTm8gcGFydCB5ZXQnKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0bGV0IGRhdGFUb0VtaXQgPSB7XG5cdFx0XHRcdFx0XHRwYXJ0czogZGV2aWNlLnBhcnRzLFxuXHRcdFx0XHRcdFx0cm9ib3RJZDogZGV2aWNlLnJvYm90SWQsXG5cdFx0XHRcdFx0XHRyb2JvdE5hbWU6IGRldmljZS5yb2JvdE5hbWUsXG5cdFx0XHRcdFx0XHRwZWVySWQ6IHBlZXJJZCxcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdC8vIFNlbmRpbmcgcGFydCBkYXRhIGRldmljZSAocm9ib3QpIGJ5IGRldmljZVxuXHRcdFx0XHRcdHRoaXMuZW1pdCgnZGF0YScsIGRhdGFUb0VtaXQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdH0pO1xuXHRcdH0pXG5cdFx0LnRoZW4oICgpID0+IHtcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSggKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRcdGZ1bmM6ICdHZXQnLFxuXHRcdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdFx0aW50ZXJmYWNlOiAnb3JnLmZyZWVkZXNrdG9wLkRCdXMuUHJvcGVydGllcycsXG5cdFx0XHRcdFx0XHRwYXRoOiAnL2ZyL3BhcnRuZXJpbmcvU3RhdHVzJ1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdFx0aW50ZXJmYWNlX25hbWU6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cycsXG5cdFx0XHRcdFx0XHRwcm9wZXJ0eV9uYW1lOiAnU3RhdHVzZXNEaWN0aW9uYXJ5J1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QoZXJyKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHRoaXMuc3RhdGUgPT09ICdzdG9wcGVkJykge1xuXHRcdFx0XHRcdFx0cmVqZWN0KG5ldyBTdG9wQ29uZGl0aW9uKCkpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoZGF0YSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHR0aGlzLl9zdGF0dXNlc0RpY3Rpb25hcnkgPSBkYXRhO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZWplY3QoJ05vIFN0YXR1c2VzRGljdGlvbmFyeSBkYXRhJyk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9KVxuXHRcdC50aGVuKCAoKSA9PiB7XG5cdFx0XHRkZWJ1ZygnU3Vic2NyaWJpbmcnKTtcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSggKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0XHRsZXQgc3Vic2NyaXB0aW9uID0gdGhpcy5zZWxlY3Rvci5zdWJzY3JpYmUoe1xuXHRcdFx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRcdFx0ZnVuYzogb3B0aW9ucy5zaWduYWwsXG5cdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KGVycik7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChkYXRhICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdGRhdGEgPSB0aGlzLl9wYXJzZVN0YXR1c0NoYW5nZWREYXRhKGRhdGFbMF0pXG5cdFx0XHRcdFx0XHRmb3IgKGxldCBkZXZpY2VOYW1lIGluIGRhdGEuZGV2aWNlcykge1xuXHRcdFx0XHRcdFx0XHRsZXQgZGV2aWNlID0gZGF0YS5kZXZpY2VzW2RldmljZU5hbWVdXG5cdFx0XHRcdFx0XHRcdGxldCBkYXRhVG9FbWl0ID0ge1xuXHRcdFx0XHRcdFx0XHRcdHBhcnRzOiBkZXZpY2UucGFydHMsXG5cdFx0XHRcdFx0XHRcdFx0cm9ib3RJZDogZGV2aWNlLnJvYm90SWQsXG5cdFx0XHRcdFx0XHRcdFx0cm9ib3ROYW1lOiBkZXZpY2Uucm9ib3ROYW1lLFxuXHRcdFx0XHRcdFx0XHRcdHBlZXJJZDogcGVlcklkLFxuXHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHR0aGlzLmVtaXQoJ2RhdGEnLCBkYXRhVG9FbWl0KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy5yZWNvbm5lY3Rpb25QZXJpb2QgPSAwOyAvLyByZXNldCBwZXJpb2Qgb24gc3Vic2NyaXB0aW9uIHJlcXVlc3RzXG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHR0aGlzLnN1YnNjcmlwdGlvbnMucHVzaChzdWJzY3JpcHRpb24pO1xuXHRcdFx0fSlcblx0XHR9KVxuXHRcdC5jYXRjaCggZXJyID0+IHtcblx0XHRcdC8vIHdhdGNoZXIgc3RvcHBlZCA6IGRvIG5vdGhpbmdcblx0XHRcdGlmIChlcnIubmFtZSA9PT0gJ1N0b3BDb25kaXRpb24nKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdC8vIHRyeSB0byByZXN0YXJ0IGxhdGVyXG5cdFx0XHRkZWJ1Z0Vycm9yKGVycik7XG5cdFx0XHR0aGlzLl9jbG9zZVN1YnNjcmlwdGlvbnMoKTsgLy8gc2hvdWxkIG5vdCBiZSBuZWNlc3Nhcnlcblx0XHRcdC8vIGluY3JlYXNlIGRlbGF5IGJ5IDEgc2VjXG5cdFx0XHR0aGlzLnJlY29ubmVjdGlvblBlcmlvZCA9IHRoaXMucmVjb25uZWN0aW9uUGVyaW9kICsgMTAwMDtcblx0XHRcdGlmICh0aGlzLnJlY29ubmVjdGlvblBlcmlvZCA+IHRoaXMubWF4UmVjb25uZWN0aW9uUGVyaW9kKSB7XG5cdFx0XHRcdC8vIG1heCA1bWluXG5cdFx0XHRcdHRoaXMucmVjb25uZWN0aW9uUGVyaW9kID0gdGhpcy5tYXhSZWNvbm5lY3Rpb25QZXJpb2Q7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLndhdGNoVGVudGF0aXZlID0gc2V0VGltZW91dCggKCkgPT4ge1xuXHRcdFx0XHR0aGlzLndhdGNoKG9wdGlvbnMpO1xuXHRcdFx0fSwgdGhpcy5yZWNvbm5lY3Rpb25QZXJpb2QpOyAvLyB0cnkgYWdhaW4gbGF0ZXJcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBQYXJzZSBvYmplY3RNYW5hZ2VyIGludHJvc3BlY3QgZGF0YSB0byBmZWVkIGJhY2sgc3RhdHVzIG1hbmFnZXJcblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3R9IGRhdGEgcmF3IGRhdGEgZnJvbSBnZXRNYW5hZ2VkT2JqZWN0c1xuXHQgKiBAcmV0dXJuIHtPYmplY3R7U3RyaW5nLFN0cmluZyxBcnJheSBvZiBBcnJheSBvZiBQYXJ0SW5mb30gcGFyc2VkRGF0YVxuXHQgKi9cblx0X3BhcnNlR2V0TWFuYWdlZE9iamVjdHNEYXRhIChkYXRhKSB7XG5cdFx0bGV0IHBlZXJzID0gdGhpcy5zZWxlY3Rvci5fY29ubmVjdGlvbi5wZWVycygpLm1hcChwZWVyID0+IHBlZXIudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCctJywnJykpO1xuXHRcdGxldCBwYXJzZWREYXRhID0ge1xuXHRcdFx0ZGV2aWNlczoge31cblx0XHR9O1xuXHRcdGlmIChkYXRhID09IG51bGwpIHtcblx0XHRcdHJldHVybiBwYXJzZWREYXRhO1xuXHRcdH1cblxuXHRcdC8vIEZvciBlYWNoIG9iamVjdCBwYXRoXG5cdFx0Zm9yIChsZXQgcGF0aCBpbiBkYXRhKSB7XG5cdFx0XHRsZXQgb2JqID0gZGF0YVtwYXRoXTtcblx0XHRcdGxldCBzcGxpdFBhdGggPSBwYXRoLnNwbGl0KCcvJyk7XG5cdFx0XHRpZiAoc3BsaXRQYXRoLmxlbmd0aCA9PT0gNikge1xuXHRcdFx0XHQvLyB3aXRoIGRldmljZSBwYXRoLCBzcGxpdCBwYXRoIGhhcyA2IGl0ZW1zXG5cdFx0XHRcdGZvciAobGV0IGlmYWNlIGluIG9iaikge1xuXHRcdFx0XHRcdGlmIChpZmFjZSA9PT0gXCJmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdFwiKSB7XG5cdFx0XHRcdFx0XHQvLyBGaW5kIHByb2R1Y3QgbmFtZSBhbmQgaWRcblx0XHRcdFx0XHRcdGxldCByb2JvdE5hbWUgPSBzcGxpdFBhdGhbNV0udG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRcdGlmIChwZWVycy5pbmNsdWRlcyhyb2JvdE5hbWUpKSB7XG5cdFx0XHRcdFx0XHRcdC8vIEludGVyZmFjZSBvZiB0aGUgZGV2aWNlIG9iamVjdHNcblx0XHRcdFx0XHRcdFx0bGV0IGRldmljZSA9IG9ialtpZmFjZV07XG5cdFx0XHRcdFx0XHRcdGxldCBzZWxEZXZpY2UgPSBwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lXTtcblx0XHRcdFx0XHRcdFx0aWYgKHNlbERldmljZSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdFx0c2VsRGV2aWNlID0ge1xuXHRcdFx0XHRcdFx0XHRcdFx0cGFydHM6IFtdXG5cdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lXSA9IHNlbERldmljZTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRzZWxEZXZpY2Uucm9ib3ROYW1lID0gZGV2aWNlLlJvYm90TmFtZTtcblx0XHRcdFx0XHRcdFx0c2VsRGV2aWNlLnJvYm90SWQgPSBkZXZpY2UuUm9ib3RJZDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoc3BsaXRQYXRoLmxlbmd0aCA9PT0gOCkge1xuXHRcdFx0XHQvLyB3aXRoIHBhcnQgcGF0aCwgc3BsaXQgcGF0aCBoYXMgOCBpdGVtc1xuXHRcdFx0XHRmb3IgKGxldCBpZmFjZSBpbiBvYmopIHtcblx0XHRcdFx0XHRpZiAoaWZhY2UgPT09IFwiZnIucGFydG5lcmluZy5TdGF0dXMuUGFydFwiKSB7XG5cdFx0XHRcdFx0XHQvLyBGaW5kIHByb2R1Y3QgbmFtZVxuXHRcdFx0XHRcdFx0bGV0IHJvYm90TmFtZSA9IHNwbGl0UGF0aFs1XS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdFx0aWYgKHBlZXJzLmluY2x1ZGVzKHJvYm90TmFtZSkpIHtcblx0XHRcdFx0XHRcdFx0Ly8gSW50ZXJmYWNlIG9mIHRoZSBwYXJ0IG9iamVjdHNcblx0XHRcdFx0XHRcdFx0bGV0IHBhcnQgPSBvYmpbaWZhY2VdO1xuXHRcdFx0XHRcdFx0XHRsZXQgc2VsRGV2aWNlID0gcGFyc2VkRGF0YS5kZXZpY2VzW3JvYm90TmFtZV07XG5cdFx0XHRcdFx0XHRcdGlmIChzZWxEZXZpY2UgPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRcdHNlbERldmljZSA9IHtcblx0XHRcdFx0XHRcdFx0XHRcdHBhcnRzOiBbXVxuXHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0cGFyc2VkRGF0YS5kZXZpY2VzW3JvYm90TmFtZV0gPSBzZWxEZXZpY2U7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0Ly8gQnVpbGQgcGFydCBhcnJheVxuXHRcdFx0XHRcdFx0XHQvLyBUT0RPIG9wdGltaXplIGhvdyB0aGUgZGF0YSBhcmUgdXNlZCA6XG5cdFx0XHRcdFx0XHRcdC8vIGFjdHVhbGx5IGNvbnZlcnRpbmcgb2JqZWN0IHRvIGFycmF5IHRoZW5cblx0XHRcdFx0XHRcdFx0Ly8gZnJvbSBhcnJheSB0byBvYmplY3QgYWdhaW4uLi5cblx0XHRcdFx0XHRcdFx0bGV0IG5ld1BhcnQgPSBbXTtcblx0XHRcdFx0XHRcdFx0bmV3UGFydFswXSA9IHBhcnQuUGFydElkO1xuXHRcdFx0XHRcdFx0XHRuZXdQYXJ0WzFdID0gcGFydC5DYXRlZ29yeTtcblx0XHRcdFx0XHRcdFx0bmV3UGFydFsyXSA9IHBhcnQuUGFydE5hbWU7XG5cdFx0XHRcdFx0XHRcdG5ld1BhcnRbM10gPSBcIlwiOyAvLyBMYWJlbCBpcyB1bnVzZWQgaW4gcHJhY3RpY2Vcblx0XHRcdFx0XHRcdFx0bmV3UGFydFs0XSA9IHBhcnQuVGltZTtcblx0XHRcdFx0XHRcdFx0bmV3UGFydFs1XSA9IHBhcnQuQ29kZTtcblx0XHRcdFx0XHRcdFx0bmV3UGFydFs2XSA9IHBhcnQuQ29kZVJlZjtcblx0XHRcdFx0XHRcdFx0bmV3UGFydFs3XSA9IHBhcnQuTXNnO1xuXHRcdFx0XHRcdFx0XHRuZXdQYXJ0WzhdID0gcGFydC5Dcml0TGV2ZWw7XG5cdFx0XHRcdFx0XHRcdG5ld1BhcnRbOV0gPSBcIlwiIC8vIERlc2NyaXB0aW9uIGlzIHVudXNlZCBpbiBwcmFjdGljZVxuXG5cdFx0XHRcdFx0XHRcdHNlbERldmljZS5wYXJ0cy5wdXNoKG5ld1BhcnQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkZWJ1Z0Vycm9yKFwiVW5kZWZpbmVkIHBhdGggZm9ybWF0XCIpO1xuXHRcdFx0fVxuXHRcdH1cblxuXG5cdFx0Ly8gUmVhZCBSb2JvdCBuYW1lIGFuZCByb2JvdCBJZFxuXHRcdC8vIFJlYWQgUGFydCBkYXRhXG5cdFx0cmV0dXJuIHBhcnNlZERhdGE7XG5cdH1cblxuXHRfcGFyc2VTdGF0dXNDaGFuZ2VkRGF0YSAoZGF0YSkge1xuXHRcdGxldCBwYXJzZWREYXRhID0ge307XG5cdFx0ZGF0YS5mb3JFYWNoKCAoZXZlbnQpID0+IHtcblx0XHRcdGxldCByb2JvdE5hbWUgPSBldmVudFswXTtcblx0XHRcdGxldCByb2JvdElkID0gZXZlbnRbMV07XG5cdFx0XHRsZXQgdGltZSA9IGV2ZW50WzJdO1xuXHRcdFx0bGV0IHN0YXR1c0V2ZW50SWQgPSBldmVudFszXTtcblx0XHRcdGxldCBjb2RlID0gZXZlbnRbNF07XG5cdFx0XHRsZXQgcm9ib3ROYW1lTG93ZXJDYXNlID0gcm9ib3ROYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRpZiAodGhpcy5fc3RhdHVzZXNEaWN0aW9uYXJ5W3N0YXR1c0V2ZW50SWRdWzBdICE9PSBzdGF0dXNFdmVudElkKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJNYWxmb3JtZWQgc3RhdHVzZXMgZGljdGlvbmFyeVwiKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0bGV0IHBhcnRJZCA9IHRoaXMuX3N0YXR1c2VzRGljdGlvbmFyeVtzdGF0dXNFdmVudElkXVsxXTtcblx0XHRcdGxldCBjb2RlUmVmID0gdGhpcy5fc3RhdHVzZXNEaWN0aW9uYXJ5W3N0YXR1c0V2ZW50SWRdWzJdO1xuXHRcdFx0bGV0IHBhcnROYW1lID0gdGhpcy5fc3RhdHVzZXNEaWN0aW9uYXJ5W3N0YXR1c0V2ZW50SWRdWzNdO1xuXHRcdFx0bGV0IGNhdGVnb3J5ID0gdGhpcy5fc3RhdHVzZXNEaWN0aW9uYXJ5W3N0YXR1c0V2ZW50SWRdWzRdO1xuXHRcdFx0bGV0IG1zZyA9IHRoaXMuX3N0YXR1c2VzRGljdGlvbmFyeVtzdGF0dXNFdmVudElkXVs1XTtcblx0XHRcdGxldCBjcml0TGV2ZWwgPSB0aGlzLl9zdGF0dXNlc0RpY3Rpb25hcnlbc3RhdHVzRXZlbnRJZF1bNl07XG5cdFx0XHRsZXQgbGFiZWwgPSBcIlwiOyAvLyBMYWJlbCBpcyB1bnVzZWQgaW4gcHJhY3RpY2Vcblx0XHRcdGxldCBkZXNjcmlwdGlvbiA9IFwiXCI7IC8vIERlc2NyaXB0aW9uIGlzIHVudXNlZCBpbiBwcmFjdGljZVxuXHRcdFx0aWYgKHBhcnNlZERhdGEuZGV2aWNlcyA9PSBudWxsKSB7XG5cdFx0XHRcdHBhcnNlZERhdGEuZGV2aWNlcyA9IFtdO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHBhcnNlZERhdGEuZGV2aWNlc1tyb2JvdE5hbWVMb3dlckNhc2VdID09IG51bGwpIHtcblx0XHRcdFx0cGFyc2VkRGF0YS5kZXZpY2VzW3JvYm90TmFtZUxvd2VyQ2FzZV0gPSB7fTtcblx0XHRcdH1cblx0XHRcdHBhcnNlZERhdGEuZGV2aWNlc1tyb2JvdE5hbWVMb3dlckNhc2VdLnJvYm90SWQgPSByb2JvdElkO1xuXHRcdFx0cGFyc2VkRGF0YS5kZXZpY2VzW3JvYm90TmFtZUxvd2VyQ2FzZV0ucm9ib3ROYW1lID0gcm9ib3ROYW1lO1xuXHRcdFx0aWYgKHBhcnNlZERhdGEuZGV2aWNlc1tyb2JvdE5hbWVMb3dlckNhc2VdLnBhcnRzID09IG51bGwpIHtcblx0XHRcdFx0cGFyc2VkRGF0YS5kZXZpY2VzW3JvYm90TmFtZUxvd2VyQ2FzZV0ucGFydHMgPSBbXTtcblx0XHRcdH1cblx0XHRcdGxldCBuZXdQYXJ0ID0gW107XG5cdFx0XHRuZXdQYXJ0WzBdID0gcGFydElkO1xuXHRcdFx0bmV3UGFydFsxXSA9IGNhdGVnb3J5O1xuXHRcdFx0bmV3UGFydFsyXSA9IHBhcnROYW1lO1xuXHRcdFx0bmV3UGFydFszXSA9IGxhYmVsO1xuXHRcdFx0bmV3UGFydFs0XSA9IHRpbWU7XG5cdFx0XHRuZXdQYXJ0WzVdID0gY29kZTtcblx0XHRcdG5ld1BhcnRbNl0gPSBjb2RlUmVmO1xuXHRcdFx0bmV3UGFydFs3XSA9IG1zZztcblx0XHRcdG5ld1BhcnRbOF0gPSBjcml0TGV2ZWw7XG5cdFx0XHRuZXdQYXJ0WzldID0gZGVzY3JpcHRpb247XG5cdFx0XHRwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lTG93ZXJDYXNlXS5wYXJ0cy5wdXNoKG5ld1BhcnQpO1xuXHRcdH0pO1xuXHRcdHJldHVybiBwYXJzZWREYXRhO1xuXHR9XG5cblx0Ly8gQ2xvc2UgYWxsIHN1YnNjcmlwdGlvbnMgaWYgYW55XG5cdF9jbG9zZVN1YnNjcmlwdGlvbnMgKCkge1xuXHRcdGRlYnVnKCdJbiBjbG9zZVN1YnNjcmlwdGlvbicpO1xuXHRcdGZvciAodmFyIGkgaW4gdGhpcy5zdWJzY3JpcHRpb25zKSB7XG5cdFx0XHR0aGlzLnN1YnNjcmlwdGlvbnNbaV0uY2xvc2UoKTtcblx0XHR9XG5cdFx0dGhpcy5zdWJzY3JpcHRpb25zID0gW107XG5cdH1cblxuXHRzdG9wICgpIHtcblx0XHRkZWJ1ZygnSW4gc3RvcCcpO1xuXHRcdHRoaXMuc3RhdGUgPSAnc3RvcHBlZCc7XG5cdFx0aWYgKHRoaXMud2F0Y2hUZW50YXRpdmUgIT0gbnVsbCkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMud2F0Y2hUZW50YXRpdmUpO1xuXHRcdH1cblx0XHR0aGlzLl9jbG9zZVN1YnNjcmlwdGlvbnMoKTtcblx0XHR0aGlzLmVtaXQoJ3N0b3AnKTtcblx0XHR0aGlzLnJlbW92ZUFsbExpc3RlbmVycygpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gV2F0Y2hlcjtcbiJdfQ==
