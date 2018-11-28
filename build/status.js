(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./debug":2,"_process":6}],2:[function(require,module,exports){

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

},{"ms":5}],3:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{"./support/isBuffer":7,"_process":6,"inherits":4}],9:[function(require,module,exports){
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
		this.subscriptions = []; // DEPRECATED TO BE REMOVED ?

		/** model of robot : available parts and status **/
		this.robotModel = [];
		this._robotModelInit = false;

		/*** structure of data config ***
  	 criteria :
  	   time: all 3 time criteria should not be defined at the same time. (range would be given up)
  	     beg: {[null],time} (null means most recent) // stored a UTC in ms (num)
  	     end: {[null], time} (null means most oldest) // stored as UTC in ms (num)
  	     range: {[null], time} (range of time(positive) ) // in s (num)
  	   robot: {ArrayOf ID or ["all"]}
  	   place: {ArrayOf ID or ["all"]}
  	 operator: {[last], max, moy, sd} -( maybe moy should be default
  	 ...
  		 parts : {[null] or ArrayOf PartsId} to get errors
  	 status : {[null] or ArrayOf StatusName} to get status
  		 sampling: {[null] or int}
  */
		this.dataConfig = {
			criteria: {
				time: {
					beg: null,
					end: null,
					range: null // in s
				},
				robot: null
			},
			operator: 'last',
			parts: null,
			status: null
		};

		return this;
	};
	/**
  * Get robotModel :
  * {
  *  parts: {
  *		"partXX": {
  * 			 errorsDescr: { encountered errors indexed by errorIds>0 }
  *				> Config of errors :
  *					critLevel: FLOAT, // could be int...
  * 					msg: STRING,
  *					stopServiceId: STRING,
  *					runScript: Sequelize.STRING,
  *					missionMask: Sequelize.INTEGER,
  *					runLevel: Sequelize.INTEGER
  *			error:[FLOAT, ...], // could be int...
  *			time:[FLOAT, ...],
  *			robot:[FLOAT, ...],
  *			/// place:[FLOAT, ...], not implemented yet
  *		},
  *	 	... ("PartYY")
  *  },
  *  status: {
  *		"statusXX": {
  *				data:[FLOAT, ...], // could be int...
  *				time:[FLOAT, ...],
  *				robot:[FLOAT, ...],
  *				/// place:[FLOAT, ...], not implemented yet
  *				range: [FLOAT, FLOAT],
  *				label: string
  *			},
  *	 	... ("StatusYY")
  *  }
  * }
  */
	Status.prototype.getRobotModel = function () {
		return this.robotModel;
	};

	/**
  * @param {Object} dataConfig config for data request
  * if dataConfig is define : set and return this
  *	 @return {Status} this
  * else
  *	 @return {Object} current dataConfig
  */
	Status.prototype.DataConfig = function (newDataConfig) {
		if (newDataConfig) {
			this.dataConfig = newDataConfig;
			return this;
		} else return this.dataConfig;
	};
	/**
  * TO BE IMPLEMENTED : operator management in DN-Status
  * @param  {String}	 newOperator : {[last], max, moy, sd}
  * @return {Status} this - chainable
  * Set operator criteria.
  * Depends on newOperator
  *	@param {String} newOperator
  *	@return this
  * Get operator criteria.
  *	@return {String} operator
  */
	Status.prototype.DataOperator = function (newOperator) {
		if (newOperator) {
			this.dataConfig.operator = newOperator;
			return this;
		} else return this.dataConfig.operator;
	};
	/**
  * Depends on numSamples
  * @param {int} number of samples in dataModel
  * if defined : set number of samples
  *	@return {Status} this
  * else
  *	@return {int} number of samples
  **/
	Status.prototype.DataSampling = function (numSamples) {
		if (numSamples) {
			this.dataConfig.sampling = numSamples;
			return this;
		} else return this.dataConfig.sampling;
	};
	/**
  * Set or get data time criteria beg and end.
  * If param defined
  *	@param {Date} newTimeBeg // may be null
  *	@param {Date} newTimeEnd // may be null
  *	@return {Status} this
  * If no param defined:
  *	@return {Object} Time object: fields beg and end.
  */
	Status.prototype.DataTime = function (newTimeBeg, newTimeEnd, newRange) {
		if (newTimeBeg || newTimeEnd || newRange) {
			this.dataConfig.criteria.time.beg = newTimeBeg.getTime();
			this.dataConfig.criteria.time.end = newTimeEnd.getTime();
			this.dataConfig.criteria.time.range = newRange;
			return this;
		} else return {
			beg: new Date(this.dataConfig.criteria.time.beg),
			end: new Date(this.dataConfig.criteria.time.end),
			range: new Date(this.dataConfig.criteria.time.range)
		};
	};
	/**
  * Depends on robotIds
  * Set robot criteria.
  *	@param {Array[Int]} robotIds list of robot Ids
  * Get robot criteria.
  *	@return {Array[Int]} list of robot Ids
  */
	Status.prototype.DataRobotIds = function (robotIds) {
		if (robotIds) {
			this.dataConfig.criteria.robot = robotIds;
			return this;
		} else return this.dataConfig.criteria.robot;
	};
	/**
  * Depends on placeIds // not relevant?, not implemented yet
  * Set place criteria.
  *	@param {Array[Int]} placeIds list of place Ids
  * Get place criteria.
  *	@return {Array[Int]} list of place Ids
  */
	Status.prototype.DataPlaceIds = function (placeIds) {
		if (placeIds) {
			this.dataConfig.criteria.placeId = placeIds;
			return this;
		} else return this.dataConfig.criteria.place;
	};
	/**
  * Get data by sensor name.
  *	@param {Array[String]} sensorName list of sensors
  */
	Status.prototype.getDataByName = function (sensorNames) {
		var data = [];
		for (var n in sensorNames) {
			data.push(this.dataModel[sensorNames[n]]);
		}
		return data;
	};

	/**
  * Subscribe to error/status updates
  */
	Status.prototype.watch = function (robotNames, callback) {
		var _this = this;

		// do not create watcher without a callback
		if (callback == null || typeof callback !== 'function') {
			return null;
		}

		var watcher = new Watcher(this.selector, robotNames);

		// add watcher in watcher list
		this.watchers.push(watcher);

		watcher.on('data', function (data) {
			debug(data);
			callback(_this._getRobotModelFromRecv2(data.parts, data.robotId, data.robotName), data.peerId);
		});
		watcher.on('stop', this._removeWatcher);

		return watcher;

		// // Increase number of listeners (SHOULD BE AVOIDED)
		// this.selector.setMaxListeners(0);
		// this.selector._connection.setMaxListeners(0);

		// return Promise.try(_ => {
		// 	this.selector.request({
		// 		service: 'status',
		// 		func: 'GetManagedObjects',
		// 		obj: {
		// 			interface: 'org.freedesktop.DBus.ObjectManager',
		// 		}
		// 	}, this.onGetManagedObjectsWatch.bind(this, robotNames, callback));
		// }).catch(err => {
		// 	Logger.error(err);
		// })
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
		// this.robotModel = []; DEVEL - NEEDED ?
	};

	/**
  * Callback on GetManagedObjects in Watch
  */
	// get all object paths, interfaces and properties children of Status
	Status.prototype.onGetManagedObjectsWatch = function (robotNames, callback, peerId, err, data) {
		var robotName = '';
		var robotId = 1;
		var robotIds = [];
		for (var objectPath in data) {
			if (data[objectPath]['fr.partnering.Status.Robot'] != null) {
				robotName = data[objectPath]['fr.partnering.Status.Robot'].RobotName;
				robotId = data[objectPath]['fr.partnering.Status.Robot'].RobotId;
				robotIds[robotName] = robotId;
				this.getAllStatuses(robotName, this.onGetAllStatuses.bind(this, peerId, callback));
			}
			if (data[objectPath]['fr.partnering.Status.Part'] != null) {
				var subs = this.selector.subscribe({ // subscribes to status changes for all parts
					service: 'status',
					func: 'StatusChanged',
					obj: {
						interface: 'fr.partnering.Status.Part',
						path: objectPath
					},
					data: robotNames
				}, this.onStatusChanged.bind(this, robotId, robotName, callback));
				this.subscriptions.push(subs);
			}
		}
	};

	/**
  * Callback on GetAllStatuses
  */
	Status.prototype.onGetAllStatuses = function (peerId, callback, model) {
		callback(model, peerId);
	};

	/**
  * Callback on StatusChanged
  */
	Status.prototype.onStatusChanged = function (robotId, robotName, callback, peerId, err, data) {
		var sendData = [];
		if (err != null) {
			Logger.error("StatusSubscribe:" + err);
		} else {
			sendData[0] = data;
			this._getRobotModelFromRecv2(sendData, robotId, robotName);
			if (typeof callback === 'function') {
				callback(this.robotModel, peerId);
			}
		}
	};

	/// DEPRECATED
	// /**
	//  * Close all subscriptions
	//  */
	// Status.prototype.closeSubscriptions = function(){
	// 	for(var i in this.subscriptions) {
	// 		this.subscriptions[i].close();
	// 	}
	// 	this.subscriptions =[];
	// 	this.robotModel = [];
	// };

	/**
  * Get data given dataConfig.
  * @param {func} callback : called after update
  * TODO USE PROMISE
  */
	Status.prototype.getData = function (callback, dataConfig) {
		var _this3 = this;

		return Promise.try(function (_) {
			if (dataConfig != null) _this3.DataConfig(dataConfig);
			// console.log("Request: "+JSON.stringify(dataConfig));
			_this3.selector.request({
				service: "status",
				func: "DataRequest",
				data: {
					type: "splReq",
					dataConfig: _this3.dataConfig
				}
			}, _this3.onDataRequest.bind(_this3, callback));
		}).catch(function (err) {
			Logger.error(err);
		});
	};

	/**
  * Callback on DataRequest
  */
	Status.prototype.onDataRequest = function (callback, peerId, err, data) {
		var dataModel = {};
		if (err != null) {
			Logger.error("[" + this.dataConfig.sensors + "] Recv err: " + JSON.stringify(err));
			return;
		}
		if (data.header.error != null) {
			// TODO : check/use err status and adapt behavior accordingly
			Logger.error("UpdateData:\n" + JSON.stringify(data.header.reqConfig));
			Logger.error("Data request failed (" + data.header.error.st + "): " + data.header.error.msg);
			return;
		}
		//Logger.log(JSON.stringify(this.dataModel));
		dataModel = this._getDataModelFromRecv(data);

		Logger.log(this.getDataModel());
		callback(dataModel); // callback func
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
		var _this4 = this;

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
				time: _this4._coder.from(time),
				code: _this4._coder.from(code),
				codeRef: _this4._coder.from(codeRef)
			};
			/** if received list of events **/
			if (Array.isArray(evts_tmp.code) || Array.isArray(evts_tmp.time) || Array.isArray(evts_tmp.codeRef)) {
				if (evts_tmp.code.length === evts_tmp.codeRef.length && evts_tmp.code.length === evts_tmp.time.length) {
					/** build list of events **/
					rParts[partId].evts = [];
					for (var i = 0; i < evts_tmp.code.length; i++) {
						rParts[partId].evts.push({
							time: evts_tmp.time[i],
							code: evts_tmp.code[i],
							codeRef: evts_tmp.codeRef[i]
						});
					}
				} else Logger.error("Status:Inconsistant lengths of buffers (time/code/codeRef)");
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
		var _this5 = this;

		return Promise.try(function (_) {
			var objectPath = "/fr/partnering/Status/Robots/" + _this5.splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
			_this5.request({
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
			}, _this5.onSetPart.bind(_this5, callback));
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
		var _this6 = this;

		return Promise.try(function (_) {
			_this6.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager'
				}
			}, _this6.onGetManagedObjectsGetStatus.bind(_this6, robotName, partName, callback));
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
	function Watcher(selector, robotNames) {
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
		var options = robotNames;

		_this2.options = options;
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
			}).then(function (_) {
				// subscribe to Parts (TO BE IMPROVED!)
				/**
     * Actually current method is subscribing to each and every part
     * a better way to do it would be to subscribe to robots
     * on condition that robots provides the adequate signals
     */
				debug('Subscribing');
				return new Promise(function (resolve, reject) {
					/// TODO subscription
					resolve(); /// TODO
					_this3.subscription = _this3.selector.subscribe({
						service: "ieq",
						func: options.criteria.time.sampling,
						data: { data: options }, // TODO : no options for signals...
						obj: {
							path: '/fr/partnering/Ieq',
							interface: "fr.partnering.Ieq"
						}
					}, function (dnd, err, data) {
						if (err != null) {
							reject(err);
							return;
						}
						debug('Signal:emitData');
						debug(data);
						data = _this3._parseGetManagedObjectsData(data);
						debug(data);
						_this3.emit('data', data);

						_this3.reconnectionPeriod = 0; // reset period on subscription requests
						resolve();
					});
				});
			})

			// 	// Request history data before subscribing
			// 	this.selector.request({
			// 		service: "ieq",
			// 		func: "DataRequest",
			// 		data: {
			// 			data: JSON.stringify(options)
			// 		},
			// 		obj:{
			// 			path: '/fr/partnering/Ieq',
			// 			interface: "fr.partnering.Ieq"
			// 		},
			// 	}, (dnId, err, dataString) => {
			// 		if (err != null)  {
			// 			reject(err);
			// 			return;
			// 		}
			// 		if (this.state === 'stopped') {
			// 			reject(new StopCondition());
			// 		}
			// 		debug('Request:emitData');
			// 		let data = JSON.parse(dataString);
			// 		this.emit('data', data);
			// 		resolve();
			// 	});
			// })
			// 	.then( _ => {
			// 		// subscribe to signal
			// 		debug('Subscribing');
			// 		return new Promise ( (resolve, reject) =>  {
			// 			this.subscription = this.selector.subscribe({
			// 				service: "ieq",
			// 				func: options.criteria.time.sampling,
			// 				data: {data: options}, // TODO : no options for signals...
			// 				obj:{
			// 					path: '/fr/partnering/Ieq',
			// 					interface: "fr.partnering.Ieq"
			// 				}
			// 			}, (dnd, err, data) => {
			// 				if (err != null) {
			// 					reject(err);
			// 					return;
			// 				}
			// 				debug('Signal:emitData');
			// 				data = JSON.parse(data);
			// 				this.emit('data', data);

			// 				this.reconnectionPeriod=0; // reset period on subscription requests
			// 				resolve();
			// 			})
			// 		})
			// 	})
			.catch(function (err) {
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
				_this3.watchTentative = setTimeout(function (_) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvZGVidWcvc3JjL2RlYnVnLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9tcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJzcmMvc3RhdHVzLmpzIiwic3JjL3dhdGNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDekxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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O0FBRWhCLGtCQUFVLEtBQVYsQ0FBZ0IsSUFBaEIsQ0FBcUIsT0FBckI7QUFDQTtBQUNEO0FBRUQsS0FuQ00sTUFtQ0E7QUFDTixnQkFBVyx1QkFBWDtBQUNBO0FBQ0Q7O0FBR0Q7QUFDQTtBQUNBLFVBQU8sVUFBUDtBQUNBOztBQUVEOzs7O3dDQUN1QjtBQUN0QixTQUFNLHNCQUFOO0FBQ0EsUUFBSSxJQUFJLENBQVIsSUFBYSxLQUFLLGFBQWxCLEVBQWlDO0FBQ2hDLFNBQUssYUFBTCxDQUFtQixDQUFuQixFQUFzQixLQUF0QjtBQUNBO0FBQ0QsUUFBSyxhQUFMLEdBQXFCLEVBQXJCO0FBQ0E7Ozt5QkFFTztBQUNQLFNBQU0sU0FBTjtBQUNBLFFBQUssS0FBTCxHQUFhLFNBQWI7QUFDQSxPQUFJLEtBQUssY0FBTCxJQUF1QixJQUEzQixFQUFpQztBQUNoQyxpQkFBYSxLQUFLLGNBQWxCO0FBQ0E7QUFDRCxRQUFLLG1CQUFMO0FBQ0EsUUFBSyxJQUFMLENBQVUsTUFBVjtBQUNBLFFBQUssa0JBQUw7QUFDQTs7OztFQXhSb0IsWTs7QUEyUnRCLE9BQU8sT0FBUCxHQUFpQixPQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qKlxuICogVGhpcyBpcyB0aGUgd2ViIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZVxuICAgICAgICAgICAgICAgJiYgJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZS5zdG9yYWdlXG4gICAgICAgICAgICAgICAgICA/IGNocm9tZS5zdG9yYWdlLmxvY2FsXG4gICAgICAgICAgICAgICAgICA6IGxvY2Fsc3RvcmFnZSgpO1xuXG4vKipcbiAqIENvbG9ycy5cbiAqL1xuXG5leHBvcnRzLmNvbG9ycyA9IFtcbiAgJ2xpZ2h0c2VhZ3JlZW4nLFxuICAnZm9yZXN0Z3JlZW4nLFxuICAnZ29sZGVucm9kJyxcbiAgJ2RvZGdlcmJsdWUnLFxuICAnZGFya29yY2hpZCcsXG4gICdjcmltc29uJ1xuXTtcblxuLyoqXG4gKiBDdXJyZW50bHkgb25seSBXZWJLaXQtYmFzZWQgV2ViIEluc3BlY3RvcnMsIEZpcmVmb3ggPj0gdjMxLFxuICogYW5kIHRoZSBGaXJlYnVnIGV4dGVuc2lvbiAoYW55IEZpcmVmb3ggdmVyc2lvbikgYXJlIGtub3duXG4gKiB0byBzdXBwb3J0IFwiJWNcIiBDU1MgY3VzdG9taXphdGlvbnMuXG4gKlxuICogVE9ETzogYWRkIGEgYGxvY2FsU3RvcmFnZWAgdmFyaWFibGUgdG8gZXhwbGljaXRseSBlbmFibGUvZGlzYWJsZSBjb2xvcnNcbiAqL1xuXG5mdW5jdGlvbiB1c2VDb2xvcnMoKSB7XG4gIC8vIE5COiBJbiBhbiBFbGVjdHJvbiBwcmVsb2FkIHNjcmlwdCwgZG9jdW1lbnQgd2lsbCBiZSBkZWZpbmVkIGJ1dCBub3QgZnVsbHlcbiAgLy8gaW5pdGlhbGl6ZWQuIFNpbmNlIHdlIGtub3cgd2UncmUgaW4gQ2hyb21lLCB3ZSdsbCBqdXN0IGRldGVjdCB0aGlzIGNhc2VcbiAgLy8gZXhwbGljaXRseVxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnByb2Nlc3MgJiYgd2luZG93LnByb2Nlc3MudHlwZSA9PT0gJ3JlbmRlcmVyJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gaXMgd2Via2l0PyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNjQ1OTYwNi8zNzY3NzNcbiAgLy8gZG9jdW1lbnQgaXMgdW5kZWZpbmVkIGluIHJlYWN0LW5hdGl2ZTogaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0LW5hdGl2ZS9wdWxsLzE2MzJcbiAgcmV0dXJuICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLldlYmtpdEFwcGVhcmFuY2UpIHx8XG4gICAgLy8gaXMgZmlyZWJ1Zz8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzk4MTIwLzM3Njc3M1xuICAgICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuY29uc29sZSAmJiAod2luZG93LmNvbnNvbGUuZmlyZWJ1ZyB8fCAod2luZG93LmNvbnNvbGUuZXhjZXB0aW9uICYmIHdpbmRvdy5jb25zb2xlLnRhYmxlKSkpIHx8XG4gICAgLy8gaXMgZmlyZWZveCA+PSB2MzE/XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Ub29scy9XZWJfQ29uc29sZSNTdHlsaW5nX21lc3NhZ2VzXG4gICAgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9maXJlZm94XFwvKFxcZCspLykgJiYgcGFyc2VJbnQoUmVnRXhwLiQxLCAxMCkgPj0gMzEpIHx8XG4gICAgLy8gZG91YmxlIGNoZWNrIHdlYmtpdCBpbiB1c2VyQWdlbnQganVzdCBpbiBjYXNlIHdlIGFyZSBpbiBhIHdvcmtlclxuICAgICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvYXBwbGV3ZWJraXRcXC8oXFxkKykvKSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuICdbVW5leHBlY3RlZEpTT05QYXJzZUVycm9yXTogJyArIGVyci5tZXNzYWdlO1xuICB9XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncyhhcmdzKSB7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybjtcblxuICB2YXIgYyA9ICdjb2xvcjogJyArIHRoaXMuY29sb3I7XG4gIGFyZ3Muc3BsaWNlKDEsIDAsIGMsICdjb2xvcjogaW5oZXJpdCcpXG5cbiAgLy8gdGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcbiAgLy8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuICAvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGxhc3RDID0gMDtcbiAgYXJnc1swXS5yZXBsYWNlKC8lW2EtekEtWiVdL2csIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgaWYgKCclJScgPT09IG1hdGNoKSByZXR1cm47XG4gICAgaW5kZXgrKztcbiAgICBpZiAoJyVjJyA9PT0gbWF0Y2gpIHtcbiAgICAgIC8vIHdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuICAgICAgLy8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcbiAgICAgIGxhc3RDID0gaW5kZXg7XG4gICAgfVxuICB9KTtcblxuICBhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG59XG5cbi8qKlxuICogSW52b2tlcyBgY29uc29sZS5sb2coKWAgd2hlbiBhdmFpbGFibGUuXG4gKiBOby1vcCB3aGVuIGBjb25zb2xlLmxvZ2AgaXMgbm90IGEgXCJmdW5jdGlvblwiLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gbG9nKCkge1xuICAvLyB0aGlzIGhhY2tlcnkgaXMgcmVxdWlyZWQgZm9yIElFOC85LCB3aGVyZVxuICAvLyB0aGUgYGNvbnNvbGUubG9nYCBmdW5jdGlvbiBkb2Vzbid0IGhhdmUgJ2FwcGx5J1xuICByZXR1cm4gJ29iamVjdCcgPT09IHR5cGVvZiBjb25zb2xlXG4gICAgJiYgY29uc29sZS5sb2dcbiAgICAmJiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuY2FsbChjb25zb2xlLmxvZywgY29uc29sZSwgYXJndW1lbnRzKTtcbn1cblxuLyoqXG4gKiBTYXZlIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG4gIHRyeSB7XG4gICAgaWYgKG51bGwgPT0gbmFtZXNwYWNlcykge1xuICAgICAgZXhwb3J0cy5zdG9yYWdlLnJlbW92ZUl0ZW0oJ2RlYnVnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMuc3RvcmFnZS5kZWJ1ZyA9IG5hbWVzcGFjZXM7XG4gICAgfVxuICB9IGNhdGNoKGUpIHt9XG59XG5cbi8qKlxuICogTG9hZCBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSByZXR1cm5zIHRoZSBwcmV2aW91c2x5IHBlcnNpc3RlZCBkZWJ1ZyBtb2Rlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbG9hZCgpIHtcbiAgdmFyIHI7XG4gIHRyeSB7XG4gICAgciA9IGV4cG9ydHMuc3RvcmFnZS5kZWJ1ZztcbiAgfSBjYXRjaChlKSB7fVxuXG4gIC8vIElmIGRlYnVnIGlzbid0IHNldCBpbiBMUywgYW5kIHdlJ3JlIGluIEVsZWN0cm9uLCB0cnkgdG8gbG9hZCAkREVCVUdcbiAgaWYgKCFyICYmIHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiAnZW52JyBpbiBwcm9jZXNzKSB7XG4gICAgciA9IHByb2Nlc3MuZW52LkRFQlVHO1xuICB9XG5cbiAgcmV0dXJuIHI7XG59XG5cbi8qKlxuICogRW5hYmxlIG5hbWVzcGFjZXMgbGlzdGVkIGluIGBsb2NhbFN0b3JhZ2UuZGVidWdgIGluaXRpYWxseS5cbiAqL1xuXG5leHBvcnRzLmVuYWJsZShsb2FkKCkpO1xuXG4vKipcbiAqIExvY2Fsc3RvcmFnZSBhdHRlbXB0cyB0byByZXR1cm4gdGhlIGxvY2Fsc3RvcmFnZS5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNhZmFyaSB0aHJvd3NcbiAqIHdoZW4gYSB1c2VyIGRpc2FibGVzIGNvb2tpZXMvbG9jYWxzdG9yYWdlXG4gKiBhbmQgeW91IGF0dGVtcHQgdG8gYWNjZXNzIGl0LlxuICpcbiAqIEByZXR1cm4ge0xvY2FsU3RvcmFnZX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvY2Fsc3RvcmFnZSgpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZTtcbiAgfSBjYXRjaCAoZSkge31cbn1cbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVEZWJ1Zy5kZWJ1ZyA9IGNyZWF0ZURlYnVnWydkZWZhdWx0J10gPSBjcmVhdGVEZWJ1ZztcbmV4cG9ydHMuY29lcmNlID0gY29lcmNlO1xuZXhwb3J0cy5kaXNhYmxlID0gZGlzYWJsZTtcbmV4cG9ydHMuZW5hYmxlID0gZW5hYmxlO1xuZXhwb3J0cy5lbmFibGVkID0gZW5hYmxlZDtcbmV4cG9ydHMuaHVtYW5pemUgPSByZXF1aXJlKCdtcycpO1xuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuICovXG5cbmV4cG9ydHMubmFtZXMgPSBbXTtcbmV4cG9ydHMuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG4gKlxuICogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXIgb3IgdXBwZXItY2FzZSBsZXR0ZXIsIGkuZS4gXCJuXCIgYW5kIFwiTlwiLlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycyA9IHt9O1xuXG4vKipcbiAqIFByZXZpb3VzIGxvZyB0aW1lc3RhbXAuXG4gKi9cblxudmFyIHByZXZUaW1lO1xuXG4vKipcbiAqIFNlbGVjdCBhIGNvbG9yLlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2VsZWN0Q29sb3IobmFtZXNwYWNlKSB7XG4gIHZhciBoYXNoID0gMCwgaTtcblxuICBmb3IgKGkgaW4gbmFtZXNwYWNlKSB7XG4gICAgaGFzaCAgPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIG5hbWVzcGFjZS5jaGFyQ29kZUF0KGkpO1xuICAgIGhhc2ggfD0gMDsgLy8gQ29udmVydCB0byAzMmJpdCBpbnRlZ2VyXG4gIH1cblxuICByZXR1cm4gZXhwb3J0cy5jb2xvcnNbTWF0aC5hYnMoaGFzaCkgJSBleHBvcnRzLmNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBjcmVhdGVEZWJ1ZyhuYW1lc3BhY2UpIHtcblxuICBmdW5jdGlvbiBkZWJ1ZygpIHtcbiAgICAvLyBkaXNhYmxlZD9cbiAgICBpZiAoIWRlYnVnLmVuYWJsZWQpIHJldHVybjtcblxuICAgIHZhciBzZWxmID0gZGVidWc7XG5cbiAgICAvLyBzZXQgYGRpZmZgIHRpbWVzdGFtcFxuICAgIHZhciBjdXJyID0gK25ldyBEYXRlKCk7XG4gICAgdmFyIG1zID0gY3VyciAtIChwcmV2VGltZSB8fCBjdXJyKTtcbiAgICBzZWxmLmRpZmYgPSBtcztcbiAgICBzZWxmLnByZXYgPSBwcmV2VGltZTtcbiAgICBzZWxmLmN1cnIgPSBjdXJyO1xuICAgIHByZXZUaW1lID0gY3VycjtcblxuICAgIC8vIHR1cm4gdGhlIGBhcmd1bWVudHNgIGludG8gYSBwcm9wZXIgQXJyYXlcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgYXJnc1swXSA9IGV4cG9ydHMuY29lcmNlKGFyZ3NbMF0pO1xuXG4gICAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgYXJnc1swXSkge1xuICAgICAgLy8gYW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJU9cbiAgICAgIGFyZ3MudW5zaGlmdCgnJU8nKTtcbiAgICB9XG5cbiAgICAvLyBhcHBseSBhbnkgYGZvcm1hdHRlcnNgIHRyYW5zZm9ybWF0aW9uc1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgYXJnc1swXSA9IGFyZ3NbMF0ucmVwbGFjZSgvJShbYS16QS1aJV0pL2csIGZ1bmN0aW9uKG1hdGNoLCBmb3JtYXQpIHtcbiAgICAgIC8vIGlmIHdlIGVuY291bnRlciBhbiBlc2NhcGVkICUgdGhlbiBkb24ndCBpbmNyZWFzZSB0aGUgYXJyYXkgaW5kZXhcbiAgICAgIGlmIChtYXRjaCA9PT0gJyUlJykgcmV0dXJuIG1hdGNoO1xuICAgICAgaW5kZXgrKztcbiAgICAgIHZhciBmb3JtYXR0ZXIgPSBleHBvcnRzLmZvcm1hdHRlcnNbZm9ybWF0XTtcbiAgICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZm9ybWF0dGVyKSB7XG4gICAgICAgIHZhciB2YWwgPSBhcmdzW2luZGV4XTtcbiAgICAgICAgbWF0Y2ggPSBmb3JtYXR0ZXIuY2FsbChzZWxmLCB2YWwpO1xuXG4gICAgICAgIC8vIG5vdyB3ZSBuZWVkIHRvIHJlbW92ZSBgYXJnc1tpbmRleF1gIHNpbmNlIGl0J3MgaW5saW5lZCBpbiB0aGUgYGZvcm1hdGBcbiAgICAgICAgYXJncy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBpbmRleC0tO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuXG4gICAgLy8gYXBwbHkgZW52LXNwZWNpZmljIGZvcm1hdHRpbmcgKGNvbG9ycywgZXRjLilcbiAgICBleHBvcnRzLmZvcm1hdEFyZ3MuY2FsbChzZWxmLCBhcmdzKTtcblxuICAgIHZhciBsb2dGbiA9IGRlYnVnLmxvZyB8fCBleHBvcnRzLmxvZyB8fCBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpO1xuICAgIGxvZ0ZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICB9XG5cbiAgZGVidWcubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICBkZWJ1Zy5lbmFibGVkID0gZXhwb3J0cy5lbmFibGVkKG5hbWVzcGFjZSk7XG4gIGRlYnVnLnVzZUNvbG9ycyA9IGV4cG9ydHMudXNlQ29sb3JzKCk7XG4gIGRlYnVnLmNvbG9yID0gc2VsZWN0Q29sb3IobmFtZXNwYWNlKTtcblxuICAvLyBlbnYtc3BlY2lmaWMgaW5pdGlhbGl6YXRpb24gbG9naWMgZm9yIGRlYnVnIGluc3RhbmNlc1xuICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGV4cG9ydHMuaW5pdCkge1xuICAgIGV4cG9ydHMuaW5pdChkZWJ1Zyk7XG4gIH1cblxuICByZXR1cm4gZGVidWc7XG59XG5cbi8qKlxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuICogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuICBleHBvcnRzLnNhdmUobmFtZXNwYWNlcyk7XG5cbiAgZXhwb3J0cy5uYW1lcyA9IFtdO1xuICBleHBvcnRzLnNraXBzID0gW107XG5cbiAgdmFyIHNwbGl0ID0gKHR5cGVvZiBuYW1lc3BhY2VzID09PSAnc3RyaW5nJyA/IG5hbWVzcGFjZXMgOiAnJykuc3BsaXQoL1tcXHMsXSsvKTtcbiAgdmFyIGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKCFzcGxpdFtpXSkgY29udGludWU7IC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG4gICAgbmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG4gICAgaWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xuICAgICAgZXhwb3J0cy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcy5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGlzYWJsZSgpIHtcbiAgZXhwb3J0cy5lbmFibGUoJycpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5uYW1lc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG4gIHJldHVybiB2YWw7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG4gICwgcHJlZml4ID0gJ34nO1xuXG4vKipcbiAqIENvbnN0cnVjdG9yIHRvIGNyZWF0ZSBhIHN0b3JhZ2UgZm9yIG91ciBgRUVgIG9iamVjdHMuXG4gKiBBbiBgRXZlbnRzYCBpbnN0YW5jZSBpcyBhIHBsYWluIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIGFyZSBldmVudCBuYW1lcy5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFdmVudHMoKSB7fVxuXG4vL1xuLy8gV2UgdHJ5IHRvIG5vdCBpbmhlcml0IGZyb20gYE9iamVjdC5wcm90b3R5cGVgLiBJbiBzb21lIGVuZ2luZXMgY3JlYXRpbmcgYW5cbi8vIGluc3RhbmNlIGluIHRoaXMgd2F5IGlzIGZhc3RlciB0aGFuIGNhbGxpbmcgYE9iamVjdC5jcmVhdGUobnVsbClgIGRpcmVjdGx5LlxuLy8gSWYgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIG5vdCBzdXBwb3J0ZWQgd2UgcHJlZml4IHRoZSBldmVudCBuYW1lcyB3aXRoIGFcbi8vIGNoYXJhY3RlciB0byBtYWtlIHN1cmUgdGhhdCB0aGUgYnVpbHQtaW4gb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdFxuLy8gb3ZlcnJpZGRlbiBvciB1c2VkIGFzIGFuIGF0dGFjayB2ZWN0b3IuXG4vL1xuaWYgKE9iamVjdC5jcmVhdGUpIHtcbiAgRXZlbnRzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgLy9cbiAgLy8gVGhpcyBoYWNrIGlzIG5lZWRlZCBiZWNhdXNlIHRoZSBgX19wcm90b19fYCBwcm9wZXJ0eSBpcyBzdGlsbCBpbmhlcml0ZWQgaW5cbiAgLy8gc29tZSBvbGQgYnJvd3NlcnMgbGlrZSBBbmRyb2lkIDQsIGlQaG9uZSA1LjEsIE9wZXJhIDExIGFuZCBTYWZhcmkgNS5cbiAgLy9cbiAgaWYgKCFuZXcgRXZlbnRzKCkuX19wcm90b19fKSBwcmVmaXggPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBldmVudCBsaXN0ZW5lci5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29uY2U9ZmFsc2VdIFNwZWNpZnkgaWYgdGhlIGxpc3RlbmVyIGlzIGEgb25lLXRpbWUgbGlzdGVuZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFRShmbiwgY29udGV4dCwgb25jZSkge1xuICB0aGlzLmZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMub25jZSA9IG9uY2UgfHwgZmFsc2U7XG59XG5cbi8qKlxuICogTWluaW1hbCBgRXZlbnRFbWl0dGVyYCBpbnRlcmZhY2UgdGhhdCBpcyBtb2xkZWQgYWdhaW5zdCB0aGUgTm9kZS5qc1xuICogYEV2ZW50RW1pdHRlcmAgaW50ZXJmYWNlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXMgcmVnaXN0ZXJlZFxuICogbGlzdGVuZXJzLlxuICpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uIGV2ZW50TmFtZXMoKSB7XG4gIHZhciBuYW1lcyA9IFtdXG4gICAgLCBldmVudHNcbiAgICAsIG5hbWU7XG5cbiAgaWYgKHRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSByZXR1cm4gbmFtZXM7XG5cbiAgZm9yIChuYW1lIGluIChldmVudHMgPSB0aGlzLl9ldmVudHMpKSB7XG4gICAgaWYgKGhhcy5jYWxsKGV2ZW50cywgbmFtZSkpIG5hbWVzLnB1c2gocHJlZml4ID8gbmFtZS5zbGljZSgxKSA6IG5hbWUpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgICByZXR1cm4gbmFtZXMuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZXZlbnRzKSk7XG4gIH1cblxuICByZXR1cm4gbmFtZXM7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZXhpc3RzIE9ubHkgY2hlY2sgaWYgdGhlcmUgYXJlIGxpc3RlbmVycy5cbiAqIEByZXR1cm5zIHtBcnJheXxCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnQsIGV4aXN0cykge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudFxuICAgICwgYXZhaWxhYmxlID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGV4aXN0cykgcmV0dXJuICEhYXZhaWxhYmxlO1xuICBpZiAoIWF2YWlsYWJsZSkgcmV0dXJuIFtdO1xuICBpZiAoYXZhaWxhYmxlLmZuKSByZXR1cm4gW2F2YWlsYWJsZS5mbl07XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdmFpbGFibGUubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gYXZhaWxhYmxlW2ldLmZuO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBDYWxscyBlYWNoIG9mIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHJldHVybnMge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgZXZlbnQgaGFkIGxpc3RlbmVycywgZWxzZSBgZmFsc2VgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldmVudCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChsaXN0ZW5lcnMub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgbGlzdGVuZXJzLmZuLmFwcGx5KGxpc3RlbmVycy5jb250ZXh0LCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyc1tpXS5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgc3dpdGNoIChsZW4pIHtcbiAgICAgICAgY2FzZSAxOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCk7IGJyZWFrO1xuICAgICAgICBjYXNlIDI6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSk7IGJyZWFrO1xuICAgICAgICBjYXNlIDM6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIpOyBicmVhaztcbiAgICAgICAgY2FzZSA0OiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyLCBhMyk7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIEFkZCBhIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyLCB0aGlzLl9ldmVudHNDb3VudCsrO1xuICBlbHNlIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW3RoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCBhIG9uZS10aW1lIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcywgdHJ1ZSlcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lciwgdGhpcy5fZXZlbnRzQ291bnQrKztcbiAgZWxzZSBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFt0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhlIGxpc3RlbmVycyBvZiBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBPbmx5IHJlbW92ZSB0aGUgbGlzdGVuZXJzIHRoYXQgbWF0Y2ggdGhpcyBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgT25seSByZW1vdmUgdGhlIGxpc3RlbmVycyB0aGF0IGhhdmUgdGhpcyBjb250ZXh0LlxuICogQHBhcmFtIHtCb29sZWFufSBvbmNlIE9ubHkgcmVtb3ZlIG9uZS10aW1lIGxpc3RlbmVycy5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIHRoaXM7XG4gIGlmICghZm4pIHtcbiAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAoXG4gICAgICAgICBsaXN0ZW5lcnMuZm4gPT09IGZuXG4gICAgICAmJiAoIW9uY2UgfHwgbGlzdGVuZXJzLm9uY2UpXG4gICAgICAmJiAoIWNvbnRleHQgfHwgbGlzdGVuZXJzLmNvbnRleHQgPT09IGNvbnRleHQpXG4gICAgKSB7XG4gICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvciAodmFyIGkgPSAwLCBldmVudHMgPSBbXSwgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoXG4gICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbiAhPT0gZm5cbiAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVyc1tpXS5vbmNlKVxuICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnNbaV0uY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICkge1xuICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnNbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vXG4gICAgLy8gUmVzZXQgdGhlIGFycmF5LCBvciByZW1vdmUgaXQgY29tcGxldGVseSBpZiB3ZSBoYXZlIG5vIG1vcmUgbGlzdGVuZXJzLlxuICAgIC8vXG4gICAgaWYgKGV2ZW50cy5sZW5ndGgpIHRoaXMuX2V2ZW50c1tldnRdID0gZXZlbnRzLmxlbmd0aCA9PT0gMSA/IGV2ZW50c1swXSA6IGV2ZW50cztcbiAgICBlbHNlIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMsIG9yIHRob3NlIG9mIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBbZXZlbnRdIFRoZSBldmVudCBuYW1lLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgdmFyIGV2dDtcblxuICBpZiAoZXZlbnQpIHtcbiAgICBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuICAgIGlmICh0aGlzLl9ldmVudHNbZXZ0XSkge1xuICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gQWxpYXMgbWV0aG9kcyBuYW1lcyBiZWNhdXNlIHBlb3BsZSByb2xsIGxpa2UgdGhhdC5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuLy9cbi8vIFRoaXMgZnVuY3Rpb24gZG9lc24ndCBhcHBseSBhbnltb3JlLlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBFeHBvc2UgdGhlIHByZWZpeC5cbi8vXG5FdmVudEVtaXR0ZXIucHJlZml4ZWQgPSBwcmVmaXg7XG5cbi8vXG4vLyBBbGxvdyBgRXZlbnRFbWl0dGVyYCB0byBiZSBpbXBvcnRlZCBhcyBtb2R1bGUgbmFtZXNwYWNlLlxuLy9cbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5pZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG59XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8qKlxuICogSGVscGVycy5cbiAqL1xuXG52YXIgcyA9IDEwMDA7XG52YXIgbSA9IHMgKiA2MDtcbnZhciBoID0gbSAqIDYwO1xudmFyIGQgPSBoICogMjQ7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzTmFOKHZhbCkgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMubG9uZyA/IGZtdExvbmcodmFsKSA6IGZtdFNob3J0KHZhbCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICd2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIHZhbGlkIG51bWJlci4gdmFsPScgK1xuICAgICAgSlNPTi5zdHJpbmdpZnkodmFsKVxuICApO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHN0ciA9IFN0cmluZyhzdHIpO1xuICBpZiAoc3RyLmxlbmd0aCA+IDEwMCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtaWxsaXNlY29uZHM/fG1zZWNzP3xtc3xzZWNvbmRzP3xzZWNzP3xzfG1pbnV0ZXM/fG1pbnM/fG18aG91cnM/fGhycz98aHxkYXlzP3xkfHllYXJzP3x5cnM/fHkpPyQvaS5leGVjKFxuICAgIHN0clxuICApO1xuICBpZiAoIW1hdGNoKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ3llYXJzJzpcbiAgICBjYXNlICd5ZWFyJzpcbiAgICBjYXNlICd5cnMnOlxuICAgIGNhc2UgJ3lyJzpcbiAgICBjYXNlICd5JzpcbiAgICAgIHJldHVybiBuICogeTtcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkO1xuICAgIGNhc2UgJ2hvdXJzJzpcbiAgICBjYXNlICdob3VyJzpcbiAgICBjYXNlICdocnMnOlxuICAgIGNhc2UgJ2hyJzpcbiAgICBjYXNlICdoJzpcbiAgICAgIHJldHVybiBuICogaDtcbiAgICBjYXNlICdtaW51dGVzJzpcbiAgICBjYXNlICdtaW51dGUnOlxuICAgIGNhc2UgJ21pbnMnOlxuICAgIGNhc2UgJ21pbic6XG4gICAgY2FzZSAnbSc6XG4gICAgICByZXR1cm4gbiAqIG07XG4gICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgY2FzZSAnc2Vjb25kJzpcbiAgICBjYXNlICdzZWNzJzpcbiAgICBjYXNlICdzZWMnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21pbGxpc2Vjb25kcyc6XG4gICAgY2FzZSAnbWlsbGlzZWNvbmQnOlxuICAgIGNhc2UgJ21zZWNzJzpcbiAgICBjYXNlICdtc2VjJzpcbiAgICBjYXNlICdtcyc6XG4gICAgICByZXR1cm4gbjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIFNob3J0IGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdFNob3J0KG1zKSB7XG4gIGlmIChtcyA+PSBkKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJztcbiAgfVxuICBpZiAobXMgPj0gaCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCc7XG4gIH1cbiAgaWYgKG1zID49IG0pIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICB9XG4gIGlmIChtcyA+PSBzKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJztcbiAgfVxuICByZXR1cm4gbXMgKyAnbXMnO1xufVxuXG4vKipcbiAqIExvbmcgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10TG9uZyhtcykge1xuICByZXR1cm4gcGx1cmFsKG1zLCBkLCAnZGF5JykgfHxcbiAgICBwbHVyYWwobXMsIGgsICdob3VyJykgfHxcbiAgICBwbHVyYWwobXMsIG0sICdtaW51dGUnKSB8fFxuICAgIHBsdXJhbChtcywgcywgJ3NlY29uZCcpIHx8XG4gICAgbXMgKyAnIG1zJztcbn1cblxuLyoqXG4gKiBQbHVyYWxpemF0aW9uIGhlbHBlci5cbiAqL1xuXG5mdW5jdGlvbiBwbHVyYWwobXMsIG4sIG5hbWUpIHtcbiAgaWYgKG1zIDwgbikge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAobXMgPCBuICogMS41KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IobXMgLyBuKSArICcgJyArIG5hbWU7XG4gIH1cbiAgcmV0dXJuIE1hdGguY2VpbChtcyAvIG4pICsgJyAnICsgbmFtZSArICdzJztcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwiLypcbiAqIENvcHlyaWdodCA6IFBhcnRuZXJpbmcgMy4wICgyMDA3LTIwMTYpXG4gKiBBdXRob3IgOiBTeWx2YWluIE1haMOpIDxzeWx2YWluLm1haGVAcGFydG5lcmluZy5mcj5cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBkaXlhLXNkay5cbiAqXG4gKiBkaXlhLXNkayBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBkaXlhLXNkayBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCBkaXlhLXNkay4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG5cblxuXG5cbi8qIG1heWEtY2xpZW50XG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQsIFBhcnRuZXJpbmcgUm9ib3RpY3MsIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBUaGlzIGxpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yXG4gKiBtb2RpZnkgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieSB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyB2ZXJzaW9uXG4gKlx0My4wIG9mIHRoZSBMaWNlbnNlLiBUaGlzIGxpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGVcbiAqIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuXG4gKiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSXG4gKiBQVVJQT1NFLiBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBhbG9uZyB3aXRoIHRoaXMgbGlicmFyeS5cbiAqL1xuKGZ1bmN0aW9uKCl7XG5cdGNvbnN0IGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgnc3RhdHVzJyk7XG5cdGxldCBXYXRjaGVyID0gcmVxdWlyZSgnLi93YXRjaGVyLmpzJyk7XG5cblx0bGV0IGlzQnJvd3NlciA9ICEodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpO1xuXHRpZighaXNCcm93c2VyKSB7IHZhciBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTsgfVxuXHRlbHNlIHsgdmFyIFByb21pc2UgPSB3aW5kb3cuUHJvbWlzZTsgfVxuXHRsZXQgRGl5YVNlbGVjdG9yID0gZDEuRGl5YVNlbGVjdG9yO1xuXHRsZXQgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8gTG9nZ2luZyB1dGlsaXR5IG1ldGhvZHMgLy8vLy8vLy8vLy8vLy8vLy8vXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblx0dmFyIERFQlVHID0gdHJ1ZTtcblx0dmFyIExvZ2dlciA9IHtcblx0XHRsb2c6IGZ1bmN0aW9uKG1lc3NhZ2Upe1xuXHRcdFx0aWYoREVCVUcpIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuXHRcdH0sXG5cblx0XHRlcnJvcjogZnVuY3Rpb24obWVzc2FnZSl7XG5cdFx0XHRpZihERUJVRykgY29uc29sZS5lcnJvcihtZXNzYWdlKTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqXHRjYWxsYmFjayA6IGZ1bmN0aW9uIGNhbGxlZCBhZnRlciBtb2RlbCB1cGRhdGVkXG5cdCAqICovXG5cdGZ1bmN0aW9uIFN0YXR1cyhzZWxlY3Rvcil7XG5cdFx0dGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yO1xuXHRcdHRoaXMuX2NvZGVyID0gc2VsZWN0b3IuZW5jb2RlKCk7XG5cdFx0dGhpcy53YXRjaGVycyA9IFtdO1xuXHRcdHRoaXMuc3Vic2NyaXB0aW9ucyA9IFtdOyAvLyBERVBSRUNBVEVEIFRPIEJFIFJFTU9WRUQgP1xuXG5cdFx0LyoqIG1vZGVsIG9mIHJvYm90IDogYXZhaWxhYmxlIHBhcnRzIGFuZCBzdGF0dXMgKiovXG5cdFx0dGhpcy5yb2JvdE1vZGVsID0gW107XG5cdFx0dGhpcy5fcm9ib3RNb2RlbEluaXQgPSBmYWxzZTtcblxuXHRcdC8qKiogc3RydWN0dXJlIG9mIGRhdGEgY29uZmlnICoqKlxuXHRcdFx0IGNyaXRlcmlhIDpcblx0XHRcdCAgIHRpbWU6IGFsbCAzIHRpbWUgY3JpdGVyaWEgc2hvdWxkIG5vdCBiZSBkZWZpbmVkIGF0IHRoZSBzYW1lIHRpbWUuIChyYW5nZSB3b3VsZCBiZSBnaXZlbiB1cClcblx0XHRcdCAgICAgYmVnOiB7W251bGxdLHRpbWV9IChudWxsIG1lYW5zIG1vc3QgcmVjZW50KSAvLyBzdG9yZWQgYSBVVEMgaW4gbXMgKG51bSlcblx0XHRcdCAgICAgZW5kOiB7W251bGxdLCB0aW1lfSAobnVsbCBtZWFucyBtb3N0IG9sZGVzdCkgLy8gc3RvcmVkIGFzIFVUQyBpbiBtcyAobnVtKVxuXHRcdFx0ICAgICByYW5nZToge1tudWxsXSwgdGltZX0gKHJhbmdlIG9mIHRpbWUocG9zaXRpdmUpICkgLy8gaW4gcyAobnVtKVxuXHRcdFx0ICAgcm9ib3Q6IHtBcnJheU9mIElEIG9yIFtcImFsbFwiXX1cblx0XHRcdCAgIHBsYWNlOiB7QXJyYXlPZiBJRCBvciBbXCJhbGxcIl19XG5cdFx0XHQgb3BlcmF0b3I6IHtbbGFzdF0sIG1heCwgbW95LCBzZH0gLSggbWF5YmUgbW95IHNob3VsZCBiZSBkZWZhdWx0XG5cdFx0XHQgLi4uXG5cblx0XHRcdCBwYXJ0cyA6IHtbbnVsbF0gb3IgQXJyYXlPZiBQYXJ0c0lkfSB0byBnZXQgZXJyb3JzXG5cdFx0XHQgc3RhdHVzIDoge1tudWxsXSBvciBBcnJheU9mIFN0YXR1c05hbWV9IHRvIGdldCBzdGF0dXNcblxuXHRcdFx0IHNhbXBsaW5nOiB7W251bGxdIG9yIGludH1cblx0XHQqL1xuXHRcdHRoaXMuZGF0YUNvbmZpZyA9IHtcblx0XHRcdGNyaXRlcmlhOiB7XG5cdFx0XHRcdHRpbWU6IHtcblx0XHRcdFx0XHRiZWc6IG51bGwsXG5cdFx0XHRcdFx0ZW5kOiBudWxsLFxuXHRcdFx0XHRcdHJhbmdlOiBudWxsIC8vIGluIHNcblx0XHRcdFx0fSxcblx0XHRcdFx0cm9ib3Q6IG51bGxcblx0XHRcdH0sXG5cdFx0XHRvcGVyYXRvcjogJ2xhc3QnLFxuXHRcdFx0cGFydHM6IG51bGwsXG5cdFx0XHRzdGF0dXM6IG51bGxcblx0XHR9O1xuXG5cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXHQvKipcblx0ICogR2V0IHJvYm90TW9kZWwgOlxuXHQgKiB7XG5cdCAqICBwYXJ0czoge1xuXHQgKlx0XHRcInBhcnRYWFwiOiB7XG5cdCAqIFx0XHRcdCBlcnJvcnNEZXNjcjogeyBlbmNvdW50ZXJlZCBlcnJvcnMgaW5kZXhlZCBieSBlcnJvcklkcz4wIH1cblx0ICpcdFx0XHRcdD4gQ29uZmlnIG9mIGVycm9ycyA6XG5cdCAqXHRcdFx0XHRcdGNyaXRMZXZlbDogRkxPQVQsIC8vIGNvdWxkIGJlIGludC4uLlxuXHQgKiBcdFx0XHRcdFx0bXNnOiBTVFJJTkcsXG5cdCAqXHRcdFx0XHRcdHN0b3BTZXJ2aWNlSWQ6IFNUUklORyxcblx0ICpcdFx0XHRcdFx0cnVuU2NyaXB0OiBTZXF1ZWxpemUuU1RSSU5HLFxuXHQgKlx0XHRcdFx0XHRtaXNzaW9uTWFzazogU2VxdWVsaXplLklOVEVHRVIsXG5cdCAqXHRcdFx0XHRcdHJ1bkxldmVsOiBTZXF1ZWxpemUuSU5URUdFUlxuXHQgKlx0XHRcdGVycm9yOltGTE9BVCwgLi4uXSwgLy8gY291bGQgYmUgaW50Li4uXG5cdCAqXHRcdFx0dGltZTpbRkxPQVQsIC4uLl0sXG5cdCAqXHRcdFx0cm9ib3Q6W0ZMT0FULCAuLi5dLFxuXHQgKlx0XHRcdC8vLyBwbGFjZTpbRkxPQVQsIC4uLl0sIG5vdCBpbXBsZW1lbnRlZCB5ZXRcblx0ICpcdFx0fSxcblx0ICpcdCBcdC4uLiAoXCJQYXJ0WVlcIilcblx0ICogIH0sXG5cdCAqICBzdGF0dXM6IHtcblx0ICpcdFx0XCJzdGF0dXNYWFwiOiB7XG5cdCAqXHRcdFx0XHRkYXRhOltGTE9BVCwgLi4uXSwgLy8gY291bGQgYmUgaW50Li4uXG5cdCAqXHRcdFx0XHR0aW1lOltGTE9BVCwgLi4uXSxcblx0ICpcdFx0XHRcdHJvYm90OltGTE9BVCwgLi4uXSxcblx0ICpcdFx0XHRcdC8vLyBwbGFjZTpbRkxPQVQsIC4uLl0sIG5vdCBpbXBsZW1lbnRlZCB5ZXRcblx0ICpcdFx0XHRcdHJhbmdlOiBbRkxPQVQsIEZMT0FUXSxcblx0ICpcdFx0XHRcdGxhYmVsOiBzdHJpbmdcblx0ICpcdFx0XHR9LFxuXHQgKlx0IFx0Li4uIChcIlN0YXR1c1lZXCIpXG5cdCAqICB9XG5cdCAqIH1cblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuZ2V0Um9ib3RNb2RlbCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMucm9ib3RNb2RlbDtcblx0fTtcblxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IGRhdGFDb25maWcgY29uZmlnIGZvciBkYXRhIHJlcXVlc3Rcblx0ICogaWYgZGF0YUNvbmZpZyBpcyBkZWZpbmUgOiBzZXQgYW5kIHJldHVybiB0aGlzXG5cdCAqXHQgQHJldHVybiB7U3RhdHVzfSB0aGlzXG5cdCAqIGVsc2Vcblx0ICpcdCBAcmV0dXJuIHtPYmplY3R9IGN1cnJlbnQgZGF0YUNvbmZpZ1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5EYXRhQ29uZmlnID0gZnVuY3Rpb24obmV3RGF0YUNvbmZpZyl7XG5cdFx0aWYobmV3RGF0YUNvbmZpZykge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnPW5ld0RhdGFDb25maWc7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHRoaXMuZGF0YUNvbmZpZztcblx0fTtcblx0LyoqXG5cdCAqIFRPIEJFIElNUExFTUVOVEVEIDogb3BlcmF0b3IgbWFuYWdlbWVudCBpbiBETi1TdGF0dXNcblx0ICogQHBhcmFtICB7U3RyaW5nfVx0IG5ld09wZXJhdG9yIDoge1tsYXN0XSwgbWF4LCBtb3ksIHNkfVxuXHQgKiBAcmV0dXJuIHtTdGF0dXN9IHRoaXMgLSBjaGFpbmFibGVcblx0ICogU2V0IG9wZXJhdG9yIGNyaXRlcmlhLlxuXHQgKiBEZXBlbmRzIG9uIG5ld09wZXJhdG9yXG5cdCAqXHRAcGFyYW0ge1N0cmluZ30gbmV3T3BlcmF0b3Jcblx0ICpcdEByZXR1cm4gdGhpc1xuXHQgKiBHZXQgb3BlcmF0b3IgY3JpdGVyaWEuXG5cdCAqXHRAcmV0dXJuIHtTdHJpbmd9IG9wZXJhdG9yXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFPcGVyYXRvciA9IGZ1bmN0aW9uKG5ld09wZXJhdG9yKXtcblx0XHRpZihuZXdPcGVyYXRvcikge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLm9wZXJhdG9yID0gbmV3T3BlcmF0b3I7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHRoaXMuZGF0YUNvbmZpZy5vcGVyYXRvcjtcblx0fTtcblx0LyoqXG5cdCAqIERlcGVuZHMgb24gbnVtU2FtcGxlc1xuXHQgKiBAcGFyYW0ge2ludH0gbnVtYmVyIG9mIHNhbXBsZXMgaW4gZGF0YU1vZGVsXG5cdCAqIGlmIGRlZmluZWQgOiBzZXQgbnVtYmVyIG9mIHNhbXBsZXNcblx0ICpcdEByZXR1cm4ge1N0YXR1c30gdGhpc1xuXHQgKiBlbHNlXG5cdCAqXHRAcmV0dXJuIHtpbnR9IG51bWJlciBvZiBzYW1wbGVzXG5cdCAqKi9cblx0U3RhdHVzLnByb3RvdHlwZS5EYXRhU2FtcGxpbmcgPSBmdW5jdGlvbihudW1TYW1wbGVzKXtcblx0XHRpZihudW1TYW1wbGVzKSB7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcuc2FtcGxpbmcgPSBudW1TYW1wbGVzO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB0aGlzLmRhdGFDb25maWcuc2FtcGxpbmc7XG5cdH07XG5cdC8qKlxuXHQgKiBTZXQgb3IgZ2V0IGRhdGEgdGltZSBjcml0ZXJpYSBiZWcgYW5kIGVuZC5cblx0ICogSWYgcGFyYW0gZGVmaW5lZFxuXHQgKlx0QHBhcmFtIHtEYXRlfSBuZXdUaW1lQmVnIC8vIG1heSBiZSBudWxsXG5cdCAqXHRAcGFyYW0ge0RhdGV9IG5ld1RpbWVFbmQgLy8gbWF5IGJlIG51bGxcblx0ICpcdEByZXR1cm4ge1N0YXR1c30gdGhpc1xuXHQgKiBJZiBubyBwYXJhbSBkZWZpbmVkOlxuXHQgKlx0QHJldHVybiB7T2JqZWN0fSBUaW1lIG9iamVjdDogZmllbGRzIGJlZyBhbmQgZW5kLlxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5EYXRhVGltZSA9IGZ1bmN0aW9uKG5ld1RpbWVCZWcsbmV3VGltZUVuZCwgbmV3UmFuZ2Upe1xuXHRcdGlmKG5ld1RpbWVCZWcgfHwgbmV3VGltZUVuZCB8fCBuZXdSYW5nZSkge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUuYmVnID0gbmV3VGltZUJlZy5nZXRUaW1lKCk7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5lbmQgPSBuZXdUaW1lRW5kLmdldFRpbWUoKTtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS50aW1lLnJhbmdlID0gbmV3UmFuZ2U7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0YmVnOiBuZXcgRGF0ZSh0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5iZWcpLFxuXHRcdFx0XHRlbmQ6IG5ldyBEYXRlKHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS50aW1lLmVuZCksXG5cdFx0XHRcdHJhbmdlOiBuZXcgRGF0ZSh0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5yYW5nZSlcblx0XHRcdH07XG5cdH07XG5cdC8qKlxuXHQgKiBEZXBlbmRzIG9uIHJvYm90SWRzXG5cdCAqIFNldCByb2JvdCBjcml0ZXJpYS5cblx0ICpcdEBwYXJhbSB7QXJyYXlbSW50XX0gcm9ib3RJZHMgbGlzdCBvZiByb2JvdCBJZHNcblx0ICogR2V0IHJvYm90IGNyaXRlcmlhLlxuXHQgKlx0QHJldHVybiB7QXJyYXlbSW50XX0gbGlzdCBvZiByb2JvdCBJZHNcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YVJvYm90SWRzID0gZnVuY3Rpb24ocm9ib3RJZHMpe1xuXHRcdGlmKHJvYm90SWRzKSB7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEucm9ib3QgPSByb2JvdElkcztcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gdGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnJvYm90O1xuXHR9O1xuXHQvKipcblx0ICogRGVwZW5kcyBvbiBwbGFjZUlkcyAvLyBub3QgcmVsZXZhbnQ/LCBub3QgaW1wbGVtZW50ZWQgeWV0XG5cdCAqIFNldCBwbGFjZSBjcml0ZXJpYS5cblx0ICpcdEBwYXJhbSB7QXJyYXlbSW50XX0gcGxhY2VJZHMgbGlzdCBvZiBwbGFjZSBJZHNcblx0ICogR2V0IHBsYWNlIGNyaXRlcmlhLlxuXHQgKlx0QHJldHVybiB7QXJyYXlbSW50XX0gbGlzdCBvZiBwbGFjZSBJZHNcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YVBsYWNlSWRzID0gZnVuY3Rpb24ocGxhY2VJZHMpe1xuXHRcdGlmKHBsYWNlSWRzKSB7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEucGxhY2VJZCA9IHBsYWNlSWRzO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEucGxhY2U7XG5cdH07XG5cdC8qKlxuXHQgKiBHZXQgZGF0YSBieSBzZW5zb3IgbmFtZS5cblx0ICpcdEBwYXJhbSB7QXJyYXlbU3RyaW5nXX0gc2Vuc29yTmFtZSBsaXN0IG9mIHNlbnNvcnNcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuZ2V0RGF0YUJ5TmFtZSA9IGZ1bmN0aW9uKHNlbnNvck5hbWVzKXtcblx0XHR2YXIgZGF0YT1bXTtcblx0XHRmb3IodmFyIG4gaW4gc2Vuc29yTmFtZXMpIHtcblx0XHRcdGRhdGEucHVzaCh0aGlzLmRhdGFNb2RlbFtzZW5zb3JOYW1lc1tuXV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gZGF0YTtcblx0fTtcblxuXHQvKipcblx0ICogU3Vic2NyaWJlIHRvIGVycm9yL3N0YXR1cyB1cGRhdGVzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLndhdGNoID0gZnVuY3Rpb24ocm9ib3ROYW1lcywgY2FsbGJhY2spIHtcblxuXHRcdC8vIGRvIG5vdCBjcmVhdGUgd2F0Y2hlciB3aXRob3V0IGEgY2FsbGJhY2tcblx0XHRpZiAoY2FsbGJhY2sgPT0gbnVsbCB8fCB0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0bGV0IHdhdGNoZXIgPSBuZXcgV2F0Y2hlcih0aGlzLnNlbGVjdG9yLCByb2JvdE5hbWVzKVxuXG5cdFx0Ly8gYWRkIHdhdGNoZXIgaW4gd2F0Y2hlciBsaXN0XG5cdFx0dGhpcy53YXRjaGVycy5wdXNoKHdhdGNoZXIpXG5cblx0XHR3YXRjaGVyLm9uKCdkYXRhJywgKGRhdGEpID0+IHtcblx0XHRcdGRlYnVnKGRhdGEpXG5cdFx0XHRjYWxsYmFjayh0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKGRhdGEucGFydHMsXG5cdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEucm9ib3RJZCxcblx0XHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5yb2JvdE5hbWUpLFxuXHRcdFx0ICAgICAgICAgZGF0YS5wZWVySWQpXG5cdFx0fSlcblx0XHR3YXRjaGVyLm9uKCdzdG9wJywgdGhpcy5fcmVtb3ZlV2F0Y2hlcilcblxuXHRcdHJldHVybiB3YXRjaGVyO1xuXG5cblxuXHRcdC8vIC8vIEluY3JlYXNlIG51bWJlciBvZiBsaXN0ZW5lcnMgKFNIT1VMRCBCRSBBVk9JREVEKVxuXHRcdC8vIHRoaXMuc2VsZWN0b3Iuc2V0TWF4TGlzdGVuZXJzKDApO1xuXHRcdC8vIHRoaXMuc2VsZWN0b3IuX2Nvbm5lY3Rpb24uc2V0TWF4TGlzdGVuZXJzKDApO1xuXG5cdFx0Ly8gcmV0dXJuIFByb21pc2UudHJ5KF8gPT4ge1xuXHRcdC8vIFx0dGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHQvLyBcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0Ly8gXHRcdGZ1bmM6ICdHZXRNYW5hZ2VkT2JqZWN0cycsXG5cdFx0Ly8gXHRcdG9iajoge1xuXHRcdC8vIFx0XHRcdGludGVyZmFjZTogJ29yZy5mcmVlZGVza3RvcC5EQnVzLk9iamVjdE1hbmFnZXInLFxuXHRcdC8vIFx0XHR9XG5cdFx0Ly8gXHR9LCB0aGlzLm9uR2V0TWFuYWdlZE9iamVjdHNXYXRjaC5iaW5kKHRoaXMsIHJvYm90TmFtZXMsIGNhbGxiYWNrKSk7XG5cdFx0Ly8gfSkuY2F0Y2goZXJyID0+IHtcblx0XHQvLyBcdExvZ2dlci5lcnJvcihlcnIpO1xuXHRcdC8vIH0pXG5cdH07XG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIHRvIHJlbW92ZSB3YXRjaGVyIGZyb20gbGlzdFxuXHQgKiBAcGFyYW0gd2F0Y2hlciB0byBiZSByZW1vdmVkXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLl9yZW1vdmVXYXRjaGVyID0gZnVuY3Rpb24gKHdhdGNoZXIpIHtcblx0XHQvLyBmaW5kIGFuZCByZW1vdmUgd2F0Y2hlciBpbiBsaXN0XG5cdFx0dGhpcy53YXRjaGVycy5maW5kKCAoZWwsIGlkLCB3YXRjaGVycykgPT4ge1xuXHRcdFx0aWYgKHdhdGNoZXIgPT09IGVsKSB7XG5cdFx0XHRcdHdhdGNoZXJzLnNwbGljZShpZCwgMSk7IC8vIHJlbW92ZVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9KVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBTdG9wIGFsbCB3YXRjaGVyc1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5jbG9zZVN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0Y29uc29sZS53YXJuKCdEZXByZWNhdGVkIGZ1bmN0aW9uIHVzZSBzdG9wV2F0Y2hlcnMgaW5zdGVhZCcpO1xuXHRcdHRoaXMuc3RvcFdhdGNoZXJzKCk7XG5cdH07XG5cdFN0YXR1cy5wcm90b3R5cGUuc3RvcFdhdGNoZXJzID0gZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMud2F0Y2hlcnMuZm9yRWFjaCggd2F0Y2hlciA9PiB7XG5cdFx0XHQvLyByZW1vdmUgbGlzdGVuZXIgb24gc3RvcCBldmVudCB0byBhdm9pZCBwdXJnaW5nIHdhdGNoZXJzIHR3aWNlXG5cdFx0XHR3YXRjaGVyLnJlbW92ZUxpc3RlbmVyKCdzdG9wJywgdGhpcy5fcmVtb3ZlV2F0Y2hlcik7XG5cdFx0XHR3YXRjaGVyLnN0b3AoKTtcblx0XHR9KTtcblx0XHR0aGlzLndhdGNoZXJzID1bXTtcblx0XHQvLyB0aGlzLnJvYm90TW9kZWwgPSBbXTsgREVWRUwgLSBORUVERUQgP1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBvbiBHZXRNYW5hZ2VkT2JqZWN0cyBpbiBXYXRjaFxuXHQgKi9cblx0Ly8gZ2V0IGFsbCBvYmplY3QgcGF0aHMsIGludGVyZmFjZXMgYW5kIHByb3BlcnRpZXMgY2hpbGRyZW4gb2YgU3RhdHVzXG5cdFN0YXR1cy5wcm90b3R5cGUub25HZXRNYW5hZ2VkT2JqZWN0c1dhdGNoID0gZnVuY3Rpb24ocm9ib3ROYW1lcywgY2FsbGJhY2ssXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVlcklkLCBlcnIsIGRhdGEpIHtcblx0XHRsZXQgcm9ib3ROYW1lID0gJyc7XG5cdFx0bGV0IHJvYm90SWQgPSAxO1xuXHRcdGxldCByb2JvdElkcyA9IFtdO1xuXHRcdGZvciAobGV0IG9iamVjdFBhdGggaW4gZGF0YSkge1xuXHRcdFx0aWYgKGRhdGFbb2JqZWN0UGF0aF1bJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90J10gIT0gbnVsbCkge1xuXHRcdFx0XHRyb2JvdE5hbWUgPSBkYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90TmFtZTtcblx0XHRcdFx0cm9ib3RJZCA9IGRhdGFbb2JqZWN0UGF0aF1bJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90J10uUm9ib3RJZDtcblx0XHRcdFx0cm9ib3RJZHNbcm9ib3ROYW1lXSA9IHJvYm90SWQ7XG5cdFx0XHRcdHRoaXMuZ2V0QWxsU3RhdHVzZXMocm9ib3ROYW1lLCB0aGlzLm9uR2V0QWxsU3RhdHVzZXMuYmluZCh0aGlzLCBwZWVySWQsIGNhbGxiYWNrKSlcblx0XHRcdH1cblx0XHRcdGlmIChkYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0J10gIT0gbnVsbCkge1xuXHRcdFx0XHRsZXQgc3VicyA9IHRoaXMuc2VsZWN0b3Iuc3Vic2NyaWJlKHsvLyBzdWJzY3JpYmVzIHRvIHN0YXR1cyBjaGFuZ2VzIGZvciBhbGwgcGFydHNcblx0XHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHRcdFx0XHRmdW5jOiAnU3RhdHVzQ2hhbmdlZCcsXG5cdFx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0XHRcdFx0XHRcdHBhdGg6IG9iamVjdFBhdGhcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGRhdGE6IHJvYm90TmFtZXNcblx0XHRcdFx0fSwgdGhpcy5vblN0YXR1c0NoYW5nZWQuYmluZCh0aGlzLCByb2JvdElkLCByb2JvdE5hbWUsIGNhbGxiYWNrKSk7XG5cdFx0XHRcdHRoaXMuc3Vic2NyaXB0aW9ucy5wdXNoKHN1YnMpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBvbiBHZXRBbGxTdGF0dXNlc1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5vbkdldEFsbFN0YXR1c2VzID0gZnVuY3Rpb24ocGVlcklkLCBjYWxsYmFjaywgbW9kZWwpIHtcblx0XHRjYWxsYmFjayhtb2RlbCwgcGVlcklkKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBvbiBTdGF0dXNDaGFuZ2VkXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLm9uU3RhdHVzQ2hhbmdlZCA9IGZ1bmN0aW9uKHJvYm90SWQsIHJvYm90TmFtZSwgY2FsbGJhY2ssIHBlZXJJZCwgZXJyLCBkYXRhKSB7XG5cdFx0bGV0IHNlbmREYXRhID0gW107XG5cdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRMb2dnZXIuZXJyb3IoXCJTdGF0dXNTdWJzY3JpYmU6XCIgKyBlcnIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZW5kRGF0YVswXSA9IGRhdGE7XG5cdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwsIHBlZXJJZCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8vIERFUFJFQ0FURURcblx0Ly8gLyoqXG5cdC8vICAqIENsb3NlIGFsbCBzdWJzY3JpcHRpb25zXG5cdC8vICAqL1xuXHQvLyBTdGF0dXMucHJvdG90eXBlLmNsb3NlU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uKCl7XG5cdC8vIFx0Zm9yKHZhciBpIGluIHRoaXMuc3Vic2NyaXB0aW9ucykge1xuXHQvLyBcdFx0dGhpcy5zdWJzY3JpcHRpb25zW2ldLmNsb3NlKCk7XG5cdC8vIFx0fVxuXHQvLyBcdHRoaXMuc3Vic2NyaXB0aW9ucyA9W107XG5cdC8vIFx0dGhpcy5yb2JvdE1vZGVsID0gW107XG5cdC8vIH07XG5cblx0LyoqXG5cdCAqIEdldCBkYXRhIGdpdmVuIGRhdGFDb25maWcuXG5cdCAqIEBwYXJhbSB7ZnVuY30gY2FsbGJhY2sgOiBjYWxsZWQgYWZ0ZXIgdXBkYXRlXG5cdCAqIFRPRE8gVVNFIFBST01JU0Vcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuZ2V0RGF0YSA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBkYXRhQ29uZmlnKXtcblx0XHRyZXR1cm4gUHJvbWlzZS50cnkoXyA9PiB7XG5cdFx0XHRpZihkYXRhQ29uZmlnICE9IG51bGwpXG5cdFx0XHRcdHRoaXMuRGF0YUNvbmZpZyhkYXRhQ29uZmlnKTtcblx0XHRcdC8vIGNvbnNvbGUubG9nKFwiUmVxdWVzdDogXCIrSlNPTi5zdHJpbmdpZnkoZGF0YUNvbmZpZykpO1xuXHRcdFx0dGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdFx0ZnVuYzogXCJEYXRhUmVxdWVzdFwiLFxuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0dHlwZTpcInNwbFJlcVwiLFxuXHRcdFx0XHRcdGRhdGFDb25maWc6IHRoaXMuZGF0YUNvbmZpZ1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB0aGlzLm9uRGF0YVJlcXVlc3QuYmluZCh0aGlzLCBjYWxsYmFjaykpO1xuXHRcdH0pLmNhdGNoKGVyciA9PiB7XG5cdFx0XHRMb2dnZXIuZXJyb3IoZXJyKVxuXHRcdH0pXG5cdH07XG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIG9uIERhdGFSZXF1ZXN0XG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLm9uRGF0YVJlcXVlc3QgPSBmdW5jdGlvbihjYWxsYmFjaywgcGVlcklkLCBlcnIsIGRhdGEpIHtcblx0XHRsZXQgZGF0YU1vZGVsID0ge307XG5cdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRMb2dnZXIuZXJyb3IoXCJbXCIgKyB0aGlzLmRhdGFDb25maWcuc2Vuc29ycyArIFwiXSBSZWN2IGVycjogXCIgKyBKU09OLnN0cmluZ2lmeShlcnIpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYoZGF0YS5oZWFkZXIuZXJyb3IgIT0gbnVsbCkge1xuXHRcdFx0Ly8gVE9ETyA6IGNoZWNrL3VzZSBlcnIgc3RhdHVzIGFuZCBhZGFwdCBiZWhhdmlvciBhY2NvcmRpbmdseVxuXHRcdFx0TG9nZ2VyLmVycm9yKFwiVXBkYXRlRGF0YTpcXG5cIitKU09OLnN0cmluZ2lmeShkYXRhLmhlYWRlci5yZXFDb25maWcpKTtcblx0XHRcdExvZ2dlci5lcnJvcihcIkRhdGEgcmVxdWVzdCBmYWlsZWQgKFwiK2RhdGEuaGVhZGVyLmVycm9yLnN0K1wiKTogXCIrZGF0YS5oZWFkZXIuZXJyb3IubXNnKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Ly9Mb2dnZXIubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuZGF0YU1vZGVsKSk7XG5cdFx0ZGF0YU1vZGVsID0gdGhpcy5fZ2V0RGF0YU1vZGVsRnJvbVJlY3YoZGF0YSk7XG5cblx0XHRMb2dnZXIubG9nKHRoaXMuZ2V0RGF0YU1vZGVsKCkpO1xuXHRcdGNhbGxiYWNrKGRhdGFNb2RlbCk7IC8vIGNhbGxiYWNrIGZ1bmNcblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgaW50ZXJuYWwgcm9ib3QgbW9kZWwgd2l0aCByZWNlaXZlZCBkYXRhICh2ZXJzaW9uIDIpXG5cdCAqIEBwYXJhbSAge0FycmF5IG9mIEFycmF5IG9mIFBhcnRJbmZvIChzdHJ1Y3QpfSBkYXRhIGRhdGEgcmVjZWl2ZWQgZnJvbVxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEaXlhTm9kZSBieSB3ZWJzb2NrZXRcblx0ICogQHBhcmFtICB7aW50fSByb2JvdElkIGlkIG9mIHRoZSByb2JvdFxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHJvYm90TmFtZSBuYW1lIG9mIHRoZSByb2JvdFxuXHQgKiBAcmV0dXJuIHtbdHlwZV19XHRcdFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuX2dldFJvYm90TW9kZWxGcm9tUmVjdjIgPSBmdW5jdGlvbihkYXRhLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9ib3RJZCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvYm90TmFtZSkge1xuXHRcdGlmKHRoaXMucm9ib3RNb2RlbCA9PSBudWxsKVxuXHRcdFx0dGhpcy5yb2JvdE1vZGVsID0gW107XG5cblx0XHRpZih0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0gIT0gbnVsbClcblx0XHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXS5wYXJ0cyA9IHt9OyAvLyByZXNldCBwYXJ0c1xuXG5cdFx0aWYodGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdID09IG51bGwpXG5cdFx0XHR0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0gPSB7fTtcblxuXHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSA9IHtcblx0XHRcdHJvYm90OiB7XG5cdFx0XHRcdG5hbWU6IHJvYm90TmFtZVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKiogZXh0cmFjdCBwYXJ0cyBpbmZvICoqL1xuXHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXS5wYXJ0cyA9IHt9O1xuXHRcdGxldCByUGFydHMgPSB0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0ucGFydHM7XG5cblx0XHRkYXRhLmZvckVhY2goZCA9PiB7XG5cdFx0XHRsZXQgcGFydElkID0gZFswXTtcblx0XHRcdGxldCBjYXRlZ29yeSA9IGRbMV07XG5cdFx0XHRsZXQgcGFydE5hbWUgPSBkWzJdO1xuXHRcdFx0bGV0IGxhYmVsID0gZFszXTtcblx0XHRcdGxldCB0aW1lID0gZFs0XTtcblx0XHRcdGxldCBjb2RlID0gZFs1XTtcblx0XHRcdGxldCBjb2RlUmVmID0gZFs2XTtcblx0XHRcdGxldCBtc2cgPSBkWzddO1xuXHRcdFx0bGV0IGNyaXRMZXZlbCA9IGRbOF07XG5cdFx0XHRsZXQgZGVzY3JpcHRpb24gPSBkWzldO1xuXG5cdFx0XHRpZiAoclBhcnRzW3BhcnRJZF0gPT0gbnVsbCkge1xuXHRcdFx0XHRyUGFydHNbcGFydElkXSA9IHt9O1xuXHRcdFx0fVxuXHRcdFx0LyogdXBkYXRlIHBhcnQgY2F0ZWdvcnkgKi9cblx0XHRcdHJQYXJ0c1twYXJ0SWRdLmNhdGVnb3J5ID0gY2F0ZWdvcnk7XG5cdFx0XHQvKiB1cGRhdGUgcGFydCBuYW1lICovXG5cdFx0XHRyUGFydHNbcGFydElkXS5uYW1lID0gcGFydE5hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdC8qIHVwZGF0ZSBwYXJ0IGxhYmVsICovXG5cdFx0XHRyUGFydHNbcGFydElkXS5sYWJlbCA9IGxhYmVsO1xuXG5cdFx0XHQvKiB1cGRhdGUgZXJyb3IgKi9cblx0XHRcdC8qKiB1cGRhdGUgZXJyb3JMaXN0ICoqL1xuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdCA9PSBudWxsKVxuXHRcdFx0XHRyUGFydHNbcGFydElkXS5lcnJvckxpc3QgPSB7fTtcblxuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdFtjb2RlUmVmXSA9PSBudWxsKVxuXHRcdFx0XHRyUGFydHNbcGFydElkXS5lcnJvckxpc3RbY29kZVJlZl0gPSB7XG5cdFx0XHRcdFx0bXNnOiBtc2csXG5cdFx0XHRcdFx0Y3JpdExldmVsOiBjcml0TGV2ZWwsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG5cdFx0XHRcdH07XG5cdFx0XHRsZXQgZXZ0c190bXAgPSB7XG5cdFx0XHRcdHRpbWU6IHRoaXMuX2NvZGVyLmZyb20odGltZSksXG5cdFx0XHRcdGNvZGU6IHRoaXMuX2NvZGVyLmZyb20oY29kZSksXG5cdFx0XHRcdGNvZGVSZWY6IHRoaXMuX2NvZGVyLmZyb20oY29kZVJlZilcblx0XHRcdH07XG5cdFx0XHQvKiogaWYgcmVjZWl2ZWQgbGlzdCBvZiBldmVudHMgKiovXG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheShldnRzX3RtcC5jb2RlKSB8fCBBcnJheS5pc0FycmF5KGV2dHNfdG1wLnRpbWUpXG5cdFx0XHRcdHx8IEFycmF5LmlzQXJyYXkoZXZ0c190bXAuY29kZVJlZikpIHtcblx0XHRcdFx0aWYgKGV2dHNfdG1wLmNvZGUubGVuZ3RoID09PSBldnRzX3RtcC5jb2RlUmVmLmxlbmd0aFxuXHRcdFx0XHRcdCYmIGV2dHNfdG1wLmNvZGUubGVuZ3RoID09PSBldnRzX3RtcC50aW1lLmxlbmd0aCkge1xuXHRcdFx0XHRcdC8qKiBidWlsZCBsaXN0IG9mIGV2ZW50cyAqKi9cblx0XHRcdFx0XHRyUGFydHNbcGFydElkXS5ldnRzID0gW107XG5cdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBldnRzX3RtcC5jb2RlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRyUGFydHNbcGFydElkXS5ldnRzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHR0aW1lOiBldnRzX3RtcC50aW1lW2ldLFxuXHRcdFx0XHRcdFx0XHRjb2RlOiBldnRzX3RtcC5jb2RlW2ldLFxuXHRcdFx0XHRcdFx0XHRjb2RlUmVmOiBldnRzX3RtcC5jb2RlUmVmW2ldXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBMb2dnZXIuZXJyb3IoXCJTdGF0dXM6SW5jb25zaXN0YW50IGxlbmd0aHMgb2YgYnVmZmVycyAodGltZS9jb2RlL2NvZGVSZWYpXCIpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7IC8qKiBqdXN0IGluIGNhc2UsIHRvIHByb3ZpZGUgYmFja3dhcmQgY29tcGF0aWJpbGl0eSAqKi9cblx0XHRcdFx0LyoqIHNldCByZWNlaXZlZCBldmVudCAqKi9cblx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXZ0cyA9IFt7XG5cdFx0XHRcdFx0dGltZTogZXZ0c190bXAudGltZSxcblx0XHRcdFx0XHRjb2RlOiBldnRzX3RtcC5jb2RlLFxuXHRcdFx0XHRcdGNvZGVSZWY6IGV2dHNfdG1wLmNvZGVSZWZcblx0XHRcdFx0fV07XG5cdFx0XHR9XG5cdFx0fSlcblx0XHRyZXR1cm4gdGhpcy5yb2JvdE1vZGVsXG5cdH07XG5cblx0LyoqIGNyZWF0ZSBTdGF0dXMgc2VydmljZSAqKi9cblx0RGl5YVNlbGVjdG9yLnByb3RvdHlwZS5TdGF0dXMgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiBuZXcgU3RhdHVzKHRoaXMpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBTZXQgb24gc3RhdHVzXG5cdCAqIEBwYXJhbSByb2JvdE5hbWUgdG8gZmluZCBzdGF0dXMgdG8gbW9kaWZ5XG5cdCAqIEBwYXJhbSBwYXJ0TmFtZSBcdHRvIGZpbmQgc3RhdHVzIHRvIG1vZGlmeVxuXHQgKiBAcGFyYW0gY29kZVx0XHRuZXdDb2RlXG5cdCAqIEBwYXJhbSBzb3VyY2VcdFx0c291cmNlXG5cdCAqIEBwYXJhbSBjYWxsYmFja1x0XHRyZXR1cm4gY2FsbGJhY2sgKDxib29sPnN1Y2Nlc3MpXG5cdCAqL1xuXHREaXlhU2VsZWN0b3IucHJvdG90eXBlLnNldFN0YXR1cyA9IGZ1bmN0aW9uKHJvYm90TmFtZSwgcGFydE5hbWUsIGNvZGUsIHNvdXJjZSwgY2FsbGJhY2spIHtcblx0XHRyZXR1cm4gUHJvbWlzZS50cnkoXyA9PiB7XG5cdFx0XHR2YXIgb2JqZWN0UGF0aCA9IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9cIiArIHRoaXMuc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIikgKyBcIi9QYXJ0cy9cIiArIHBhcnROYW1lO1xuXHRcdFx0dGhpcy5yZXF1ZXN0KHtcblx0XHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdFx0ZnVuYzogXCJTZXRQYXJ0XCIsXG5cdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnLFxuXHRcdFx0XHRcdHBhdGg6IG9iamVjdFBhdGhcblx0XHRcdFx0fSxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdC8vcm9ib3ROYW1lOiByb2JvdE5hbWUsXG5cdFx0XHRcdFx0Y29kZTogY29kZSxcblx0XHRcdFx0XHQvL3BhcnROYW1lOiBwYXJ0TmFtZSxcblx0XHRcdFx0XHRzb3VyY2U6IHNvdXJjZSB8IDFcblx0XHRcdFx0fVxuXHRcdFx0fSwgdGhpcy5vblNldFBhcnQuYmluZCh0aGlzLCBjYWxsYmFjaykpO1xuXHRcdH0pLmNhdGNoKGVyciA9PiB7XG5cdFx0XHRMb2dnZXIuZXJyb3IoZXJyKVxuXHRcdH0pXG5cdH07XG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIG9uIFNldFBhcnRcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUub25TZXRQYXJ0ID0gZnVuY3Rpb24oY2FsbGJhY2ssIHBlZXJJZCwgZXJyLCBkYXRhKSB7XG5cdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayhmYWxzZSk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2sodHJ1ZSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEdldCBvbmUgc3RhdHVzXG5cdCAqIEBwYXJhbSByb2JvdE5hbWUgdG8gZ2V0IHN0YXR1c1xuXHQgKiBAcGFyYW0gcGFydE5hbWUgXHR0byBnZXQgc3RhdHVzXG5cdCAqIEBwYXJhbSBjYWxsYmFja1x0XHRyZXR1cm4gY2FsbGJhY2soLTEgaWYgbm90IGZvdW5kL2RhdGEgb3RoZXJ3aXNlKVxuXHQgKiBAcGFyYW0gX2Z1bGwgXHRtb3JlIGRhdGEgYWJvdXQgc3RhdHVzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmdldFN0YXR1cyA9IGZ1bmN0aW9uKHJvYm90TmFtZSwgcGFydE5hbWUsIGNhbGxiYWNrLyosIF9mdWxsKi8pIHtcblx0XHRyZXR1cm4gUHJvbWlzZS50cnkoXyA9PiB7XG5cdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHRcdFx0ZnVuYzogJ0dldE1hbmFnZWRPYmplY3RzJyxcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnb3JnLmZyZWVkZXNrdG9wLkRCdXMuT2JqZWN0TWFuYWdlcicsXG5cdFx0XHRcdH1cblx0XHRcdH0sIHRoaXMub25HZXRNYW5hZ2VkT2JqZWN0c0dldFN0YXR1cy5iaW5kKHRoaXMsIHJvYm90TmFtZSwgcGFydE5hbWUsIGNhbGxiYWNrKSk7XG5cdFx0fSkuY2F0Y2goZXJyID0+IHtcblx0XHRcdExvZ2dlci5lcnJvcihlcnIpXG5cdFx0fSlcblx0fTtcblxuXHQvKipcblx0ICogQ2FsbGJhY2sgb24gR2V0TWFuYWdlZE9iamVjdHMgaW4gR2V0U3RhdHVzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLm9uR2V0TWFuYWdlZE9iamVjdHNHZXRTdGF0dXMgPSBmdW5jdGlvbihyb2JvdE5hbWUsIHBhcnROYW1lLCBjYWxsYmFjaywgcGVlcklkLCBlcnIsIGRhdGEpIHtcblx0XHRsZXQgb2JqZWN0UGF0aFJvYm90ID0gXCIvZnIvcGFydG5lcmluZy9TdGF0dXMvUm9ib3RzL1wiICsgdGhpcy5zcGxpdEFuZENhbWVsQ2FzZShyb2JvdE5hbWUsIFwiLVwiKTtcblx0XHRsZXQgb2JqZWN0UGF0aFBhcnQgPSBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1cy9Sb2JvdHMvXCIgKyB0aGlzLnNwbGl0QW5kQ2FtZWxDYXNlKHJvYm90TmFtZSwgXCItXCIpICsgXCIvUGFydHMvXCIgKyBwYXJ0TmFtZTtcblx0XHRsZXQgcm9ib3RJZCA9IGRhdGFbb2JqZWN0UGF0aFJvYm90XVsnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXS5Sb2JvdElkXG5cdFx0dGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRmdW5jOiBcIkdldFBhcnRcIixcblx0XHRcdG9iajoge1xuXHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFBhcnRcblx0XHRcdH1cblx0XHR9LCB0aGlzLm9uR2V0UGFydC5iaW5kKHRoaXMsIHJvYm90SWQsIHJvYm90TmFtZSwgY2FsbGJhY2spKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBvbiBHZXRQYXJ0XG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLm9uR2V0UGFydCA9IGZ1bmN0aW9uKHJvYm90SWQsIHJvYm90TmFtZSwgY2FsbGJhY2ssIHBlZXJJZCwgZXJyLCBkYXRhKSB7XG5cdFx0bGV0IHNlbmREYXRhID0gW11cblx0XHRzZW5kRGF0YS5wdXNoKGRhdGEpXG5cdFx0dGhpcy5fZ2V0Um9ib3RNb2RlbEZyb21SZWN2MihzZW5kRGF0YSwgcm9ib3RJZCwgcm9ib3ROYW1lKTtcblx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKC0xKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgYWxsIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGdldCBzdGF0dXNcblx0ICogQHBhcmFtIHBhcnROYW1lIFx0dG8gZ2V0IHN0YXR1c1xuXHQgKiBAcGFyYW0gY2FsbGJhY2tcdFx0cmV0dXJuIGNhbGxiYWNrKC0xIGlmIG5vdCBmb3VuZC9kYXRhIG90aGVyd2lzZSlcblx0ICogQHBhcmFtIF9mdWxsIFx0bW9yZSBkYXRhIGFib3V0IHN0YXR1c1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5nZXRBbGxTdGF0dXNlcyA9IGZ1bmN0aW9uKHJvYm90TmFtZSwgY2FsbGJhY2spIHtcblx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0b2JqOiB7XG5cdFx0XHRcdGludGVyZmFjZTogJ29yZy5mcmVlZGVza3RvcC5EQnVzLk9iamVjdE1hbmFnZXInLFxuXHRcdFx0fVxuXHRcdH0sIHRoaXMub25HZXRNYW5hZ2VkT2JqZWN0c0dldEFsbFN0YXR1c2VzLmJpbmQodGhpcywgcm9ib3ROYW1lLCBjYWxsYmFjaykpXG5cdH07XG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIG9uIEdldE1hbmFnZWRPYmplY3RzIGluIEdldEFsbFN0YXR1c2VzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLm9uR2V0TWFuYWdlZE9iamVjdHNHZXRBbGxTdGF0dXNlcyA9IGZ1bmN0aW9uKHJvYm90TmFtZSwgY2FsbGJhY2ssIHBlZXJJZCwgZXJyLCBkYXRhKSB7XG5cdFx0bGV0IG9iamVjdFBhdGggPSBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1cy9Sb2JvdHMvXCIgKyB0aGlzLnNwbGl0QW5kQ2FtZWxDYXNlKHJvYm90TmFtZSwgXCItXCIpO1xuXHRcdGlmIChkYXRhW29iamVjdFBhdGhdICE9IG51bGwpIHtcblx0XHRcdGlmIChkYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddICE9IG51bGwpIHtcblx0XHRcdFx0bGV0IHJvYm90SWQgPSBkYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90SWRcblx0XHRcdFx0Ly92YXIgZnVsbCA9IF9mdWxsIHx8IGZhbHNlO1xuXHRcdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRcdFx0ZnVuYzogXCJHZXRBbGxQYXJ0c1wiLFxuXHRcdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnLFxuXHRcdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgdGhpcy5vbkdldEFsbFBhcnRzLmJpbmQodGhpcywgcm9ib3RJZCwgcm9ib3ROYW1lLCBjYWxsYmFjaykpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiSW50ZXJmYWNlIGZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90IGRvZXNuJ3QgZXhpc3QhXCIpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdExvZ2dlci5lcnJvcihcIk9iamVjdFBhdGggXCIgKyBvYmplY3RQYXRoICsgXCIgZG9lc24ndCBleGlzdCFcIilcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQ2FsbGJhY2sgb24gR2V0QWxsUGFydHNcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUub25HZXRBbGxQYXJ0cyA9IGZ1bmN0aW9uKHJvYm90SWQsIHJvYm90TmFtZSwgY2FsbGJhY2ssIHBlZXJJZCwgZXJyLCBkYXRhKSB7XG5cdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjaygtMSk7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMuX2dldFJvYm90TW9kZWxGcm9tUmVjdjIoZGF0YSwgcm9ib3RJZCwgcm9ib3ROYW1lKTtcblx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKHRoaXMucm9ib3RNb2RlbCk7XG5cdFx0fVxuXHR9XG5cblx0U3RhdHVzLnByb3RvdHlwZS5zcGxpdEFuZENhbWVsQ2FzZSA9IGZ1bmN0aW9uKGluU3RyaW5nLCBkZWxpbWl0ZXIpIHtcblx0XHRsZXQgYXJyYXlTcGxpdFN0cmluZyA9IGluU3RyaW5nLnNwbGl0KGRlbGltaXRlcik7XG5cdFx0bGV0IG91dENhbWVsU3RyaW5nID0gJyc7XG5cdFx0YXJyYXlTcGxpdFN0cmluZy5mb3JFYWNoKHN0ciA9PiB7XG5cdFx0XHRvdXRDYW1lbFN0cmluZyArPSBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc3Vic3RyaW5nKDEpO1xuXHRcdH0pXG5cdFx0cmV0dXJuIG91dENhbWVsU3RyaW5nO1xuXHR9XG5cbn0pKClcbiIsImNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcbmNvbnN0IGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgnc3RhdHVzOndhdGNoZXInKTtcbmNvbnN0IGRlYnVnRXJyb3IgPSByZXF1aXJlKCdkZWJ1ZycpKCdzdGF0dXM6d2F0Y2hlcjplcnJvcnMnKTtcbi8vISBjb25zdCBnZXRUaW1lU2FtcGxpbmcgPSByZXF1aXJlKCcuL3RpbWVjb250cm9sLmpzJykuZ2V0VGltZVNhbXBsaW5nO1xuXG4ndXNlIHN0cmljdCc7XG5cbmNsYXNzIFN0b3BDb25kaXRpb24gZXh0ZW5kcyBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKG1zZykge1xuXHRcdHN1cGVyKG1zZyk7XG5cdFx0dGhpcy5uYW1lPSdTdG9wQ29uZGl0aW9uJ1xuXHR9XG59XG5cbmNsYXNzIFdhdGNoZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXHQvKipcblx0ICogQHBhcmFtIGVtaXQgZW1pdCBkYXRhIChtYW5kYXRvcnkpXG5cdCAqIEBwYXJhbSBjb25maWcgdG8gZ2V0IGRhdGEgZnJvbSBzZXJ2ZXJcblx0ICovXG5cdGNvbnN0cnVjdG9yIChzZWxlY3Rvciwgcm9ib3ROYW1lcykge1xuXHRcdHN1cGVyKCk7XG5cblx0XHR0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3I7XG5cdFx0dGhpcy5zdWJzY3JpcHRpb25zID0gW107XG5cdFx0dGhpcy5zdGF0ZSA9ICdydW5uaW5nJztcblxuXHRcdHRoaXMucmVjb25uZWN0aW9uUGVyaW9kID0gMDsgLy8gaW5pdGlhbCBwZXJpb2QgYmV0d2VlbiByZWNvbm5lY3Rpb25zXG5cdFx0dGhpcy5tYXhSZWNvbm5lY3Rpb25QZXJpb2QgPSA2MDAwMDsgLy8gbWF4IDEgbWluXG5cblx0XHQvLyBJbmNyZWFzZSBudW1iZXIgb2YgbGlzdGVuZXJzIChTSE9VTEQgQkUgQVZPSURFRClcblx0XHR0aGlzLnNlbGVjdG9yLnNldE1heExpc3RlbmVycygwKTtcblx0XHR0aGlzLnNlbGVjdG9yLl9jb25uZWN0aW9uLnNldE1heExpc3RlbmVycygwKTtcblxuXHRcdC8qKiBpbml0aWFsaXNlIG9wdGlvbnMgZm9yIHJlcXVlc3QgKiovXG5cdFx0bGV0IG9wdGlvbnMgPSByb2JvdE5hbWVzO1xuXG5cdFx0dGhpcy5vcHRpb25zID0gb3B0aW9ucztcblx0XHRkZWJ1ZyhvcHRpb25zKTtcblxuXHRcdHRoaXMud2F0Y2gob3B0aW9ucyk7IC8vIHN0YXJ0IHdhdGNoZXJcblx0fVxuXG5cdHdhdGNoIChvcHRpb25zKSB7XG5cdFx0ZGVidWcoJ2luIHdhdGNoJyk7XG5cdFx0bmV3IFByb21pc2UoIChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdvcmcuZnJlZWRlc2t0b3AuREJ1cy5PYmplY3RNYW5hZ2VyJyxcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkgIHtcblx0XHRcdFx0XHRyZWplY3QoZXJyKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMuc3RhdGUgPT09ICdzdG9wcGVkJykge1xuXHRcdFx0XHRcdHJlamVjdChuZXcgU3RvcENvbmRpdGlvbigpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRkZWJ1ZygnUmVxdWVzdDplbWl0RGF0YScpO1xuXHRcdFx0XHQvLyBQYXJzZSBzdGF0dXMgZGF0YVxuXHRcdFx0XHRkZWJ1ZyhkYXRhKVxuXHRcdFx0XHRkYXRhID0gdGhpcy5fcGFyc2VHZXRNYW5hZ2VkT2JqZWN0c0RhdGEoZGF0YSlcblx0XHRcdFx0ZGVidWcoZGF0YSlcblx0XHRcdFx0Zm9yIChsZXQgZGV2aWNlTmFtZSBpbiBkYXRhLmRldmljZXMpIHtcblx0XHRcdFx0XHRsZXQgZGV2aWNlID0gZGF0YS5kZXZpY2VzW2RldmljZU5hbWVdXG5cdFx0XHRcdFx0aWYgKGRldmljZS5wYXJ0cy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRcdC8vIFRPRE8gdGhlcmUgc2hvdWxkIGJlIGEgc2lnbmFsIGluZGljYXRpbmdcblx0XHRcdFx0XHRcdC8vIHRoYXQgdGhlIG9iamVjdHMgcGF0aHMgaGFzIGFsbCBiZSBsb2FkZWQuLi5cblx0XHRcdFx0XHRcdC8vIEluZGVlZCwgdGhlIHBhcnRzIG1heSBub3QgaGF2ZSBiZWVuIGxvYWRlZCB5ZXRcblx0XHRcdFx0XHRcdHJlamVjdCgnRXJyb3I6IE5vIHBhcnQgeWV0Jylcblx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRsZXQgZGF0YVRvRW1pdCA9IHtcblx0XHRcdFx0XHRcdHBhcnRzOiBkZXZpY2UucGFydHMsXG5cdFx0XHRcdFx0XHRyb2JvdElkOiBkZXZpY2Uucm9ib3RJZCxcblx0XHRcdFx0XHRcdHJvYm90TmFtZTogZGV2aWNlLnJvYm90TmFtZSxcblx0XHRcdFx0XHRcdHBlZXJJZDogcGVlcklkLFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBTZW5kaW5nIHBhcnQgZGF0YSBkZXZpY2UgKHJvYm90KSBieSBkZXZpY2Vcblx0XHRcdFx0XHR0aGlzLmVtaXQoJ2RhdGEnLCBkYXRhVG9FbWl0KVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdH0pO1xuXHRcdH0pXG5cdFx0XHQudGhlbiggXyA9PiB7XG5cdFx0XHRcdC8vIHN1YnNjcmliZSB0byBQYXJ0cyAoVE8gQkUgSU1QUk9WRUQhKVxuXHRcdFx0XHQvKipcblx0XHRcdFx0ICogQWN0dWFsbHkgY3VycmVudCBtZXRob2QgaXMgc3Vic2NyaWJpbmcgdG8gZWFjaCBhbmQgZXZlcnkgcGFydFxuXHRcdFx0XHQgKiBhIGJldHRlciB3YXkgdG8gZG8gaXQgd291bGQgYmUgdG8gc3Vic2NyaWJlIHRvIHJvYm90c1xuXHRcdFx0XHQgKiBvbiBjb25kaXRpb24gdGhhdCByb2JvdHMgcHJvdmlkZXMgdGhlIGFkZXF1YXRlIHNpZ25hbHNcblx0XHRcdFx0ICovXG5cdFx0XHRcdGRlYnVnKCdTdWJzY3JpYmluZycpO1xuXHRcdFx0XHRyZXR1cm4gbmV3IFByb21pc2UgKCAocmVzb2x2ZSwgcmVqZWN0KSA9PiAge1xuXHRcdFx0XHRcdC8vLyBUT0RPIHN1YnNjcmlwdGlvblxuXHRcdFx0XHRcdHJlc29sdmUoKSAvLy8gVE9ET1xuXHRcdFx0XHRcdHRoaXMuc3Vic2NyaXB0aW9uID0gdGhpcy5zZWxlY3Rvci5zdWJzY3JpYmUoe1xuXHRcdFx0XHRcdFx0c2VydmljZTogXCJpZXFcIixcblx0XHRcdFx0XHRcdGZ1bmM6IG9wdGlvbnMuY3JpdGVyaWEudGltZS5zYW1wbGluZyxcblx0XHRcdFx0XHRcdGRhdGE6IHtkYXRhOiBvcHRpb25zfSwgLy8gVE9ETyA6IG5vIG9wdGlvbnMgZm9yIHNpZ25hbHMuLi5cblx0XHRcdFx0XHRcdG9iajp7XG5cdFx0XHRcdFx0XHRcdHBhdGg6ICcvZnIvcGFydG5lcmluZy9JZXEnLFxuXHRcdFx0XHRcdFx0XHRpbnRlcmZhY2U6IFwiZnIucGFydG5lcmluZy5JZXFcIlxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sIChkbmQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRkZWJ1ZygnU2lnbmFsOmVtaXREYXRhJyk7XG5cdFx0XHRcdFx0XHRkZWJ1ZyhkYXRhKVxuXHRcdFx0XHRcdFx0ZGF0YSA9IHRoaXMuX3BhcnNlR2V0TWFuYWdlZE9iamVjdHNEYXRhKGRhdGEpXG5cdFx0XHRcdFx0XHRkZWJ1ZyhkYXRhKVxuXHRcdFx0XHRcdFx0dGhpcy5lbWl0KCdkYXRhJywgZGF0YSk7XG5cblx0XHRcdFx0XHRcdHRoaXMucmVjb25uZWN0aW9uUGVyaW9kPTA7IC8vIHJlc2V0IHBlcmlvZCBvbiBzdWJzY3JpcHRpb24gcmVxdWVzdHNcblx0XHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblxuXHRcdC8vIFx0Ly8gUmVxdWVzdCBoaXN0b3J5IGRhdGEgYmVmb3JlIHN1YnNjcmliaW5nXG5cdFx0Ly8gXHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdC8vIFx0XHRzZXJ2aWNlOiBcImllcVwiLFxuXHRcdC8vIFx0XHRmdW5jOiBcIkRhdGFSZXF1ZXN0XCIsXG5cdFx0Ly8gXHRcdGRhdGE6IHtcblx0XHQvLyBcdFx0XHRkYXRhOiBKU09OLnN0cmluZ2lmeShvcHRpb25zKVxuXHRcdC8vIFx0XHR9LFxuXHRcdC8vIFx0XHRvYmo6e1xuXHRcdC8vIFx0XHRcdHBhdGg6ICcvZnIvcGFydG5lcmluZy9JZXEnLFxuXHRcdC8vIFx0XHRcdGludGVyZmFjZTogXCJmci5wYXJ0bmVyaW5nLkllcVwiXG5cdFx0Ly8gXHRcdH0sXG5cdFx0Ly8gXHR9LCAoZG5JZCwgZXJyLCBkYXRhU3RyaW5nKSA9PiB7XG5cdFx0Ly8gXHRcdGlmIChlcnIgIT0gbnVsbCkgIHtcblx0XHQvLyBcdFx0XHRyZWplY3QoZXJyKTtcblx0XHQvLyBcdFx0XHRyZXR1cm47XG5cdFx0Ly8gXHRcdH1cblx0XHQvLyBcdFx0aWYgKHRoaXMuc3RhdGUgPT09ICdzdG9wcGVkJykge1xuXHRcdC8vIFx0XHRcdHJlamVjdChuZXcgU3RvcENvbmRpdGlvbigpKTtcblx0XHQvLyBcdFx0fVxuXHRcdC8vIFx0XHRkZWJ1ZygnUmVxdWVzdDplbWl0RGF0YScpO1xuXHRcdC8vIFx0XHRsZXQgZGF0YSA9IEpTT04ucGFyc2UoZGF0YVN0cmluZyk7XG5cdFx0Ly8gXHRcdHRoaXMuZW1pdCgnZGF0YScsIGRhdGEpO1xuXHRcdC8vIFx0XHRyZXNvbHZlKCk7XG5cdFx0Ly8gXHR9KTtcblx0XHQvLyB9KVxuXHRcdC8vIFx0LnRoZW4oIF8gPT4ge1xuXHRcdC8vIFx0XHQvLyBzdWJzY3JpYmUgdG8gc2lnbmFsXG5cdFx0Ly8gXHRcdGRlYnVnKCdTdWJzY3JpYmluZycpO1xuXHRcdC8vIFx0XHRyZXR1cm4gbmV3IFByb21pc2UgKCAocmVzb2x2ZSwgcmVqZWN0KSA9PiAge1xuXHRcdC8vIFx0XHRcdHRoaXMuc3Vic2NyaXB0aW9uID0gdGhpcy5zZWxlY3Rvci5zdWJzY3JpYmUoe1xuXHRcdC8vIFx0XHRcdFx0c2VydmljZTogXCJpZXFcIixcblx0XHQvLyBcdFx0XHRcdGZ1bmM6IG9wdGlvbnMuY3JpdGVyaWEudGltZS5zYW1wbGluZyxcblx0XHQvLyBcdFx0XHRcdGRhdGE6IHtkYXRhOiBvcHRpb25zfSwgLy8gVE9ETyA6IG5vIG9wdGlvbnMgZm9yIHNpZ25hbHMuLi5cblx0XHQvLyBcdFx0XHRcdG9iajp7XG5cdFx0Ly8gXHRcdFx0XHRcdHBhdGg6ICcvZnIvcGFydG5lcmluZy9JZXEnLFxuXHRcdC8vIFx0XHRcdFx0XHRpbnRlcmZhY2U6IFwiZnIucGFydG5lcmluZy5JZXFcIlxuXHRcdC8vIFx0XHRcdFx0fVxuXHRcdC8vIFx0XHRcdH0sIChkbmQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdC8vIFx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0Ly8gXHRcdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdC8vIFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0Ly8gXHRcdFx0XHR9XG5cdFx0Ly8gXHRcdFx0XHRkZWJ1ZygnU2lnbmFsOmVtaXREYXRhJyk7XG5cdFx0Ly8gXHRcdFx0XHRkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcblx0XHQvLyBcdFx0XHRcdHRoaXMuZW1pdCgnZGF0YScsIGRhdGEpO1xuXG5cdFx0Ly8gXHRcdFx0XHR0aGlzLnJlY29ubmVjdGlvblBlcmlvZD0wOyAvLyByZXNldCBwZXJpb2Qgb24gc3Vic2NyaXB0aW9uIHJlcXVlc3RzXG5cdFx0Ly8gXHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0Ly8gXHRcdFx0fSlcblx0XHQvLyBcdFx0fSlcblx0XHQvLyBcdH0pXG5cdFx0XHQuY2F0Y2goIGVyciA9PiB7XG5cdFx0XHRcdC8vIHdhdGNoZXIgc3RvcHBlZCA6IGRvIG5vdGhpbmdcblx0XHRcdFx0aWYgKGVyci5uYW1lID09PSAnU3RvcENvbmRpdGlvbicpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gdHJ5IHRvIHJlc3RhcnQgbGF0ZXJcblx0XHRcdFx0ZGVidWdFcnJvcihlcnIpO1xuXHRcdFx0XHR0aGlzLl9jbG9zZVN1YnNjcmlwdGlvbnMoKTsgLy8gc2hvdWxkIG5vdCBiZSBuZWNlc3Nhcnlcblx0XHRcdFx0Ly8gaW5jcmVhc2UgZGVsYXkgYnkgMSBzZWNcblx0XHRcdFx0dGhpcy5yZWNvbm5lY3Rpb25QZXJpb2QgPSB0aGlzLnJlY29ubmVjdGlvblBlcmlvZCsxMDAwO1xuXHRcdFx0XHRpZiAodGhpcy5yZWNvbm5lY3Rpb25QZXJpb2QgPiB0aGlzLm1heFJlY29ubmVjdGlvblBlcmlvZCkge1xuXHRcdFx0XHRcdC8vIG1heCA1bWluXG5cdFx0XHRcdFx0dGhpcy5yZWNvbm5lY3Rpb25QZXJpb2QgPSB0aGlzLm1heFJlY29ubmVjdGlvblBlcmlvZDtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLndhdGNoVGVudGF0aXZlID0gc2V0VGltZW91dCggXyA9PiB7XG5cdFx0XHRcdFx0dGhpcy53YXRjaChvcHRpb25zKTtcblx0XHRcdFx0fSwgdGhpcy5yZWNvbm5lY3Rpb25QZXJpb2QpOyAvLyB0cnkgYWdhaW4gbGF0ZXJcblx0XHRcdH0pO1xuXG5cdH1cblxuXHQvKipcblx0ICogUGFyc2Ugb2JqZWN0TWFuYWdlciBpbnRyb3NwZWN0IGRhdGEgdG8gZmVlZCBiYWNrIHN0YXR1cyBtYW5hZ2VyXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIHJhdyBkYXRhIGZyb20gZ2V0TWFuYWdlZE9iamVjdHNcblx0ICogQHJldHVybiB7T2JqZWN0e1N0cmluZyxTdHJpbmcsQXJyYXkgb2YgQXJyYXkgb2YgUGFydEluZm99IHBhcnNlZERhdGFcblx0ICovXG5cdF9wYXJzZUdldE1hbmFnZWRPYmplY3RzRGF0YSAoZGF0YSkge1xuXHRcdGxldCBwYXJzZWREYXRhID0ge1xuXHRcdFx0ZGV2aWNlczoge31cblx0XHR9XG5cdFx0aWYgKGRhdGEgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIHBhcnNlZERhdGFcblx0XHR9XG5cblx0XHQvLyBGb3IgZWFjaCBvYmplY3QgcGF0aFxuXHRcdGZvciAobGV0IHBhdGggaW4gZGF0YSkge1xuXHRcdFx0bGV0IG9iaiA9IGRhdGFbcGF0aF1cblx0XHRcdGxldCBzcGxpdFBhdGggPSBwYXRoLnNwbGl0KCcvJylcblx0XHRcdGlmIChzcGxpdFBhdGgubGVuZ3RoID09PSA2KSB7XG5cdFx0XHRcdC8vIHdpdGggZGV2aWNlIHBhdGgsIHNwbGl0IHBhdGggaGFzIDYgaXRlbXNcblx0XHRcdFx0Zm9yIChsZXQgaWZhY2UgaW4gb2JqKSB7XG5cdFx0XHRcdFx0aWYgKGlmYWNlID09PSBcImZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90XCIpIHtcblx0XHRcdFx0XHRcdC8vIEludGVyZmFjZSBvZiB0aGUgZGV2aWNlIG9iamVjdHNcblx0XHRcdFx0XHRcdGxldCBkZXZpY2UgPSBvYmpbaWZhY2VdXG5cdFx0XHRcdFx0XHQvLyBGaW5kIHByb2R1Y3QgbmFtZSBhbmQgaWRcblx0XHRcdFx0XHRcdGxldCByb2JvdE5hbWUgPSBzcGxpdFBhdGhbNV0udG9Mb3dlckNhc2UoKVxuXHRcdFx0XHRcdFx0bGV0IHNlbERldmljZSA9IHBhcnNlZERhdGEuZGV2aWNlc1tyb2JvdE5hbWVdXG5cdFx0XHRcdFx0XHRpZiAoc2VsRGV2aWNlID09IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0c2VsRGV2aWNlID0ge1xuXHRcdFx0XHRcdFx0XHRcdHBhcnRzOiBbXVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHBhcnNlZERhdGEuZGV2aWNlc1tyb2JvdE5hbWVdID0gc2VsRGV2aWNlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRzZWxEZXZpY2Uucm9ib3ROYW1lID0gZGV2aWNlLlJvYm90TmFtZVxuXHRcdFx0XHRcdFx0c2VsRGV2aWNlLnJvYm90SWQgPSBkZXZpY2UuUm9ib3RJZFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChzcGxpdFBhdGgubGVuZ3RoID09PSA4KSB7XG5cdFx0XHRcdC8vIHdpdGggcGFydCBwYXRoLCBzcGxpdCBwYXRoIGhhcyA4IGl0ZW1zXG5cdFx0XHRcdGZvciAobGV0IGlmYWNlIGluIG9iaikge1xuXHRcdFx0XHRcdGlmIChpZmFjZSA9PT0gXCJmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0XCIpIHtcblx0XHRcdFx0XHRcdC8vIEludGVyZmFjZSBvZiB0aGUgcGFydCBvYmplY3RzXG5cdFx0XHRcdFx0XHRsZXQgcGFydCA9IG9ialtpZmFjZV1cblx0XHRcdFx0XHRcdC8vIEZpbmQgcHJvZHVjdCBuYW1lXG5cdFx0XHRcdFx0XHRsZXQgcm9ib3ROYW1lID0gc3BsaXRQYXRoWzVdLnRvTG93ZXJDYXNlKClcblx0XHRcdFx0XHRcdGxldCBzZWxEZXZpY2UgPSBwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lXVxuXHRcdFx0XHRcdFx0aWYgKHNlbERldmljZSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHNlbERldmljZSA9IHtcblx0XHRcdFx0XHRcdFx0XHRwYXJ0czogW11cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRwYXJzZWREYXRhLmRldmljZXNbcm9ib3ROYW1lXSA9IHNlbERldmljZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Ly8gQnVpbGQgcGFydCBhcnJheVxuXHRcdFx0XHRcdFx0Ly8gVE9ETyBvcHRpbWl6ZSBob3cgdGhlIGRhdGEgYXJlIHVzZWQgOlxuXHRcdFx0XHRcdFx0Ly8gYWN0dWFsbHkgY29udmVydGluZyBvYmplY3QgdG8gYXJyYXkgdGhlblxuXHRcdFx0XHRcdFx0Ly8gZnJvbSBhcnJheSB0byBvYmplY3QgYWdhaW4uLi5cblx0XHRcdFx0XHRcdGxldCBuZXdQYXJ0ID0gW11cblx0XHRcdFx0XHRcdG5ld1BhcnRbMF0gPSBwYXJ0LlBhcnRJZFxuXHRcdFx0XHRcdFx0bmV3UGFydFsxXSA9IHBhcnQuQ2F0ZWdvcnlcblx0XHRcdFx0XHRcdG5ld1BhcnRbMl0gPSBwYXJ0LlBhcnROYW1lXG5cdFx0XHRcdFx0XHRuZXdQYXJ0WzNdID0gXCJcIiAvLyBMYWJlbCBpcyB1bnVzZWQgaW4gcHJhY3RpY2Vcblx0XHRcdFx0XHRcdG5ld1BhcnRbNF0gPSBwYXJ0LlRpbWVcblx0XHRcdFx0XHRcdG5ld1BhcnRbNV0gPSBwYXJ0LkNvZGVcblx0XHRcdFx0XHRcdG5ld1BhcnRbNl0gPSBwYXJ0LkNvZGVSZWZcblx0XHRcdFx0XHRcdG5ld1BhcnRbN10gPSBwYXJ0Lk1zZ1xuXHRcdFx0XHRcdFx0bmV3UGFydFs4XSA9IHBhcnQuQ3JpdExldmVsXG5cdFx0XHRcdFx0XHRuZXdQYXJ0WzldID0gXCJcIiAvLyBEZXNjcmlwdGlvbiBpcyB1bnVzZWQgaW4gcHJhY3RpY2VcblxuXHRcdFx0XHRcdFx0c2VsRGV2aWNlLnBhcnRzLnB1c2gobmV3UGFydClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVidWdFcnJvcihcIlVuZGVmaW5lZCBwYXRoIGZvcm1hdFwiKVxuXHRcdFx0fVxuXHRcdH1cblxuXG5cdFx0Ly8gUmVhZCBSb2JvdCBuYW1lIGFuZCByb2JvdCBJZFxuXHRcdC8vIFJlYWQgUGFydCBkYXRhXG5cdFx0cmV0dXJuIHBhcnNlZERhdGFcblx0fVxuXG5cdC8vIENsb3NlIGFsbCBzdWJzY3JpcHRpb25zIGlmIGFueVxuXHRfY2xvc2VTdWJzY3JpcHRpb25zICgpIHtcblx0XHRkZWJ1ZygnSW4gY2xvc2VTdWJzY3JpcHRpb24nKTtcblx0XHRmb3IodmFyIGkgaW4gdGhpcy5zdWJzY3JpcHRpb25zKSB7XG5cdFx0XHR0aGlzLnN1YnNjcmlwdGlvbnNbaV0uY2xvc2UoKTtcblx0XHR9XG5cdFx0dGhpcy5zdWJzY3JpcHRpb25zID0gW107XG5cdH1cblxuXHRzdG9wICgpIHtcblx0XHRkZWJ1ZygnSW4gc3RvcCcpO1xuXHRcdHRoaXMuc3RhdGUgPSAnc3RvcHBlZCc7XG5cdFx0aWYgKHRoaXMud2F0Y2hUZW50YXRpdmUgIT0gbnVsbCkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMud2F0Y2hUZW50YXRpdmUpO1xuXHRcdH1cblx0XHR0aGlzLl9jbG9zZVN1YnNjcmlwdGlvbnMoKTtcblx0XHR0aGlzLmVtaXQoJ3N0b3AnKTtcblx0XHR0aGlzLnJlbW92ZUFsbExpc3RlbmVycygpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gV2F0Y2hlcjtcbiJdfQ==
