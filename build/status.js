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

},{"debug":1,"eventemitter3":3}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvZGVidWcvc3JjL2RlYnVnLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwic3JjL3N0YXR1cy5qcyIsInNyYy92MS9jb25uZWN0b3IuanMiLCJzcmMvdjIvY29ubmVjdG9yLmpzIiwic3JjL3YyL3dhdGNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDekxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFNLFNBQU47QUFDQSxRQUFLLEtBQUwsR0FBYSxTQUFiO0FBQ0EsT0FBSSxLQUFLLGNBQUwsSUFBdUIsSUFBM0IsRUFBaUM7QUFDaEMsaUJBQWEsS0FBSyxjQUFsQjtBQUNBO0FBQ0QsUUFBSyxtQkFBTDtBQUNBLFFBQUssSUFBTCxDQUFVLE1BQVY7QUFDQSxRQUFLLGtCQUFMO0FBQ0E7Ozs7RUFqVG9CLFk7O0FBb1R0QixPQUFPLE9BQVAsR0FBaUIsT0FBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBUaGlzIGlzIHRoZSB3ZWIgYnJvd3NlciBpbXBsZW1lbnRhdGlvbiBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcbmV4cG9ydHMuc2F2ZSA9IHNhdmU7XG5leHBvcnRzLmxvYWQgPSBsb2FkO1xuZXhwb3J0cy51c2VDb2xvcnMgPSB1c2VDb2xvcnM7XG5leHBvcnRzLnN0b3JhZ2UgPSAndW5kZWZpbmVkJyAhPSB0eXBlb2YgY2hyb21lXG4gICAgICAgICAgICAgICAmJiAndW5kZWZpbmVkJyAhPSB0eXBlb2YgY2hyb21lLnN0b3JhZ2VcbiAgICAgICAgICAgICAgICAgID8gY2hyb21lLnN0b3JhZ2UubG9jYWxcbiAgICAgICAgICAgICAgICAgIDogbG9jYWxzdG9yYWdlKCk7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuICAnbGlnaHRzZWFncmVlbicsXG4gICdmb3Jlc3RncmVlbicsXG4gICdnb2xkZW5yb2QnLFxuICAnZG9kZ2VyYmx1ZScsXG4gICdkYXJrb3JjaGlkJyxcbiAgJ2NyaW1zb24nXG5dO1xuXG4vKipcbiAqIEN1cnJlbnRseSBvbmx5IFdlYktpdC1iYXNlZCBXZWIgSW5zcGVjdG9ycywgRmlyZWZveCA+PSB2MzEsXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cbiAqIHRvIHN1cHBvcnQgXCIlY1wiIENTUyBjdXN0b21pemF0aW9ucy5cbiAqXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xuICovXG5cbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcbiAgLy8gTkI6IEluIGFuIEVsZWN0cm9uIHByZWxvYWQgc2NyaXB0LCBkb2N1bWVudCB3aWxsIGJlIGRlZmluZWQgYnV0IG5vdCBmdWxseVxuICAvLyBpbml0aWFsaXplZC4gU2luY2Ugd2Uga25vdyB3ZSdyZSBpbiBDaHJvbWUsIHdlJ2xsIGp1c3QgZGV0ZWN0IHRoaXMgY2FzZVxuICAvLyBleHBsaWNpdGx5XG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucHJvY2VzcyAmJiB3aW5kb3cucHJvY2Vzcy50eXBlID09PSAncmVuZGVyZXInKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBpcyB3ZWJraXQ/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE2NDU5NjA2LzM3Njc3M1xuICAvLyBkb2N1bWVudCBpcyB1bmRlZmluZWQgaW4gcmVhY3QtbmF0aXZlOiBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QtbmF0aXZlL3B1bGwvMTYzMlxuICByZXR1cm4gKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuV2Via2l0QXBwZWFyYW5jZSkgfHxcbiAgICAvLyBpcyBmaXJlYnVnPyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zOTgxMjAvMzc2NzczXG4gICAgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5jb25zb2xlICYmICh3aW5kb3cuY29uc29sZS5maXJlYnVnIHx8ICh3aW5kb3cuY29uc29sZS5leGNlcHRpb24gJiYgd2luZG93LmNvbnNvbGUudGFibGUpKSkgfHxcbiAgICAvLyBpcyBmaXJlZm94ID49IHYzMT9cbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1Rvb2xzL1dlYl9Db25zb2xlI1N0eWxpbmdfbWVzc2FnZXNcbiAgICAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSkgfHxcbiAgICAvLyBkb3VibGUgY2hlY2sgd2Via2l0IGluIHVzZXJBZ2VudCBqdXN0IGluIGNhc2Ugd2UgYXJlIGluIGEgd29ya2VyXG4gICAgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9hcHBsZXdlYmtpdFxcLyhcXGQrKS8pKTtcbn1cblxuLyoqXG4gKiBNYXAgJWogdG8gYEpTT04uc3RyaW5naWZ5KClgLCBzaW5jZSBubyBXZWIgSW5zcGVjdG9ycyBkbyB0aGF0IGJ5IGRlZmF1bHQuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbih2KSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHYpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gJ1tVbmV4cGVjdGVkSlNPTlBhcnNlRXJyb3JdOiAnICsgZXJyLm1lc3NhZ2U7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBDb2xvcml6ZSBsb2cgYXJndW1lbnRzIGlmIGVuYWJsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBcmdzKGFyZ3MpIHtcbiAgdmFyIHVzZUNvbG9ycyA9IHRoaXMudXNlQ29sb3JzO1xuXG4gIGFyZ3NbMF0gPSAodXNlQ29sb3JzID8gJyVjJyA6ICcnKVxuICAgICsgdGhpcy5uYW1lc3BhY2VcbiAgICArICh1c2VDb2xvcnMgPyAnICVjJyA6ICcgJylcbiAgICArIGFyZ3NbMF1cbiAgICArICh1c2VDb2xvcnMgPyAnJWMgJyA6ICcgJylcbiAgICArICcrJyArIGV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcblxuICBpZiAoIXVzZUNvbG9ycykgcmV0dXJuO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncy5zcGxpY2UoMSwgMCwgYywgJ2NvbG9yOiBpbmhlcml0JylcblxuICAvLyB0aGUgZmluYWwgXCIlY1wiIGlzIHNvbWV3aGF0IHRyaWNreSwgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBvdGhlclxuICAvLyBhcmd1bWVudHMgcGFzc2VkIGVpdGhlciBiZWZvcmUgb3IgYWZ0ZXIgdGhlICVjLCBzbyB3ZSBuZWVkIHRvXG4gIC8vIGZpZ3VyZSBvdXQgdGhlIGNvcnJlY3QgaW5kZXggdG8gaW5zZXJ0IHRoZSBDU1MgaW50b1xuICB2YXIgaW5kZXggPSAwO1xuICB2YXIgbGFzdEMgPSAwO1xuICBhcmdzWzBdLnJlcGxhY2UoLyVbYS16QS1aJV0vZywgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICBpZiAoJyUlJyA9PT0gbWF0Y2gpIHJldHVybjtcbiAgICBpbmRleCsrO1xuICAgIGlmICgnJWMnID09PSBtYXRjaCkge1xuICAgICAgLy8gd2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiB0aGUgKmxhc3QqICVjXG4gICAgICAvLyAodGhlIHVzZXIgbWF5IGhhdmUgcHJvdmlkZWQgdGhlaXIgb3duKVxuICAgICAgbGFzdEMgPSBpbmRleDtcbiAgICB9XG4gIH0pO1xuXG4gIGFyZ3Muc3BsaWNlKGxhc3RDLCAwLCBjKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIHRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LzksIHdoZXJlXG4gIC8vIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gIHJldHVybiAnb2JqZWN0JyA9PT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5zdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByID0gZXhwb3J0cy5zdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG5cbiAgLy8gSWYgZGVidWcgaXNuJ3Qgc2V0IGluIExTLCBhbmQgd2UncmUgaW4gRWxlY3Ryb24sIHRyeSB0byBsb2FkICRERUJVR1xuICBpZiAoIXIgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICdlbnYnIGluIHByb2Nlc3MpIHtcbiAgICByID0gcHJvY2Vzcy5lbnYuREVCVUc7XG4gIH1cblxuICByZXR1cm4gcjtcbn1cblxuLyoqXG4gKiBFbmFibGUgbmFtZXNwYWNlcyBsaXN0ZWQgaW4gYGxvY2FsU3RvcmFnZS5kZWJ1Z2AgaW5pdGlhbGx5LlxuICovXG5cbmV4cG9ydHMuZW5hYmxlKGxvYWQoKSk7XG5cbi8qKlxuICogTG9jYWxzdG9yYWdlIGF0dGVtcHRzIHRvIHJldHVybiB0aGUgbG9jYWxzdG9yYWdlLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugc2FmYXJpIHRocm93c1xuICogd2hlbiBhIHVzZXIgZGlzYWJsZXMgY29va2llcy9sb2NhbHN0b3JhZ2VcbiAqIGFuZCB5b3UgYXR0ZW1wdCB0byBhY2Nlc3MgaXQuXG4gKlxuICogQHJldHVybiB7TG9jYWxTdG9yYWdlfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbG9jYWxzdG9yYWdlKCkge1xuICB0cnkge1xuICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlO1xuICB9IGNhdGNoIChlKSB7fVxufVxuIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIGNvbW1vbiBsb2dpYyBmb3IgYm90aCB0aGUgTm9kZS5qcyBhbmQgd2ViIGJyb3dzZXJcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZURlYnVnLmRlYnVnID0gY3JlYXRlRGVidWdbJ2RlZmF1bHQnXSA9IGNyZWF0ZURlYnVnO1xuZXhwb3J0cy5jb2VyY2UgPSBjb2VyY2U7XG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xuZXhwb3J0cy5lbmFibGUgPSBlbmFibGU7XG5leHBvcnRzLmVuYWJsZWQgPSBlbmFibGVkO1xuZXhwb3J0cy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG4gKi9cblxuZXhwb3J0cy5uYW1lcyA9IFtdO1xuZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cbiAqXG4gKiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlciBvciB1cHBlci1jYXNlIGxldHRlciwgaS5lLiBcIm5cIiBhbmQgXCJOXCIuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzID0ge307XG5cbi8qKlxuICogUHJldmlvdXMgbG9nIHRpbWVzdGFtcC5cbiAqL1xuXG52YXIgcHJldlRpbWU7XG5cbi8qKlxuICogU2VsZWN0IGEgY29sb3IuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZWxlY3RDb2xvcihuYW1lc3BhY2UpIHtcbiAgdmFyIGhhc2ggPSAwLCBpO1xuXG4gIGZvciAoaSBpbiBuYW1lc3BhY2UpIHtcbiAgICBoYXNoICA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpICsgbmFtZXNwYWNlLmNoYXJDb2RlQXQoaSk7XG4gICAgaGFzaCB8PSAwOyAvLyBDb252ZXJ0IHRvIDMyYml0IGludGVnZXJcbiAgfVxuXG4gIHJldHVybiBleHBvcnRzLmNvbG9yc1tNYXRoLmFicyhoYXNoKSAlIGV4cG9ydHMuY29sb3JzLmxlbmd0aF07XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVzcGFjZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGNyZWF0ZURlYnVnKG5hbWVzcGFjZSkge1xuXG4gIGZ1bmN0aW9uIGRlYnVnKCkge1xuICAgIC8vIGRpc2FibGVkP1xuICAgIGlmICghZGVidWcuZW5hYmxlZCkgcmV0dXJuO1xuXG4gICAgdmFyIHNlbGYgPSBkZWJ1ZztcblxuICAgIC8vIHNldCBgZGlmZmAgdGltZXN0YW1wXG4gICAgdmFyIGN1cnIgPSArbmV3IERhdGUoKTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuICAgIHNlbGYuZGlmZiA9IG1zO1xuICAgIHNlbGYucHJldiA9IHByZXZUaW1lO1xuICAgIHNlbGYuY3VyciA9IGN1cnI7XG4gICAgcHJldlRpbWUgPSBjdXJyO1xuXG4gICAgLy8gdHVybiB0aGUgYGFyZ3VtZW50c2AgaW50byBhIHByb3BlciBBcnJheVxuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBhcmdzWzBdID0gZXhwb3J0cy5jb2VyY2UoYXJnc1swXSk7XG5cbiAgICBpZiAoJ3N0cmluZycgIT09IHR5cGVvZiBhcmdzWzBdKSB7XG4gICAgICAvLyBhbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlT1xuICAgICAgYXJncy51bnNoaWZ0KCclTycpO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXpBLVolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xuICAgICAgLy8gaWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuICAgICAgaWYgKG1hdGNoID09PSAnJSUnKSByZXR1cm4gbWF0Y2g7XG4gICAgICBpbmRleCsrO1xuICAgICAgdmFyIGZvcm1hdHRlciA9IGV4cG9ydHMuZm9ybWF0dGVyc1tmb3JtYXRdO1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcbiAgICAgICAgdmFyIHZhbCA9IGFyZ3NbaW5kZXhdO1xuICAgICAgICBtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuICAgICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG5cbiAgICAvLyBhcHBseSBlbnYtc3BlY2lmaWMgZm9ybWF0dGluZyAoY29sb3JzLCBldGMuKVxuICAgIGV4cG9ydHMuZm9ybWF0QXJncy5jYWxsKHNlbGYsIGFyZ3MpO1xuXG4gICAgdmFyIGxvZ0ZuID0gZGVidWcubG9nIHx8IGV4cG9ydHMubG9nIHx8IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSk7XG4gICAgbG9nRm4uYXBwbHkoc2VsZiwgYXJncyk7XG4gIH1cblxuICBkZWJ1Zy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gIGRlYnVnLmVuYWJsZWQgPSBleHBvcnRzLmVuYWJsZWQobmFtZXNwYWNlKTtcbiAgZGVidWcudXNlQ29sb3JzID0gZXhwb3J0cy51c2VDb2xvcnMoKTtcbiAgZGVidWcuY29sb3IgPSBzZWxlY3RDb2xvcihuYW1lc3BhY2UpO1xuXG4gIC8vIGVudi1zcGVjaWZpYyBpbml0aWFsaXphdGlvbiBsb2dpYyBmb3IgZGVidWcgaW5zdGFuY2VzXG4gIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZXhwb3J0cy5pbml0KSB7XG4gICAgZXhwb3J0cy5pbml0KGRlYnVnKTtcbiAgfVxuXG4gIHJldHVybiBkZWJ1Zztcbn1cblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG4gIGV4cG9ydHMuc2F2ZShuYW1lc3BhY2VzKTtcblxuICBleHBvcnRzLm5hbWVzID0gW107XG4gIGV4cG9ydHMuc2tpcHMgPSBbXTtcblxuICB2YXIgc3BsaXQgPSAodHlwZW9mIG5hbWVzcGFjZXMgPT09ICdzdHJpbmcnID8gbmFtZXNwYWNlcyA6ICcnKS5zcGxpdCgvW1xccyxdKy8pO1xuICB2YXIgbGVuID0gc3BsaXQubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoIXNwbGl0W2ldKSBjb250aW51ZTsgLy8gaWdub3JlIGVtcHR5IHN0cmluZ3NcbiAgICBuYW1lc3BhY2VzID0gc3BsaXRbaV0ucmVwbGFjZSgvXFwqL2csICcuKj8nKTtcbiAgICBpZiAobmFtZXNwYWNlc1swXSA9PT0gJy0nKSB7XG4gICAgICBleHBvcnRzLnNraXBzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzLnN1YnN0cigxKSArICckJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHBvcnRzLm5hbWVzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzICsgJyQnKSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGlzYWJsZSBkZWJ1ZyBvdXRwdXQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkaXNhYmxlKCkge1xuICBleHBvcnRzLmVuYWJsZSgnJyk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBtb2RlIG5hbWUgaXMgZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGVkKG5hbWUpIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5za2lwcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLnNraXBzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ29lcmNlIGB2YWxgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBjb2VyY2UodmFsKSB7XG4gIGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcbiAgcmV0dXJuIHZhbDtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgLCBwcmVmaXggPSAnfic7XG5cbi8qKlxuICogQ29uc3RydWN0b3IgdG8gY3JlYXRlIGEgc3RvcmFnZSBmb3Igb3VyIGBFRWAgb2JqZWN0cy5cbiAqIEFuIGBFdmVudHNgIGluc3RhbmNlIGlzIGEgcGxhaW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgYXJlIGV2ZW50IG5hbWVzLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEV2ZW50cygpIHt9XG5cbi8vXG4vLyBXZSB0cnkgdG8gbm90IGluaGVyaXQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuIEluIHNvbWUgZW5naW5lcyBjcmVhdGluZyBhblxuLy8gaW5zdGFuY2UgaW4gdGhpcyB3YXkgaXMgZmFzdGVyIHRoYW4gY2FsbGluZyBgT2JqZWN0LmNyZWF0ZShudWxsKWAgZGlyZWN0bHkuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gY2hhcmFjdGVyIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90XG4vLyBvdmVycmlkZGVuIG9yIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vXG5pZiAoT2JqZWN0LmNyZWF0ZSkge1xuICBFdmVudHMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAvL1xuICAvLyBUaGlzIGhhY2sgaXMgbmVlZGVkIGJlY2F1c2UgdGhlIGBfX3Byb3RvX19gIHByb3BlcnR5IGlzIHN0aWxsIGluaGVyaXRlZCBpblxuICAvLyBzb21lIG9sZCBicm93c2VycyBsaWtlIEFuZHJvaWQgNCwgaVBob25lIDUuMSwgT3BlcmEgMTEgYW5kIFNhZmFyaSA1LlxuICAvL1xuICBpZiAoIW5ldyBFdmVudHMoKS5fX3Byb3RvX18pIHByZWZpeCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIGV2ZW50IGxpc3RlbmVyLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gU3BlY2lmeSBpZiB0aGUgbGlzdGVuZXIgaXMgYSBvbmUtdGltZSBsaXN0ZW5lci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBgRXZlbnRFbWl0dGVyYCBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xufVxuXG4vKipcbiAqIFJldHVybiBhbiBhcnJheSBsaXN0aW5nIHRoZSBldmVudHMgZm9yIHdoaWNoIHRoZSBlbWl0dGVyIGhhcyByZWdpc3RlcmVkXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogQHJldHVybnMge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIG5hbWVzID0gW11cbiAgICAsIGV2ZW50c1xuICAgICwgbmFtZTtcblxuICBpZiAodGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gKGV2ZW50cyA9IHRoaXMuX2V2ZW50cykpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtCb29sZWFufSBleGlzdHMgT25seSBjaGVjayBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0FycmF5fEJvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCwgZXhpc3RzKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBhdmFpbGFibGUgPSB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAoZXhpc3RzKSByZXR1cm4gISFhdmFpbGFibGU7XG4gIGlmICghYXZhaWxhYmxlKSByZXR1cm4gW107XG4gIGlmIChhdmFpbGFibGUuZm4pIHJldHVybiBbYXZhaWxhYmxlLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGF2YWlsYWJsZS5sZW5ndGgsIGVlID0gbmV3IEFycmF5KGwpOyBpIDwgbDsgaSsrKSB7XG4gICAgZWVbaV0gPSBhdmFpbGFibGVbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIENhbGxzIGVhY2ggb2YgdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBldmVudCBoYWQgbGlzdGVuZXJzLCBlbHNlIGBmYWxzZWAuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgYXJnc1xuICAgICwgaTtcblxuICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnMuZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgY2FzZSAxOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQpLCB0cnVlO1xuICAgICAgY2FzZSAyOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExKSwgdHJ1ZTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIpLCB0cnVlO1xuICAgICAgY2FzZSA0OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMpLCB0cnVlO1xuICAgICAgY2FzZSA1OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgNjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCwgYTUpLCB0cnVlO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuZm4uYXBwbHkobGlzdGVuZXJzLmNvbnRleHQsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoXG4gICAgICAsIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0ub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzW2ldLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBjYXNlIDQ6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIsIGEzKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogQWRkIGEgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXIsIHRoaXMuX2V2ZW50c0NvdW50Kys7XG4gIGVsc2UgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGEgb25lLXRpbWUgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzLCB0cnVlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyLCB0aGlzLl9ldmVudHNDb3VudCsrO1xuICBlbHNlIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW3RoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB0aGUgbGlzdGVuZXJzIG9mIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBtYXRjaCB0aGlzIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBPbmx5IHJlbW92ZSB0aGUgbGlzdGVuZXJzIHRoYXQgaGF2ZSB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25lLXRpbWUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbiwgY29udGV4dCwgb25jZSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gdGhpcztcbiAgaWYgKCFmbikge1xuICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChcbiAgICAgICAgIGxpc3RlbmVycy5mbiA9PT0gZm5cbiAgICAgICYmICghb25jZSB8fCBsaXN0ZW5lcnMub25jZSlcbiAgICAgICYmICghY29udGV4dCB8fCBsaXN0ZW5lcnMuY29udGV4dCA9PT0gY29udGV4dClcbiAgICApIHtcbiAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50cyA9IFtdLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChcbiAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmblxuICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpXG4gICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gICAgLy9cbiAgICBpZiAoZXZlbnRzLmxlbmd0aCkgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICAgIGVsc2UgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycywgb3IgdGhvc2Ugb2YgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IFtldmVudF0gVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICB2YXIgZXZ0O1xuXG4gIGlmIChldmVudCkge1xuICAgIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG4gICAgaWYgKHRoaXMuX2V2ZW50c1tldnRdKSB7XG4gICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgcHJlZml4LlxuLy9cbkV2ZW50RW1pdHRlci5wcmVmaXhlZCA9IHByZWZpeDtcblxuLy9cbi8vIEFsbG93IGBFdmVudEVtaXR0ZXJgIHRvIGJlIGltcG9ydGVkIGFzIG1vZHVsZSBuYW1lc3BhY2UuXG4vL1xuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbmlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIG1vZHVsZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbn1cbiIsIi8qKlxuICogSGVscGVycy5cbiAqL1xuXG52YXIgcyA9IDEwMDA7XG52YXIgbSA9IHMgKiA2MDtcbnZhciBoID0gbSAqIDYwO1xudmFyIGQgPSBoICogMjQ7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzTmFOKHZhbCkgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMubG9uZyA/IGZtdExvbmcodmFsKSA6IGZtdFNob3J0KHZhbCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICd2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIHZhbGlkIG51bWJlci4gdmFsPScgK1xuICAgICAgSlNPTi5zdHJpbmdpZnkodmFsKVxuICApO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHN0ciA9IFN0cmluZyhzdHIpO1xuICBpZiAoc3RyLmxlbmd0aCA+IDEwMCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtaWxsaXNlY29uZHM/fG1zZWNzP3xtc3xzZWNvbmRzP3xzZWNzP3xzfG1pbnV0ZXM/fG1pbnM/fG18aG91cnM/fGhycz98aHxkYXlzP3xkfHllYXJzP3x5cnM/fHkpPyQvaS5leGVjKFxuICAgIHN0clxuICApO1xuICBpZiAoIW1hdGNoKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ3llYXJzJzpcbiAgICBjYXNlICd5ZWFyJzpcbiAgICBjYXNlICd5cnMnOlxuICAgIGNhc2UgJ3lyJzpcbiAgICBjYXNlICd5JzpcbiAgICAgIHJldHVybiBuICogeTtcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkO1xuICAgIGNhc2UgJ2hvdXJzJzpcbiAgICBjYXNlICdob3VyJzpcbiAgICBjYXNlICdocnMnOlxuICAgIGNhc2UgJ2hyJzpcbiAgICBjYXNlICdoJzpcbiAgICAgIHJldHVybiBuICogaDtcbiAgICBjYXNlICdtaW51dGVzJzpcbiAgICBjYXNlICdtaW51dGUnOlxuICAgIGNhc2UgJ21pbnMnOlxuICAgIGNhc2UgJ21pbic6XG4gICAgY2FzZSAnbSc6XG4gICAgICByZXR1cm4gbiAqIG07XG4gICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgY2FzZSAnc2Vjb25kJzpcbiAgICBjYXNlICdzZWNzJzpcbiAgICBjYXNlICdzZWMnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21pbGxpc2Vjb25kcyc6XG4gICAgY2FzZSAnbWlsbGlzZWNvbmQnOlxuICAgIGNhc2UgJ21zZWNzJzpcbiAgICBjYXNlICdtc2VjJzpcbiAgICBjYXNlICdtcyc6XG4gICAgICByZXR1cm4gbjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIFNob3J0IGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdFNob3J0KG1zKSB7XG4gIGlmIChtcyA+PSBkKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJztcbiAgfVxuICBpZiAobXMgPj0gaCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCc7XG4gIH1cbiAgaWYgKG1zID49IG0pIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICB9XG4gIGlmIChtcyA+PSBzKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJztcbiAgfVxuICByZXR1cm4gbXMgKyAnbXMnO1xufVxuXG4vKipcbiAqIExvbmcgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10TG9uZyhtcykge1xuICByZXR1cm4gcGx1cmFsKG1zLCBkLCAnZGF5JykgfHxcbiAgICBwbHVyYWwobXMsIGgsICdob3VyJykgfHxcbiAgICBwbHVyYWwobXMsIG0sICdtaW51dGUnKSB8fFxuICAgIHBsdXJhbChtcywgcywgJ3NlY29uZCcpIHx8XG4gICAgbXMgKyAnIG1zJztcbn1cblxuLyoqXG4gKiBQbHVyYWxpemF0aW9uIGhlbHBlci5cbiAqL1xuXG5mdW5jdGlvbiBwbHVyYWwobXMsIG4sIG5hbWUpIHtcbiAgaWYgKG1zIDwgbikge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAobXMgPCBuICogMS41KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IobXMgLyBuKSArICcgJyArIG5hbWU7XG4gIH1cbiAgcmV0dXJuIE1hdGguY2VpbChtcyAvIG4pICsgJyAnICsgbmFtZSArICdzJztcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvKlxuICogQ29weXJpZ2h0IDogUGFydG5lcmluZyAzLjAgKDIwMDctMjAxOSlcbiAqIEF1dGhvciA6IFN5bHZhaW4gTWFow6kgPHN5bHZhaW4ubWFoZUBwYXJ0bmVyaW5nLmZyPlxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIGRpeWEtc2RrLlxuICpcbiAqIGRpeWEtc2RrIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIGRpeWEtc2RrIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIGRpeWEtc2RrLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbihmdW5jdGlvbiAoKSB7XG5cdGNvbnN0IENvbm5lY3RvclYxID0gcmVxdWlyZShcIi4vdjEvY29ubmVjdG9yLmpzXCIpO1xuXHRjb25zdCBDb25uZWN0b3JWMiA9IHJlcXVpcmUoYC4vdjIvY29ubmVjdG9yLmpzYClcblxuXHRsZXQgRGl5YVNlbGVjdG9yID0gZDEuRGl5YVNlbGVjdG9yO1xuXG5cdC8qKiBjcmVhdGUgU3RhdHVzIHNlcnZpY2UgKiovXG5cdERpeWFTZWxlY3Rvci5wcm90b3R5cGUuU3RhdHVzID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSggKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0dGhpcy5yZXF1ZXN0KHtcblx0XHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0XHRcdGZ1bmM6ICdHZXRBUElWZXJzaW9uJyxcblx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRpZiAoZXJyID09IG51bGwpIHtcblx0XHRcdFx0XHRyZXNvbHZlKGRhdGEpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH0pXG5cdFx0LnRoZW4oIChkYXRhKSA9PiB7XG5cdFx0XHRpZiAoZGF0YSA9PT0gMikge1xuXHRcdFx0XHRyZXR1cm4gbmV3IENvbm5lY3RvclYyKHRoaXMpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zdGFudGlhdGUgY29ubmVjdG9yJylcblx0XHRcdH1cblx0XHR9KVxuXHRcdC5jYXRjaCggKGVycikgPT4ge1xuXHRcdFx0aWYgKGVyci5pbmNsdWRlcyhcIk1ldGhvZCAnR2V0QVBJVmVyc2lvbicgbm90IGZvdW5kIGluIGludHJvc3BlY3Rpb24gZGF0YVwiKSkge1xuXHRcdFx0XHRyZXR1cm4gbmV3IENvbm5lY3RvclYxKHRoaXMpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGVycik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG59KSgpXG4iLCIvKlxuICogQ29weXJpZ2h0IDogUGFydG5lcmluZyAzLjAgKDIwMDctMjAxOSlcbiAqIEF1dGhvciA6IFN5bHZhaW4gTWFow6kgPHN5bHZhaW4ubWFoZUBwYXJ0bmVyaW5nLmZyPlxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIGRpeWEtc2RrLlxuICpcbiAqIGRpeWEtc2RrIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIGRpeWEtc2RrIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIGRpeWEtc2RrLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGlzQnJvd3NlciA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyk7XG52YXIgUHJvbWlzZTtcbmlmICghaXNCcm93c2VyKSB7IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpOyB9XG5lbHNlIHsgUHJvbWlzZSA9IHdpbmRvdy5Qcm9taXNlOyB9XG5cblxuY2xhc3MgQ29ubmVjdG9yVjEge1xuXHQvKipcblx0ICpcdGNhbGxiYWNrIDogZnVuY3Rpb24gY2FsbGVkIGFmdGVyIG1vZGVsIHVwZGF0ZWRcblx0ICogKi9cblx0Y29uc3RydWN0b3Ioc2VsZWN0b3IpIHtcblx0XHR0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3I7XG5cdFx0dGhpcy5fY29kZXIgPSBzZWxlY3Rvci5lbmNvZGUoKTtcblx0XHR0aGlzLnN1YnNjcmlwdGlvbnMgPSBbXTtcblxuXHRcdC8qKiBtb2RlbCBvZiByb2JvdCA6IGF2YWlsYWJsZSBwYXJ0cyBhbmQgc3RhdHVzICoqL1xuXHRcdHRoaXMucm9ib3RNb2RlbCA9IFtdO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFN1YnNjcmliZSB0byBlcnJvci9zdGF0dXMgdXBkYXRlc1xuXHQgKi9cblx0d2F0Y2ggKHJvYm90TmFtZXMsIGNhbGxiYWNrKSB7XG5cdFx0dGhpcy5zZWxlY3Rvci5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cdFx0dGhpcy5zZWxlY3Rvci5fY29ubmVjdGlvbi5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cdFx0bGV0IHNlbmREYXRhID0gW107XG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KCAoKSA9PiB7XG5cdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHRcdFx0ZnVuYzogJ0dldE1hbmFnZWRPYmplY3RzJyxcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnb3JnLmZyZWVkZXNrdG9wLkRCdXMuT2JqZWN0TWFuYWdlcicsXG5cdFx0XHRcdH1cblx0XHRcdH0sIChwZWVySWQsIGVyciwgb2JqRGF0YSkgPT4geyAvLyBnZXQgYWxsIG9iamVjdCBwYXRocywgaW50ZXJmYWNlcyBhbmQgcHJvcGVydGllcyBjaGlsZHJlbiBvZiBTdGF0dXNcblx0XHRcdFx0bGV0IHJvYm90TmFtZSA9ICcnO1xuXHRcdFx0XHRsZXQgcm9ib3RJZCA9IDE7XG5cdFx0XHRcdGZvciAobGV0IG9iamVjdFBhdGggaW4gb2JqRGF0YSkge1xuXHRcdFx0XHRcdGlmIChvYmpEYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdHJvYm90TmFtZSA9IG9iakRhdGFbb2JqZWN0UGF0aF1bJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90J10uUm9ib3ROYW1lO1xuXHRcdFx0XHRcdFx0cm9ib3RJZCA9IG9iakRhdGFbb2JqZWN0UGF0aF1bJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90J10uUm9ib3RJZDtcblx0XHRcdFx0XHRcdHRoaXMuZ2V0QWxsU3RhdHVzZXMocm9ib3ROYW1lLCBmdW5jdGlvbiAobW9kZWwpIHtcblx0XHRcdFx0XHRcdFx0Y2FsbGJhY2sobW9kZWwsIHBlZXJJZCk7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAob2JqRGF0YVtvYmplY3RQYXRoXVsnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCddICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdGxldCBzdWJzID0gdGhpcy5zZWxlY3Rvci5zdWJzY3JpYmUoey8vIHN1YnNjcmliZXMgdG8gc3RhdHVzIGNoYW5nZXMgZm9yIGFsbCBwYXJ0c1xuXHRcdFx0XHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHRcdFx0XHRcdFx0ZnVuYzogJ1N0YXR1c0NoYW5nZWQnLFxuXHRcdFx0XHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0XHRcdFx0XHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdGRhdGE6IHJvYm90TmFtZXNcblx0XHRcdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJTdGF0dXNTdWJzY3JpYmU6XCIgKyBlcnIpO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdHNlbmREYXRhWzBdID0gZGF0YTtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3Yoc2VuZERhdGEsIHJvYm90SWQsIHJvYm90TmFtZSk7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y2FsbGJhY2sodGhpcy5yb2JvdE1vZGVsLCBwZWVySWQpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR0aGlzLnN1YnNjcmlwdGlvbnMucHVzaChzdWJzKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fSlcblx0XHQuY2F0Y2goIGVyciA9PiB7XG5cdFx0XHRMb2dnZXIuZXJyb3IoZXJyKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDbG9zZSBhbGwgc3Vic2NyaXB0aW9uc1xuXHQgKi9cblx0Y2xvc2VTdWJzY3JpcHRpb25zICgpIHtcblx0XHRmb3IgKHZhciBpIGluIHRoaXMuc3Vic2NyaXB0aW9ucykge1xuXHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zW2ldLmNsb3NlKCk7XG5cdFx0fVxuXHRcdHRoaXMuc3Vic2NyaXB0aW9ucyA9IFtdO1xuXHRcdHRoaXMucm9ib3RNb2RlbCA9IFtdO1xuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZSBpbnRlcm5hbCByb2JvdCBtb2RlbCB3aXRoIHJlY2VpdmVkIGRhdGEgKHZlcnNpb24gMilcblx0ICogQHBhcmFtICB7T2JqZWN0fSBkYXRhIGRhdGEgcmVjZWl2ZWQgZnJvbSBEaXlhTm9kZSBieSB3ZWJzb2NrZXRcblx0ICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRfZ2V0Um9ib3RNb2RlbEZyb21SZWN2IChkYXRhLCByb2JvdElkLCByb2JvdE5hbWUpIHtcblx0XHRpZiAodGhpcy5yb2JvdE1vZGVsID09IG51bGwpXG5cdFx0XHR0aGlzLnJvYm90TW9kZWwgPSBbXTtcblxuXHRcdGlmICh0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0gIT0gbnVsbClcblx0XHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXS5wYXJ0cyA9IHt9OyAvLyByZXNldCBwYXJ0c1xuXG5cdFx0aWYgKHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSA9PSBudWxsKVxuXHRcdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdID0ge307XG5cblx0XHR0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0gPSB7XG5cdFx0XHRyb2JvdDoge1xuXHRcdFx0XHRuYW1lOiByb2JvdE5hbWVcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdLnBhcnRzID0ge307XG5cdFx0bGV0IHJQYXJ0cyA9IHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXS5wYXJ0cztcblxuXHRcdGRhdGEuZm9yRWFjaCggZCA9PiB7XG5cdFx0XHRsZXQgcGFydElkID0gZFswXTtcblx0XHRcdGxldCBjYXRlZ29yeSA9IGRbMV07XG5cdFx0XHRsZXQgcGFydE5hbWUgPSBkWzJdO1xuXHRcdFx0bGV0IGxhYmVsID0gZFszXTtcblx0XHRcdGxldCB0aW1lID0gZFs0XTtcblx0XHRcdGxldCBjb2RlID0gZFs1XTtcblx0XHRcdGxldCBjb2RlUmVmID0gZFs2XTtcblx0XHRcdGxldCBtc2cgPSBkWzddO1xuXHRcdFx0bGV0IGNyaXRMZXZlbCA9IGRbOF07XG5cdFx0XHRsZXQgZGVzY3JpcHRpb24gPSBkWzldO1xuXG5cdFx0XHRpZiAoclBhcnRzW3BhcnRJZF0gPT0gbnVsbCkge1xuXHRcdFx0XHRyUGFydHNbcGFydElkXSA9IHt9O1xuXHRcdFx0fVxuXHRcdFx0clBhcnRzW3BhcnRJZF0uY2F0ZWdvcnkgPSBjYXRlZ29yeTtcblx0XHRcdHJQYXJ0c1twYXJ0SWRdLm5hbWUgPSBwYXJ0TmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0clBhcnRzW3BhcnRJZF0ubGFiZWwgPSBsYWJlbDtcblxuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdCA9PSBudWxsKVxuXHRcdFx0XHRyUGFydHNbcGFydElkXS5lcnJvckxpc3QgPSB7fTtcblxuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdFtjb2RlUmVmXSA9PSBudWxsKVxuXHRcdFx0XHRyUGFydHNbcGFydElkXS5lcnJvckxpc3RbY29kZVJlZl0gPSB7XG5cdFx0XHRcdFx0bXNnOiBtc2csXG5cdFx0XHRcdFx0Y3JpdExldmVsOiBjcml0TGV2ZWwsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG5cdFx0XHRcdH07XG5cdFx0XHRsZXQgZXZ0c190bXAgPSB7XG5cdFx0XHRcdHRpbWU6IHRoaXMuX2NvZGVyLmZyb20odGltZSksXG5cdFx0XHRcdGNvZGU6IHRoaXMuX2NvZGVyLmZyb20oY29kZSksXG5cdFx0XHRcdGNvZGVSZWY6IHRoaXMuX2NvZGVyLmZyb20oY29kZVJlZilcblx0XHRcdH07XG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheShldnRzX3RtcC5jb2RlKSB8fCBBcnJheS5pc0FycmF5KGV2dHNfdG1wLnRpbWUpXG5cdFx0XHRcdHx8IEFycmF5LmlzQXJyYXkoZXZ0c190bXAuY29kZVJlZikpIHtcblx0XHRcdFx0aWYgKGV2dHNfdG1wLmNvZGUubGVuZ3RoID09PSBldnRzX3RtcC5jb2RlUmVmLmxlbmd0aFxuXHRcdFx0XHRcdCYmIGV2dHNfdG1wLmNvZGUubGVuZ3RoID09PSBldnRzX3RtcC50aW1lLmxlbmd0aCkge1xuXHRcdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmV2dHMgPSBbXTtcblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGV2dHNfdG1wLmNvZGUubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmV2dHMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdHRpbWU6IGV2dHNfdG1wLnRpbWVbaV0sXG5cdFx0XHRcdFx0XHRcdGNvZGU6IGV2dHNfdG1wLmNvZGVbaV0sXG5cdFx0XHRcdFx0XHRcdGNvZGVSZWY6IGV2dHNfdG1wLmNvZGVSZWZbaV1cblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJTdGF0dXM6SW5jb25zaXN0YW50IGxlbmd0aHMgb2YgYnVmZmVycyAodGltZS9jb2RlL2NvZGVSZWYpXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgeyAvKioganVzdCBpbiBjYXNlLCB0byBwcm92aWRlIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgKiovXG5cdFx0XHRcdC8qKiBzZXQgcmVjZWl2ZWQgZXZlbnQgKiovXG5cdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmV2dHMgPSBbe1xuXHRcdFx0XHRcdHRpbWU6IGV2dHNfdG1wLnRpbWUsXG5cdFx0XHRcdFx0Y29kZTogZXZ0c190bXAuY29kZSxcblx0XHRcdFx0XHRjb2RlUmVmOiBldnRzX3RtcC5jb2RlUmVmXG5cdFx0XHRcdH1dO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cbiAgICAvKipcblx0ICogU2V0IG9uIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGZpbmQgc3RhdHVzIHRvIG1vZGlmeVxuXHQgKiBAcGFyYW0gcGFydE5hbWUgXHR0byBmaW5kIHN0YXR1cyB0byBtb2RpZnlcblx0ICogQHBhcmFtIGNvZGUgICAgICBuZXdDb2RlXG5cdCAqIEBwYXJhbSBzb3VyY2UgICAgc291cmNlXG5cdCAqIEBwYXJhbSBjYWxsYmFjayAgcmV0dXJuIGNhbGxiYWNrICg8Ym9vbD5zdWNjZXNzKVxuXHQgKi9cblx0c2V0U3RhdHVzIChyb2JvdE5hbWUsIHBhcnROYW1lLCBjb2RlLCBzb3VyY2UsIGNhbGxiYWNrKSB7XG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KCAoKSA9PiB7XG5cdFx0XHR2YXIgb2JqZWN0UGF0aCA9IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9cIiArIHRoaXMuX3NwbGl0QW5kQ2FtZWxDYXNlKHJvYm90TmFtZSwgXCItXCIpICsgXCIvUGFydHMvXCIgKyBwYXJ0TmFtZTtcblx0XHRcdHRoaXMucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRcdGZ1bmM6IFwiU2V0UGFydFwiLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0XHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRjb2RlOiBjb2RlLFxuXHRcdFx0XHRcdHNvdXJjZTogc291cmNlIHwgMVxuXHRcdFx0XHR9XG5cdFx0XHR9LCB0aGlzLl9vblNldFBhcnQuYmluZCh0aGlzLCBjYWxsYmFjaykpO1xuXHRcdH0pXG5cdFx0LmNhdGNoKCBlcnIgPT4ge1xuXHRcdFx0TG9nZ2VyLmVycm9yKGVycik7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogQ2FsbGJhY2sgb24gU2V0UGFydFxuXHQgKi9cblx0X29uU2V0UGFydCAoY2FsbGJhY2ssIHBlZXJJZCwgZXJyLCBkYXRhKSB7XG5cdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayhmYWxzZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKHRydWUpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgb25lIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGdldCBzdGF0dXNcblx0ICogQHBhcmFtIHBhcnROYW1lIFx0dG8gZ2V0IHN0YXR1c1xuXHQgKiBAcGFyYW0gY2FsbGJhY2sgIHJldHVybiBjYWxsYmFjaygtMSBpZiBub3QgZm91bmQvZGF0YSBvdGhlcndpc2UpXG5cdCAqIEBwYXJhbSBfZnVsbCAgICAgbW9yZSBkYXRhIGFib3V0IHN0YXR1c1xuXHQgKi9cblx0Z2V0U3RhdHVzIChyb2JvdE5hbWUsIHBhcnROYW1lLCBjYWxsYmFjay8qLCBfZnVsbCovKSB7XG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KCAoKSA9PiB7XG5cdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHRcdFx0ZnVuYzogJ0dldE1hbmFnZWRPYmplY3RzJyxcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnb3JnLmZyZWVkZXNrdG9wLkRCdXMuT2JqZWN0TWFuYWdlcicsXG5cdFx0XHRcdH1cblx0XHRcdH0sIHRoaXMub25HZXRNYW5hZ2VkT2JqZWN0c0dldFN0YXR1cy5iaW5kKHRoaXMsIHJvYm90TmFtZSwgcGFydE5hbWUsIGNhbGxiYWNrKSk7XG5cdFx0fSlcblx0XHQuY2F0Y2goIGVyciA9PiB7XG5cdFx0XHRMb2dnZXIuZXJyb3IoZXJyKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBvbiBHZXRNYW5hZ2VkT2JqZWN0cyBpbiBHZXRTdGF0dXNcblx0ICovXG5cdG9uR2V0TWFuYWdlZE9iamVjdHNHZXRTdGF0dXMgKHJvYm90TmFtZSwgcGFydE5hbWUsIGNhbGxiYWNrLCBwZWVySWQsIGVyciwgZGF0YSkge1xuXHRcdGxldCBvYmplY3RQYXRoUm9ib3QgPSBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1cy9Sb2JvdHMvXCIgKyB0aGlzLl9zcGxpdEFuZENhbWVsQ2FzZShyb2JvdE5hbWUsIFwiLVwiKTtcblx0XHRsZXQgb2JqZWN0UGF0aFBhcnQgPSBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1cy9Sb2JvdHMvXCIgKyB0aGlzLl9zcGxpdEFuZENhbWVsQ2FzZShyb2JvdE5hbWUsIFwiLVwiKSArIFwiL1BhcnRzL1wiICsgcGFydE5hbWU7XG5cdFx0bGV0IHJvYm90SWQgPSBkYXRhW29iamVjdFBhdGhSb2JvdF1bJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90J10uUm9ib3RJZFxuXHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRzZXJ2aWNlOiBcInN0YXR1c1wiLFxuXHRcdFx0ZnVuYzogXCJHZXRQYXJ0XCIsXG5cdFx0XHRvYmo6IHtcblx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCcsXG5cdFx0XHRcdHBhdGg6IG9iamVjdFBhdGhQYXJ0XG5cdFx0XHR9XG5cdFx0fSwgdGhpcy5fb25HZXRQYXJ0LmJpbmQodGhpcywgcm9ib3RJZCwgcm9ib3ROYW1lLCBjYWxsYmFjaykpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIG9uIEdldFBhcnRcblx0ICovXG5cdF9vbkdldFBhcnQgKHJvYm90SWQsIHJvYm90TmFtZSwgY2FsbGJhY2ssIHBlZXJJZCwgZXJyLCBkYXRhKSB7XG5cdFx0bGV0IHNlbmREYXRhID0gW11cblx0XHRzZW5kRGF0YS5wdXNoKGRhdGEpXG5cdFx0dGhpcy5fZ2V0Um9ib3RNb2RlbEZyb21SZWN2KHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soLTEpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgYWxsIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGdldCBzdGF0dXNcblx0ICogQHBhcmFtIHBhcnROYW1lIFx0dG8gZ2V0IHN0YXR1c1xuXHQgKiBAcGFyYW0gY2FsbGJhY2tcdFx0cmV0dXJuIGNhbGxiYWNrKC0xIGlmIG5vdCBmb3VuZC9kYXRhIG90aGVyd2lzZSlcblx0ICogQHBhcmFtIF9mdWxsIFx0bW9yZSBkYXRhIGFib3V0IHN0YXR1c1xuXHQgKi9cblx0Z2V0QWxsU3RhdHVzZXMgKHJvYm90TmFtZSwgY2FsbGJhY2spIHtcblx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0b2JqOiB7XG5cdFx0XHRcdGludGVyZmFjZTogJ29yZy5mcmVlZGVza3RvcC5EQnVzLk9iamVjdE1hbmFnZXInLFxuXHRcdFx0fVxuXHRcdH0sIHRoaXMuX29uR2V0TWFuYWdlZE9iamVjdHNHZXRBbGxTdGF0dXNlcy5iaW5kKHRoaXMsIHJvYm90TmFtZSwgY2FsbGJhY2spKVxuXHR9XG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIG9uIEdldE1hbmFnZWRPYmplY3RzIGluIEdldEFsbFN0YXR1c2VzXG5cdCAqL1xuXHRfb25HZXRNYW5hZ2VkT2JqZWN0c0dldEFsbFN0YXR1c2VzIChyb2JvdE5hbWUsIGNhbGxiYWNrLCBwZWVySWQsIGVyciwgZGF0YSkge1xuXHRcdGxldCBvYmplY3RQYXRoID0gXCIvZnIvcGFydG5lcmluZy9TdGF0dXMvUm9ib3RzL1wiICsgdGhpcy5fc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIik7XG5cdFx0aWYgKGRhdGFbb2JqZWN0UGF0aF0gIT0gbnVsbCkge1xuXHRcdFx0aWYgKGRhdGFbb2JqZWN0UGF0aF1bJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90J10gIT0gbnVsbCkge1xuXHRcdFx0XHRsZXQgcm9ib3RJZCA9IGRhdGFbb2JqZWN0UGF0aF1bJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90J10uUm9ib3RJZFxuXHRcdFx0XHQvL3ZhciBmdWxsID0gX2Z1bGwgfHwgZmFsc2U7XG5cdFx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdFx0XHRmdW5jOiBcIkdldEFsbFBhcnRzXCIsXG5cdFx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCcsXG5cdFx0XHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCB0aGlzLl9vbkdldEFsbFBhcnRzLmJpbmQodGhpcywgcm9ib3RJZCwgcm9ib3ROYW1lLCBjYWxsYmFjaykpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiSW50ZXJmYWNlIGZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90IGRvZXNuJ3QgZXhpc3QhXCIpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRMb2dnZXIuZXJyb3IoXCJPYmplY3RQYXRoIFwiICsgb2JqZWN0UGF0aCArIFwiIGRvZXNuJ3QgZXhpc3QhXCIpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBvbiBHZXRBbGxQYXJ0c1xuXHQgKi9cblx0X29uR2V0QWxsUGFydHMgKHJvYm90SWQsIHJvYm90TmFtZSwgY2FsbGJhY2ssIHBlZXJJZCwgZXJyLCBkYXRhKSB7XG5cdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjaygtMSk7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5fZ2V0Um9ib3RNb2RlbEZyb21SZWN2KGRhdGEsIHJvYm90SWQsIHJvYm90TmFtZSk7XG5cdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwpO1xuXHRcdH1cblx0fVxuXG5cdF9zcGxpdEFuZENhbWVsQ2FzZSAoaW5TdHJpbmcsIGRlbGltaXRlcikge1xuXHRcdGxldCBhcnJheVNwbGl0U3RyaW5nID0gaW5TdHJpbmcuc3BsaXQoZGVsaW1pdGVyKTtcblx0XHRsZXQgb3V0Q2FtZWxTdHJpbmcgPSAnJztcblx0XHRhcnJheVNwbGl0U3RyaW5nLmZvckVhY2goIHN0ciA9PiB7XG5cdFx0XHRvdXRDYW1lbFN0cmluZyArPSBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc3Vic3RyaW5nKDEpO1xuXHRcdH0pO1xuXHRcdHJldHVybiBvdXRDYW1lbFN0cmluZztcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbm5lY3RvclYxO1xuIiwiLypcbiAqIENvcHlyaWdodCA6IFBhcnRuZXJpbmcgMy4wICgyMDA3LTIwMTkpXG4gKiBBdXRob3IgOiBTeWx2YWluIE1haMOpIDxzeWx2YWluLm1haGVAcGFydG5lcmluZy5mcj5cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBkaXlhLXNkay5cbiAqXG4gKiBkaXlhLXNkayBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBkaXlhLXNkayBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCBkaXlhLXNkay4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmNvbnN0IGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgnc3RhdHVzOmNvbm5lY3RvcicpO1xuXG52YXIgV2F0Y2hlciA9IHJlcXVpcmUoJy4vd2F0Y2hlci5qcycpO1xudmFyIENvbm5lY3RvclYxID0gcmVxdWlyZSgnLi4vdjEvY29ubmVjdG9yLmpzJyk7XG5cbmNsYXNzIENvbm5lY3RvclYyIGV4dGVuZHMgQ29ubmVjdG9yVjEge1xuXHQvKipcblx0ICpcdGNhbGxiYWNrIDogZnVuY3Rpb24gY2FsbGVkIGFmdGVyIG1vZGVsIHVwZGF0ZWRcblx0ICogKi9cblx0Y29uc3RydWN0b3Ioc2VsZWN0b3IpIHtcblx0XHRzdXBlcihzZWxlY3Rvcik7XG5cdFx0dGhpcy53YXRjaGVycyA9IFtdO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFN1YnNjcmliZSB0byBlcnJvci9zdGF0dXMgdXBkYXRlc1xuXHQgKi9cblx0d2F0Y2ggKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG5cblx0XHQvLyBkbyBub3QgY3JlYXRlIHdhdGNoZXIgd2l0aG91dCBhIGNhbGxiYWNrXG5cdFx0aWYgKGNhbGxiYWNrID09IG51bGwgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cblx0XHRsZXQgd2F0Y2hlciA9IG5ldyBXYXRjaGVyKHRoaXMuc2VsZWN0b3IsIG9wdGlvbnMpO1xuXG5cdFx0Ly8gYWRkIHdhdGNoZXIgaW4gd2F0Y2hlciBsaXN0XG5cdFx0dGhpcy53YXRjaGVycy5wdXNoKHdhdGNoZXIpO1xuXG5cdFx0d2F0Y2hlci5vbignZGF0YScsIChkYXRhKSA9PiB7XG5cdFx0XHRkZWJ1ZyhkYXRhKTtcblx0XHRcdGNhbGxiYWNrKHRoaXMuX2dldFJvYm90TW9kZWxGcm9tUmVjdihkYXRhLnBhcnRzLFxuXHRcdFx0XHRkYXRhLnJvYm90SWQsXG5cdFx0XHRcdGRhdGEucm9ib3ROYW1lKSxcblx0XHRcdFx0ZGF0YS5wZWVySWQpXG5cdFx0fSk7XG5cdFx0d2F0Y2hlci5vbignc3RvcCcsIHRoaXMuX3JlbW92ZVdhdGNoZXIpO1xuXG5cdFx0cmV0dXJuIHdhdGNoZXI7XG5cdH1cblxuXHQvKipcblx0ICogQ2FsbGJhY2sgdG8gcmVtb3ZlIHdhdGNoZXIgZnJvbSBsaXN0XG5cdCAqIEBwYXJhbSB3YXRjaGVyIHRvIGJlIHJlbW92ZWRcblx0ICovXG5cdF9yZW1vdmVXYXRjaGVyICh3YXRjaGVyKSB7XG5cdFx0Ly8gZmluZCBhbmQgcmVtb3ZlIHdhdGNoZXIgaW4gbGlzdFxuXHRcdHRoaXMud2F0Y2hlcnMuZmluZCggKGVsLCBpZCwgd2F0Y2hlcnMpID0+IHtcblx0XHRcdGlmICh3YXRjaGVyID09PSBlbCkge1xuXHRcdFx0XHR3YXRjaGVycy5zcGxpY2UoaWQsIDEpOyAvLyByZW1vdmVcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fSk7XG5cdH1cblxuXHRzdG9wV2F0Y2hlcnMgKCkge1xuXHRcdHRoaXMud2F0Y2hlcnMuZm9yRWFjaCggd2F0Y2hlciA9PiB7XG5cdFx0XHQvLyByZW1vdmUgbGlzdGVuZXIgb24gc3RvcCBldmVudCB0byBhdm9pZCBwdXJnaW5nIHdhdGNoZXJzIHR3aWNlXG5cdFx0XHR3YXRjaGVyLnJlbW92ZUxpc3RlbmVyKCdzdG9wJywgdGhpcy5fcmVtb3ZlV2F0Y2hlcik7XG5cdFx0XHR3YXRjaGVyLnN0b3AoKTtcblx0XHR9KTtcblx0XHR0aGlzLndhdGNoZXJzID0gW107XG5cdH1cblxuXHRjbG9zZVN1YnNjcmlwdGlvbnMgKCkge1xuXHRcdGNvbnNvbGUud2FybignRGVwcmVjYXJlZCBmdW5jdGlvbiwgdXNlIHN0b3BXYXRjaGVycyBpbnN0ZWFkJyk7XG5cdFx0dGhpcy5zdG9wV2F0Y2hlcnMoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgaW50ZXJuYWwgcm9ib3QgbW9kZWwgd2l0aCByZWNlaXZlZCBkYXRhICh2ZXJzaW9uIDIpXG5cdCAqIEBwYXJhbSAge0FycmF5IG9mIEFycmF5IG9mIFBhcnRJbmZvIChzdHJ1Y3QpfSBkYXRhIGRhdGEgcmVjZWl2ZWQgZnJvbVxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEaXlhTm9kZSBieSB3ZWJzb2NrZXRcblx0ICogQHBhcmFtICB7aW50fSByb2JvdElkIGlkIG9mIHRoZSByb2JvdFxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHJvYm90TmFtZSBuYW1lIG9mIHRoZSByb2JvdFxuXHQgKiBAcmV0dXJuIHtbdHlwZV19IGRlc2NyaXB0aW9uXVxuXHQgKi9cblx0X2dldFJvYm90TW9kZWxGcm9tUmVjdiAoZGF0YSwgcm9ib3RJZCwgcm9ib3ROYW1lKSB7XG5cdFx0aWYgKHRoaXMucm9ib3RNb2RlbCA9PSBudWxsKVxuXHRcdFx0dGhpcy5yb2JvdE1vZGVsID0gW107XG5cblx0XHRpZiAodGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdICE9IG51bGwpXG5cdFx0XHR0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0ucGFydHMgPSB7fTtcblxuXHRcdGlmICh0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0gPT0gbnVsbClcblx0XHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSA9IHt9O1xuXG5cdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdID0ge1xuXHRcdFx0cm9ib3Q6IHtcblx0XHRcdFx0bmFtZTogcm9ib3ROYW1lXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXS5wYXJ0cyA9IHt9O1xuXHRcdGxldCByUGFydHMgPSB0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0ucGFydHM7XG5cblx0XHRkYXRhLmZvckVhY2goIGQgPT4ge1xuXHRcdFx0bGV0IHBhcnRJZCA9IGRbMF07XG5cdFx0XHRsZXQgY2F0ZWdvcnkgPSBkWzFdO1xuXHRcdFx0bGV0IHBhcnROYW1lID0gZFsyXTtcblx0XHRcdGxldCBsYWJlbCA9IGRbM107XG5cdFx0XHRsZXQgdGltZSA9IGRbNF07XG5cdFx0XHRsZXQgY29kZSA9IGRbNV07XG5cdFx0XHRsZXQgY29kZVJlZiA9IGRbNl07XG5cdFx0XHRsZXQgbXNnID0gZFs3XTtcblx0XHRcdGxldCBjcml0TGV2ZWwgPSBkWzhdO1xuXHRcdFx0bGV0IGRlc2NyaXB0aW9uID0gZFs5XTtcblxuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdID09IG51bGwpIHtcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0gPSB7fTtcblx0XHRcdH1cblx0XHRcdHJQYXJ0c1twYXJ0SWRdLmNhdGVnb3J5ID0gY2F0ZWdvcnk7XG5cdFx0XHRyUGFydHNbcGFydElkXS5uYW1lID0gcGFydE5hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdHJQYXJ0c1twYXJ0SWRdLmxhYmVsID0gbGFiZWw7XG5cblx0XHRcdGlmIChyUGFydHNbcGFydElkXS5lcnJvckxpc3QgPT0gbnVsbClcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0ID0ge307XG5cblx0XHRcdGlmIChyUGFydHNbcGFydElkXS5lcnJvckxpc3RbY29kZVJlZl0gPT0gbnVsbClcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0W2NvZGVSZWZdID0ge1xuXHRcdFx0XHRcdG1zZzogbXNnLFxuXHRcdFx0XHRcdGNyaXRMZXZlbDogY3JpdExldmVsLFxuXHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuXHRcdFx0XHR9O1xuXHRcdFx0bGV0IGV2dHNfdG1wID0ge1xuXHRcdFx0XHR0aW1lOiB0aGlzLl9jb2Rlci5mcm9tKHRpbWUpLFxuXHRcdFx0XHRjb2RlOiB0aGlzLl9jb2Rlci5mcm9tKGNvZGUpLFxuXHRcdFx0XHRjb2RlUmVmOiB0aGlzLl9jb2Rlci5mcm9tKGNvZGVSZWYpXG5cdFx0XHR9O1xuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdLmV2dHMgPT0gbnVsbCkge1xuXHRcdFx0XHRyUGFydHNbcGFydElkXS5ldnRzID0gW107XG5cdFx0XHR9XG5cdFx0XHRyUGFydHNbcGFydElkXS5ldnRzLnB1c2goZXZ0c190bXApO1xuXHRcdH0pO1xuXHRcdHJldHVybiB0aGlzLnJvYm90TW9kZWw7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb25uZWN0b3JWMjsiLCIvKlxuICogQ29weXJpZ2h0IDogUGFydG5lcmluZyAzLjAgKDIwMDctMjAxOSlcbiAqIEF1dGhvciA6IFN5bHZhaW4gTWFow6kgPHN5bHZhaW4ubWFoZUBwYXJ0bmVyaW5nLmZyPlxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIGRpeWEtc2RrLlxuICpcbiAqIGRpeWEtc2RrIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIGRpeWEtc2RrIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIGRpeWEtc2RrLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpO1xuY29uc3QgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdzdGF0dXM6d2F0Y2hlcicpO1xuY29uc3QgZGVidWdFcnJvciA9IHJlcXVpcmUoJ2RlYnVnJykoJ3N0YXR1czp3YXRjaGVyOmVycm9ycycpO1xuXG5jbGFzcyBTdG9wQ29uZGl0aW9uIGV4dGVuZHMgRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihtc2cpIHtcblx0XHRzdXBlcihtc2cpO1xuXHRcdHRoaXMubmFtZSA9ICdTdG9wQ29uZGl0aW9uJztcblx0fVxufVxuXG5jbGFzcyBXYXRjaGVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblx0LyoqXG5cdCAqIEBwYXJhbSBlbWl0IGVtaXQgZGF0YSAobWFuZGF0b3J5KVxuXHQgKiBAcGFyYW0gY29uZmlnIHRvIGdldCBkYXRhIGZyb20gc2VydmVyXG5cdCAqL1xuXHRjb25zdHJ1Y3RvciAoc2VsZWN0b3IsIG9wdGlvbnMpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yO1xuXHRcdHRoaXMuc3Vic2NyaXB0aW9ucyA9IFtdO1xuXHRcdHRoaXMuc3RhdGUgPSAncnVubmluZyc7XG5cblx0XHR0aGlzLnJlY29ubmVjdGlvblBlcmlvZCA9IDA7IC8vIGluaXRpYWwgcGVyaW9kIGJldHdlZW4gcmVjb25uZWN0aW9uc1xuXHRcdHRoaXMubWF4UmVjb25uZWN0aW9uUGVyaW9kID0gNjAwMDA7IC8vIG1heCAxIG1pblxuXG5cdFx0Ly8gSW5jcmVhc2UgbnVtYmVyIG9mIGxpc3RlbmVycyAoU0hPVUxEIEJFIEFWT0lERUQpXG5cdFx0dGhpcy5zZWxlY3Rvci5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cdFx0dGhpcy5zZWxlY3Rvci5fY29ubmVjdGlvbi5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cblx0XHQvKiogaW5pdGlhbGlzZSBvcHRpb25zIGZvciByZXF1ZXN0ICoqL1xuXHRcdGlmIChvcHRpb25zLnNpZ25hbCA9PSBudWxsKSB7XG5cdFx0XHRvcHRpb25zLnNpZ25hbCA9ICdTdGF0dXNlc0J1ZmZlcmVkJztcblx0XHR9XG5cblx0XHR0aGlzLl9zdGF0dXNlc0RpY3Rpb25hcnkgPSB7fTtcblx0XHRkZWJ1ZyhvcHRpb25zKTtcblxuXHRcdHRoaXMud2F0Y2gob3B0aW9ucyk7IC8vIHN0YXJ0IHdhdGNoZXJcblx0fVxuXG5cdHdhdGNoIChvcHRpb25zKSB7XG5cdFx0ZGVidWcoJ2luIHdhdGNoJyk7XG5cdFx0bmV3IFByb21pc2UoIChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdvcmcuZnJlZWRlc2t0b3AuREJ1cy5PYmplY3RNYW5hZ2VyJyxcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodGhpcy5zdGF0ZSA9PT0gJ3N0b3BwZWQnKSB7XG5cdFx0XHRcdFx0cmVqZWN0KG5ldyBTdG9wQ29uZGl0aW9uKCkpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHRkZWJ1ZygnUmVxdWVzdDplbWl0RGF0YScpO1xuXHRcdFx0XHQvLyBQYXJzZSBzdGF0dXMgZGF0YVxuXHRcdFx0XHRkZWJ1ZyhkYXRhKTtcblx0XHRcdFx0ZGF0YSA9IHRoaXMuX3BhcnNlR2V0TWFuYWdlZE9iamVjdHNEYXRhKGRhdGEpO1xuXHRcdFx0XHRkZWJ1ZyhkYXRhKTtcblx0XHRcdFx0Zm9yIChsZXQgZGV2aWNlTmFtZSBpbiBkYXRhLmRldmljZXMpIHtcblx0XHRcdFx0XHRsZXQgZGV2aWNlID0gZGF0YS5kZXZpY2VzW2RldmljZU5hbWVdO1xuXHRcdFx0XHRcdGlmIChkZXZpY2UucGFydHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0XHQvLyBUT0RPIHRoZXJlIHNob3VsZCBiZSBhIHNpZ25hbCBpbmRpY2F0aW5nXG5cdFx0XHRcdFx0XHQvLyB0aGF0IHRoZSBvYmplY3RzIHBhdGhzIGhhcyBhbGwgYmUgbG9hZGVkLi4uXG5cdFx0XHRcdFx0XHQvLyBJbmRlZWQsIHRoZSBwYXJ0cyBtYXkgbm90IGhhdmUgYmVlbiBsb2FkZWQgeWV0XG5cdFx0XHRcdFx0XHRyZWplY3QoJ0Vycm9yOiBObyBwYXJ0IHlldCcpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRsZXQgZGF0YVRvRW1pdCA9IHtcblx0XHRcdFx0XHRcdHBhcnRzOiBkZXZpY2UucGFydHMsXG5cdFx0XHRcdFx0XHRyb2JvdElkOiBkZXZpY2Uucm9ib3RJZCxcblx0XHRcdFx0XHRcdHJvYm90TmFtZTogZGV2aWNlLnJvYm90TmFtZSxcblx0XHRcdFx0XHRcdHBlZXJJZDogcGVlcklkLFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0Ly8gU2VuZGluZyBwYXJ0IGRhdGEgZGV2aWNlIChyb2JvdCkgYnkgZGV2aWNlXG5cdFx0XHRcdFx0dGhpcy5lbWl0KCdkYXRhJywgZGF0YVRvRW1pdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0fSk7XG5cdFx0fSlcblx0XHQudGhlbiggKCkgPT4ge1xuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKCAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0XHRcdFx0ZnVuYzogJ0dldCcsXG5cdFx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0XHRpbnRlcmZhY2U6ICdvcmcuZnJlZWRlc2t0b3AuREJ1cy5Qcm9wZXJ0aWVzJyxcblx0XHRcdFx0XHRcdHBhdGg6ICcvZnIvcGFydG5lcmluZy9TdGF0dXMnXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0XHRpbnRlcmZhY2VfbmFtZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzJyxcblx0XHRcdFx0XHRcdHByb3BlcnR5X25hbWU6ICdTdGF0dXNlc0RpY3Rpb25hcnknXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAodGhpcy5zdGF0ZSA9PT0gJ3N0b3BwZWQnKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QobmV3IFN0b3BDb25kaXRpb24oKSk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChkYXRhICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdHRoaXMuX3N0YXR1c2VzRGljdGlvbmFyeSA9IGRhdGE7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJlamVjdCgnTm8gU3RhdHVzZXNEaWN0aW9uYXJ5IGRhdGEnKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0pXG5cdFx0LnRoZW4oICgpID0+IHtcblx0XHRcdGRlYnVnKCdTdWJzY3JpYmluZycpO1xuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKCAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdGxldCBzdWJzY3JpcHRpb24gPSB0aGlzLnNlbGVjdG9yLnN1YnNjcmliZSh7XG5cdFx0XHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdFx0XHRmdW5jOiBvcHRpb25zLnNpZ25hbCxcblx0XHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QoZXJyKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKGRhdGEgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0ZGF0YSA9IHRoaXMuX3BhcnNlU3RhdHVzQ2hhbmdlZERhdGEoZGF0YVswXSlcblx0XHRcdFx0XHRcdGZvciAobGV0IGRldmljZU5hbWUgaW4gZGF0YS5kZXZpY2VzKSB7XG5cdFx0XHRcdFx0XHRcdGxldCBkZXZpY2UgPSBkYXRhLmRldmljZXNbZGV2aWNlTmFtZV1cblx0XHRcdFx0XHRcdFx0bGV0IGRhdGFUb0VtaXQgPSB7XG5cdFx0XHRcdFx0XHRcdFx0cGFydHM6IGRldmljZS5wYXJ0cyxcblx0XHRcdFx0XHRcdFx0XHRyb2JvdElkOiBkZXZpY2Uucm9ib3RJZCxcblx0XHRcdFx0XHRcdFx0XHRyb2JvdE5hbWU6IGRldmljZS5yb2JvdE5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0cGVlcklkOiBwZWVySWQsXG5cdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdHRoaXMuZW1pdCgnZGF0YScsIGRhdGFUb0VtaXQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLnJlY29ubmVjdGlvblBlcmlvZCA9IDA7IC8vIHJlc2V0IHBlcmlvZCBvbiBzdWJzY3JpcHRpb24gcmVxdWVzdHNcblx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdHRoaXMuc3Vic2NyaXB0aW9ucy5wdXNoKHN1YnNjcmlwdGlvbik7XG5cdFx0XHR9KVxuXHRcdH0pXG5cdFx0LmNhdGNoKCBlcnIgPT4ge1xuXHRcdFx0Ly8gd2F0Y2hlciBzdG9wcGVkIDogZG8gbm90aGluZ1xuXHRcdFx0aWYgKGVyci5uYW1lID09PSAnU3RvcENvbmRpdGlvbicpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Ly8gdHJ5IHRvIHJlc3RhcnQgbGF0ZXJcblx0XHRcdGRlYnVnRXJyb3IoZXJyKTtcblx0XHRcdHRoaXMuX2Nsb3NlU3Vic2NyaXB0aW9ucygpOyAvLyBzaG91bGQgbm90IGJlIG5lY2Vzc2FyeVxuXHRcdFx0Ly8gaW5jcmVhc2UgZGVsYXkgYnkgMSBzZWNcblx0XHRcdHRoaXMucmVjb25uZWN0aW9uUGVyaW9kID0gdGhpcy5yZWNvbm5lY3Rpb25QZXJpb2QgKyAxMDAwO1xuXHRcdFx0aWYgKHRoaXMucmVjb25uZWN0aW9uUGVyaW9kID4gdGhpcy5tYXhSZWNvbm5lY3Rpb25QZXJpb2QpIHtcblx0XHRcdFx0Ly8gbWF4IDVtaW5cblx0XHRcdFx0dGhpcy5yZWNvbm5lY3Rpb25QZXJpb2QgPSB0aGlzLm1heFJlY29ubmVjdGlvblBlcmlvZDtcblx0XHRcdH1cblx0XHRcdHRoaXMud2F0Y2hUZW50YXRpdmUgPSBzZXRUaW1lb3V0KCAoKSA9PiB7XG5cdFx0XHRcdHRoaXMud2F0Y2gob3B0aW9ucyk7XG5cdFx0XHR9LCB0aGlzLnJlY29ubmVjdGlvblBlcmlvZCk7IC8vIHRyeSBhZ2FpbiBsYXRlclxuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFBhcnNlIG9iamVjdE1hbmFnZXIgaW50cm9zcGVjdCBkYXRhIHRvIGZlZWQgYmFjayBzdGF0dXMgbWFuYWdlclxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YSByYXcgZGF0YSBmcm9tIGdldE1hbmFnZWRPYmplY3RzXG5cdCAqIEByZXR1cm4ge09iamVjdHtTdHJpbmcsU3RyaW5nLEFycmF5IG9mIEFycmF5IG9mIFBhcnRJbmZvfSBwYXJzZWREYXRhXG5cdCAqL1xuXHRfcGFyc2VHZXRNYW5hZ2VkT2JqZWN0c0RhdGEgKGRhdGEpIHtcblx0XHRsZXQgcGFyc2VkRGF0YSA9IHtcblx0XHRcdGRldmljZXM6IHt9XG5cdFx0fTtcblx0XHRpZiAoZGF0YSA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gcGFyc2VkRGF0YTtcblx0XHR9XG5cblx0XHQvLyBGb3IgZWFjaCBvYmplY3QgcGF0aFxuXHRcdGZvciAobGV0IHBhdGggaW4gZGF0YSkge1xuXHRcdFx0bGV0IG9iaiA9IGRhdGFbcGF0aF07XG5cdFx0XHRsZXQgc3BsaXRQYXRoID0gcGF0aC5zcGxpdCgnLycpO1xuXHRcdFx0aWYgKHNwbGl0UGF0aC5sZW5ndGggPT09IDYpIHtcblx0XHRcdFx0Ly8gd2l0aCBkZXZpY2UgcGF0aCwgc3BsaXQgcGF0aCBoYXMgNiBpdGVtc1xuXHRcdFx0XHRmb3IgKGxldCBpZmFjZSBpbiBvYmopIHtcblx0XHRcdFx0XHRpZiAoaWZhY2UgPT09IFwiZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3RcIikge1xuXHRcdFx0XHRcdFx0Ly8gSW50ZXJmYWNlIG9mIHRoZSBkZXZpY2Ugb2JqZWN0c1xuXHRcdFx0XHRcdFx0bGV0IGRldmljZSA9IG9ialtpZmFjZV07XG5cdFx0XHRcdFx0XHQvLyBGaW5kIHByb2R1Y3QgbmFtZSBhbmQgaWRcblx0XHRcdFx0XHRcdGxldCByb2JvdE5hbWUgPSBzcGxpdFBhdGhbNV0udG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRcdGxldCBzZWxEZXZpY2UgPSBwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lXTtcblx0XHRcdFx0XHRcdGlmIChzZWxEZXZpY2UgPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRzZWxEZXZpY2UgPSB7XG5cdFx0XHRcdFx0XHRcdFx0cGFydHM6IFtdXG5cdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdHBhcnNlZERhdGEuZGV2aWNlc1tyb2JvdE5hbWVdID0gc2VsRGV2aWNlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0c2VsRGV2aWNlLnJvYm90TmFtZSA9IGRldmljZS5Sb2JvdE5hbWU7XG5cdFx0XHRcdFx0XHRzZWxEZXZpY2Uucm9ib3RJZCA9IGRldmljZS5Sb2JvdElkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChzcGxpdFBhdGgubGVuZ3RoID09PSA4KSB7XG5cdFx0XHRcdC8vIHdpdGggcGFydCBwYXRoLCBzcGxpdCBwYXRoIGhhcyA4IGl0ZW1zXG5cdFx0XHRcdGZvciAobGV0IGlmYWNlIGluIG9iaikge1xuXHRcdFx0XHRcdGlmIChpZmFjZSA9PT0gXCJmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0XCIpIHtcblx0XHRcdFx0XHRcdC8vIEludGVyZmFjZSBvZiB0aGUgcGFydCBvYmplY3RzXG5cdFx0XHRcdFx0XHRsZXQgcGFydCA9IG9ialtpZmFjZV07XG5cdFx0XHRcdFx0XHQvLyBGaW5kIHByb2R1Y3QgbmFtZVxuXHRcdFx0XHRcdFx0bGV0IHJvYm90TmFtZSA9IHNwbGl0UGF0aFs1XS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdFx0bGV0IHNlbERldmljZSA9IHBhcnNlZERhdGEuZGV2aWNlc1tyb2JvdE5hbWVdO1xuXHRcdFx0XHRcdFx0aWYgKHNlbERldmljZSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHNlbERldmljZSA9IHtcblx0XHRcdFx0XHRcdFx0XHRwYXJ0czogW11cblx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0cGFyc2VkRGF0YS5kZXZpY2VzW3JvYm90TmFtZV0gPSBzZWxEZXZpY2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQvLyBCdWlsZCBwYXJ0IGFycmF5XG5cdFx0XHRcdFx0XHQvLyBUT0RPIG9wdGltaXplIGhvdyB0aGUgZGF0YSBhcmUgdXNlZCA6XG5cdFx0XHRcdFx0XHQvLyBhY3R1YWxseSBjb252ZXJ0aW5nIG9iamVjdCB0byBhcnJheSB0aGVuXG5cdFx0XHRcdFx0XHQvLyBmcm9tIGFycmF5IHRvIG9iamVjdCBhZ2Fpbi4uLlxuXHRcdFx0XHRcdFx0bGV0IG5ld1BhcnQgPSBbXTtcblx0XHRcdFx0XHRcdG5ld1BhcnRbMF0gPSBwYXJ0LlBhcnRJZDtcblx0XHRcdFx0XHRcdG5ld1BhcnRbMV0gPSBwYXJ0LkNhdGVnb3J5O1xuXHRcdFx0XHRcdFx0bmV3UGFydFsyXSA9IHBhcnQuUGFydE5hbWU7XG5cdFx0XHRcdFx0XHRuZXdQYXJ0WzNdID0gXCJcIjsgLy8gTGFiZWwgaXMgdW51c2VkIGluIHByYWN0aWNlXG5cdFx0XHRcdFx0XHRuZXdQYXJ0WzRdID0gcGFydC5UaW1lO1xuXHRcdFx0XHRcdFx0bmV3UGFydFs1XSA9IHBhcnQuQ29kZTtcblx0XHRcdFx0XHRcdG5ld1BhcnRbNl0gPSBwYXJ0LkNvZGVSZWY7XG5cdFx0XHRcdFx0XHRuZXdQYXJ0WzddID0gcGFydC5Nc2c7XG5cdFx0XHRcdFx0XHRuZXdQYXJ0WzhdID0gcGFydC5Dcml0TGV2ZWw7XG5cdFx0XHRcdFx0XHRuZXdQYXJ0WzldID0gXCJcIiAvLyBEZXNjcmlwdGlvbiBpcyB1bnVzZWQgaW4gcHJhY3RpY2VcblxuXHRcdFx0XHRcdFx0c2VsRGV2aWNlLnBhcnRzLnB1c2gobmV3UGFydCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRlYnVnRXJyb3IoXCJVbmRlZmluZWQgcGF0aCBmb3JtYXRcIik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHQvLyBSZWFkIFJvYm90IG5hbWUgYW5kIHJvYm90IElkXG5cdFx0Ly8gUmVhZCBQYXJ0IGRhdGFcblx0XHRyZXR1cm4gcGFyc2VkRGF0YTtcblx0fVxuXG5cdF9wYXJzZVN0YXR1c0NoYW5nZWREYXRhIChkYXRhKSB7XG5cdFx0bGV0IHBhcnNlZERhdGEgPSB7fTtcblx0XHRkYXRhLmZvckVhY2goIChldmVudCkgPT4ge1xuXHRcdFx0bGV0IHJvYm90TmFtZSA9IGV2ZW50WzBdO1xuXHRcdFx0bGV0IHJvYm90SWQgPSBldmVudFsxXTtcblx0XHRcdGxldCB0aW1lID0gZXZlbnRbMl07XG5cdFx0XHRsZXQgc3RhdHVzRXZlbnRJZCA9IGV2ZW50WzNdO1xuXHRcdFx0bGV0IGNvZGUgPSBldmVudFs0XTtcblx0XHRcdGxldCByb2JvdE5hbWVMb3dlckNhc2UgPSByb2JvdE5hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdGlmICh0aGlzLl9zdGF0dXNlc0RpY3Rpb25hcnlbc3RhdHVzRXZlbnRJZF1bMF0gIT09IHN0YXR1c0V2ZW50SWQpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihcIk1hbGZvcm1lZCBzdGF0dXNlcyBkaWN0aW9uYXJ5XCIpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRsZXQgcGFydElkID0gdGhpcy5fc3RhdHVzZXNEaWN0aW9uYXJ5W3N0YXR1c0V2ZW50SWRdWzFdO1xuXHRcdFx0bGV0IGNvZGVSZWYgPSB0aGlzLl9zdGF0dXNlc0RpY3Rpb25hcnlbc3RhdHVzRXZlbnRJZF1bMl07XG5cdFx0XHRsZXQgcGFydE5hbWUgPSB0aGlzLl9zdGF0dXNlc0RpY3Rpb25hcnlbc3RhdHVzRXZlbnRJZF1bM107XG5cdFx0XHRsZXQgY2F0ZWdvcnkgPSB0aGlzLl9zdGF0dXNlc0RpY3Rpb25hcnlbc3RhdHVzRXZlbnRJZF1bNF07XG5cdFx0XHRsZXQgbXNnID0gdGhpcy5fc3RhdHVzZXNEaWN0aW9uYXJ5W3N0YXR1c0V2ZW50SWRdWzVdO1xuXHRcdFx0bGV0IGNyaXRMZXZlbCA9IHRoaXMuX3N0YXR1c2VzRGljdGlvbmFyeVtzdGF0dXNFdmVudElkXVs2XTtcblx0XHRcdGxldCBsYWJlbCA9IFwiXCI7IC8vIExhYmVsIGlzIHVudXNlZCBpbiBwcmFjdGljZVxuXHRcdFx0bGV0IGRlc2NyaXB0aW9uID0gXCJcIjsgLy8gRGVzY3JpcHRpb24gaXMgdW51c2VkIGluIHByYWN0aWNlXG5cdFx0XHRpZiAocGFyc2VkRGF0YS5kZXZpY2VzID09IG51bGwpIHtcblx0XHRcdFx0cGFyc2VkRGF0YS5kZXZpY2VzID0gW107XG5cdFx0XHR9XG5cdFx0XHRpZiAocGFyc2VkRGF0YS5kZXZpY2VzW3JvYm90TmFtZUxvd2VyQ2FzZV0gPT0gbnVsbCkge1xuXHRcdFx0XHRwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lTG93ZXJDYXNlXSA9IHt9O1xuXHRcdFx0fVxuXHRcdFx0cGFyc2VkRGF0YS5kZXZpY2VzW3JvYm90TmFtZUxvd2VyQ2FzZV0ucm9ib3RJZCA9IHJvYm90SWQ7XG5cdFx0XHRwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lTG93ZXJDYXNlXS5yb2JvdE5hbWUgPSByb2JvdE5hbWU7XG5cdFx0XHRpZiAocGFyc2VkRGF0YS5kZXZpY2VzW3JvYm90TmFtZUxvd2VyQ2FzZV0ucGFydHMgPT0gbnVsbCkge1xuXHRcdFx0XHRwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lTG93ZXJDYXNlXS5wYXJ0cyA9IFtdO1xuXHRcdFx0fVxuXHRcdFx0bGV0IG5ld1BhcnQgPSBbXTtcblx0XHRcdG5ld1BhcnRbMF0gPSBwYXJ0SWQ7XG5cdFx0XHRuZXdQYXJ0WzFdID0gY2F0ZWdvcnk7XG5cdFx0XHRuZXdQYXJ0WzJdID0gcGFydE5hbWU7XG5cdFx0XHRuZXdQYXJ0WzNdID0gbGFiZWw7XG5cdFx0XHRuZXdQYXJ0WzRdID0gdGltZTtcblx0XHRcdG5ld1BhcnRbNV0gPSBjb2RlO1xuXHRcdFx0bmV3UGFydFs2XSA9IGNvZGVSZWY7XG5cdFx0XHRuZXdQYXJ0WzddID0gbXNnO1xuXHRcdFx0bmV3UGFydFs4XSA9IGNyaXRMZXZlbDtcblx0XHRcdG5ld1BhcnRbOV0gPSBkZXNjcmlwdGlvbjtcblx0XHRcdHBhcnNlZERhdGEuZGV2aWNlc1tyb2JvdE5hbWVMb3dlckNhc2VdLnBhcnRzLnB1c2gobmV3UGFydCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHBhcnNlZERhdGE7XG5cdH1cblxuXHQvLyBDbG9zZSBhbGwgc3Vic2NyaXB0aW9ucyBpZiBhbnlcblx0X2Nsb3NlU3Vic2NyaXB0aW9ucyAoKSB7XG5cdFx0ZGVidWcoJ0luIGNsb3NlU3Vic2NyaXB0aW9uJyk7XG5cdFx0Zm9yICh2YXIgaSBpbiB0aGlzLnN1YnNjcmlwdGlvbnMpIHtcblx0XHRcdHRoaXMuc3Vic2NyaXB0aW9uc1tpXS5jbG9zZSgpO1xuXHRcdH1cblx0XHR0aGlzLnN1YnNjcmlwdGlvbnMgPSBbXTtcblx0fVxuXG5cdHN0b3AgKCkge1xuXHRcdGRlYnVnKCdJbiBzdG9wJyk7XG5cdFx0dGhpcy5zdGF0ZSA9ICdzdG9wcGVkJztcblx0XHRpZiAodGhpcy53YXRjaFRlbnRhdGl2ZSAhPSBudWxsKSB7XG5cdFx0XHRjbGVhclRpbWVvdXQodGhpcy53YXRjaFRlbnRhdGl2ZSk7XG5cdFx0fVxuXHRcdHRoaXMuX2Nsb3NlU3Vic2NyaXB0aW9ucygpO1xuXHRcdHRoaXMuZW1pdCgnc3RvcCcpO1xuXHRcdHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBXYXRjaGVyO1xuIl19
