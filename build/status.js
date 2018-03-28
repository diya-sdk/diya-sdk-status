(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
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

},{"./support/isBuffer":3,"_process":1,"inherits":2}],5:[function(require,module,exports){
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

		debug: function debug(message) {
			var _console;

			for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
				args[_key - 1] = arguments[_key];
			}

			if (DEBUG) (_console = console).log.apply(_console, [message].concat(args));
		},

		warn: function warn(message) {
			if (DEBUG) console.warn(message);
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
		this.subscriptions = [];

		/** model of robot : available parts and status **/
		this.robotModel = [];
		this._robotModelInit = false;
		this._partReferenceMap = [];

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
 	 * Get all statuses within 4 days
  * @param {*} robot_object 
  * @param {function} callback		return callback(-1 if not found/data otherwise)
  */
	Status.prototype._getAndUpdateMultidayStatuses = function (robot_objects, callback) {
		var _this = this;

		Logger.debug('Status.getInitialStatus');
		robot_objects.forEach(function (object) {
			if (object.RobotId == null || object.RobotName == null) {
				Logger.warn('Multiday status request error: both RobotId and RobotName should be not null: ' + object.RobotId + ', ' + object.RobotName);
				return;
			}
			var req = {
				service: "status",
				func: "GetMultidayStatuses",
				obj: {
					interface: 'fr.partnering.Status',
					path: "/fr/partnering/Status"
				},
				data: {
					robot_names: [object.RobotName]
				}
			};
			var fn = function fn(peerId, err, data) {
				if (err != null) {
					if (typeof callback === 'function') callback(-1);
					throw new Error(err);
				}
				// Update robotModel variable
				Logger.debug('Received multiday statuses of robot', object.RobotId, object.RobotName, data);
				_this._getRobotModelFromRecv2(data, object.RobotId, object.RobotName);
				if (typeof callback === 'function') {
					callback(_this.robotModel);
				}
			};
			Logger.debug('Requesting multiday statuses of robot:', object.RobotId, object.RobotName);
			_this.selector.request(req, fn);
		});
	};

	/**
  * Get 'Parts' reference map to reduce status payload. Duplicated contents in status are stored in the map.
  */
	Status.prototype._getPartReferenceMap = function () {
		var _this2 = this;

		if (this._partReferenceMap == null || this._partReferenceMap.length == 0) {
			return new Promise(function (resolve, reject) {
				_this2.selector.request({
					service: 'Status',
					func: 'GetPartReferenceMap',
					obj: {
						interface: 'fr.partnering.Status',
						path: '/fr/partnering/Status'
					}
				}, function (peerId, err, data) {
					Logger.debug('PartReferenceMap, err', data, err);
					if (data == null) {
						data = [];
					}
					_this2._partReferenceMap = data;
					resolve(); // returns a map of partid to its properties
				});
			});
		}
		Logger.debug('PartReferenceMap already exists, no need to request. Number of parts:', this._partReferenceMap.length);
	};

	/**
  * Get 'StatusEvts' reference map to reduce status payload. Duplicated contents in status are stored in the map.
  */
	Status.prototype._getStatusEvtReferenceMap = function () {
		var _this3 = this;

		if (this._statusEvtReferenceMap == null || this._statusEvtReferenceMap.length == 0) {
			return new Promise(function (resolve, reject) {
				_this3.selector.request({
					service: 'Status',
					func: 'GetStatusEvtReferenceMap',
					obj: {
						interface: 'fr.partnering.Status',
						path: '/fr/partnering/Status'
					}
				}, function (peerId, err, data) {
					Logger.debug('StatusEvtReferenceMap, err', data, err);
					if (data == null) {
						data = [];
					}
					_this3._statusEvtReferenceMap = data;
					resolve(); // returns a map of partid to its properties
				});
			});
		}
		Logger.debug('StatusEvtReferenceMap already exists, no need to request. Number of parts:', this._statusEvtReferenceMap.length);
	};

	/**
  * Query for initial statuses
  * Subscribe to error/status updates
  */
	Status.prototype.watch = function (robotNames, callback) {
		var _this4 = this;

		Logger.debug('Status.watch: robotNames', robotNames);

		this.selector.setMaxListeners(0);
		this.selector._connection.setMaxListeners(0);

		// Promise to retrieve list of paired neighbors, i.e. all neighbor robots in the same mesh network
		var getNeighbors = new Promise(function (resolve, reject) {
			_this4.selector.request({
				service: 'DiyaNode',
				func: 'ListNeighbors',
				obj: {
					interface: 'fr.partnering.DiyaNode.MeshNetwork',
					path: '/fr/partnering/DiyaNode/MeshNetwork'
				}
			}, function (peerId, err, neighbors) {
				Logger.debug('neighbors, err', neighbors, err);
				if (err != null) {
					reject(err);
				}
				// This only returns the list of physical devices paired into the mesh network, the diya-server instance is not already included in the list
				if (neighbors == null) {
					neighbors = [];
				}
				resolve(neighbors); // returns a array of neighbor object, each object is an array of [robot-name, address, bool]
			});
		});

		// Promise to retrieve all objects (robots, parts) exposed in DBus by diya-node-status
		var getParts = new Promise(function (resolve, reject) {
			_this4.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager'
				}
			}, function (peerId, err, objData) {
				// get all object paths, interfaces and properties children of Status
				if (err != null || objData == null) {
					reject(err);
				}
				Logger.debug('ManagedParts', objData);
				resolve(objData); // returns a map that links the object path to its corresponding interface
			});
		});

		var robotIface = 'fr.partnering.Status.Robot';
		var partIface = 'fr.partnering.Status.Part';

		// js objects of robots and parts
		var robots = []; // list of robot objects
		var parts = []; // list of part object
		var meshedRobotNames = []; // list of names of robots and diya-server in the mesh network

		// Retrieve reference map of keys and values in order to reduce payload for status requests
		return Promise.try(function (_) {
			return _this4._getPartReferenceMap();
		}).then(function (_) {
			return _this4._getStatusEvtReferenceMap();
		}).then(function (_) {
			return getNeighbors;
		}).then(function (ret) {
			if (ret == null || !Array.isArray(ret)) {
				meshedRobotNames = [];
			}
			var hostname = _this4.selector._connection._self;
			meshedRobotNames = ret.map(function (r) {
				return r[0];
			}); // we only keep the robot names
			if (!meshedRobotNames.includes(hostname)) {
				meshedRobotNames.push(hostname); // add hostname, i.e. the diya-server, which is not in the list of neighbors
			}
		}).then(function (_) {
			return getParts;
		}).then(function (ret) {
			for (var objectPath in ret) {
				// the object obtained from the object path
				var object = ret[objectPath];

				// if the return object is of a robot in the list of neighbors, or of the diya-server, retrieve all ofits relevant statuses
				Logger.debug('Object', object);
				Logger.debug('robotIface', robotIface);

				if (object.hasOwnProperty(robotIface)) {
					robots.push(object[robotIface]);
				}

				// if the return object is of a part, listen to signal StatusChanged of the part
				if (object.hasOwnProperty(partIface)) {
					parts.push(object[partIface]);
				}
			}

			Logger.debug('getParts', ret);
			Logger.debug('robots', robots);

			// filer and keep the diya-server and the robots that are only in the same mesh networks
			robots = robots.filter(function (robot) {
				return meshedRobotNames.includes(robot.RobotName);
			}); // only keeps robots that are neighbors (i.e. in the same mesh network)

			// TODO - filter parts that belongs to the filtered robots
		}).then(function (_) {
			// Retrieve initial statuses from the filtered robots
			Logger.debug('Robots and diya-server in the mesh network:', robots);
			return _this4._getAndUpdateMultidayStatuses(robots, callback);
		}).then(function (_) {
			// Listen to StatusChange from the parts belonging to the filtered robots
			Logger.debug('Parts belonging to the filtered robots:', parts);

			// TODO
		});

		if (true) return;

		// // Subscribe to signals

		// let sendData = [];
		// let robotIds = [];
		// return Promise.try(_ => {
		// 	let req = this.selector.request({
		// 		service: 'status',
		// 		func: 'GetManagedObjects',
		// 		obj: {
		// 			interface: 'org.freedesktop.DBus.ObjectManager',
		// 		}
		// 	}, (peerId, err, objData) => { // get all object paths, interfaces and properties children of Status
		// 		let robotName = '';
		// 		let robotId = 1;

		// 		Logger.debug(`Status.GetManagedObjects: objData = `)
		// 		Logger.debug(objData)

		// 		for (let objectPath in objData) {
		// 			if (objData[objectPath]['fr.partnering.Status.Robot'] != null) {
		// 				robotName = objData[objectPath]['fr.partnering.Status.Robot'].RobotName;
		// 				robotId = objData[objectPath]['fr.partnering.Status.Robot'].RobotId;
		// 				robotIds[robotName] = robotId;
		// 				this._getInitialStatus(robotId, robotName, function (model) {
		// 					callback(model, peerId);
		// 				})
		// 			}
		// 			if (objData[objectPath]['fr.partnering.Status.Part'] != null) {
		// 				let subs = this.selector.subscribe({// subscribes to status changes for all parts
		// 					service: 'status',
		// 					func: 'StatusChanged',
		// 					obj: {
		// 						interface: 'fr.partnering.Status.Part',
		// 						path: objectPath
		// 					},
		// 					data: robotNames
		// 				}, (peerId, err, data) => {
		// 					if (err != null) {
		// 						Logger.error("StatusSubscribe:" + err);
		// 					} else {
		// 						Logger.debug(`StatusChanged is called`)
		// 						sendData[0] = data;
		// 						this._getRobotModelFromRecv2(sendData, robotId, robotName);
		// 						if (typeof callback === 'function') {
		// 							callback(this.robotModel, peerId);
		// 						}
		// 					}
		// 				});
		// 				this.subscriptions.push(subs);
		// 			}
		// 		}
		// 	})
		// }).catch(err => {
		// 	Logger.error(err);
		// })
	};

	/**
  * Close all subscriptions
  */
	Status.prototype.closeSubscriptions = function () {
		for (var i in this.subscriptions) {
			this.subscriptions[i].close();
		}
		this.subscriptions = [];
		this.robotModel = [];
	};

	/**
  * Get data given dataConfig.
  * @param {func} callback : called after update
  * TODO USE PROMISE
  */
	Status.prototype.getData = function (callback, dataConfig) {
		var _this5 = this;

		var dataModel = {};
		return Promise.try(function (_) {
			if (dataConfig != null) _this5.DataConfig(dataConfig);
			// console.log("Request: "+JSON.stringify(dataConfig));
			_this5.selector.request({
				service: "status",
				func: "DataRequest",
				data: {
					type: "splReq",
					dataConfig: _this5.dataConfig
				}
			}, function (dnId, err, data) {
				if (err != null) {
					Logger.error("[" + _this5.dataConfig.sensors + "] Recv err: " + JSON.stringify(err));
					return;
				}
				if (data.header.error != null) {
					// TODO : check/use err status and adapt behavior accordingly
					Logger.error("UpdateData:\n" + JSON.stringify(data.header.reqConfig));
					Logger.error("Data request failed (" + data.header.error.st + "): " + data.header.error.msg);
					return;
				}
				//Logger.log(JSON.stringify(this.dataModel));
				dataModel = _this5._getDataModelFromRecv(data);

				Logger.log(_this5.getDataModel());
				callback = callback.bind(_this5); // bind callback with Status
				callback(dataModel); // callback func
			});
		}).catch(function (err) {
			Logger.error(err);
		});
	};

	/**
  * Update internal robot model with received data (version 2)
  * @param  {Object} data data received from DiyaNode by websocket
  * @return {[type]}		[description]
  */
	Status.prototype._getRobotModelFromRecv2 = function (data, robotId, robotName) {
		var _this6 = this;

		if (this._partReferenceMap == null) {
			this._partReferenceMap = [];
		}
		if (this._statusEvtReferenceMap == null) {
			this._statusEvtReferenceMap = [];
		}
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
			var time = d[1];
			var code = d[2];

			// map the hash value to the status event values
			var hash = d[3];
			var statusEvtReference = _this6._statusEvtReferenceMap[hash];
			if (statusEvtReference == null) {
				Logger.warn('StatusEvtReference finds no map for hash key ' + hash);
			}
			var codeRef = statusEvtReference == null ? null : statusEvtReference[0];
			var msg = statusEvtReference == null ? null : statusEvtReference[1];
			var critLevel = statusEvtReference == null ? null : statusEvtReference[2];

			// map the partId to the part reference values
			var partReference = _this6._partReferenceMap[partId];
			if (partReference == null) {
				Logger.warn('PartReference finds no map for partId ' + partId);
			}
			var partName = partReference == null ? null : partReference[0];
			var label = partReference == null ? null : partReference[1];
			var category = partReference == null ? null : partReference[2];

			if (rParts[partId] == null) {
				rParts[partId] = {};
			}
			/* update part category */
			rParts[partId].category = category;
			/* update part name */
			rParts[partId].name = partName == null ? null : partName.toLowerCase();
			/* update part label */
			rParts[partId].label = label;

			/* update error */
			/** update errorList **/
			if (rParts[partId].errorList == null) rParts[partId].errorList = {};

			if (rParts[partId].errorList[codeRef] == null) rParts[partId].errorList[codeRef] = {
				msg: msg,
				critLevel: critLevel,
				description: null
			};
			var evts_tmp = {
				time: _this6._coder.from(time),
				code: _this6._coder.from(code),
				codeRef: _this6._coder.from(codeRef)
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
		var _this7 = this;

		return Promise.try(function (_) {
			var objectPath = "/fr/partnering/Status/Robots/" + _this7.splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
			_this7.request({
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
			}, function (peerId, err, data) {
				if (err != null) {
					if (typeof callback === 'function') callback(false);
				} else {
					if (typeof callback === 'function') callback(true);
				}
			});
		}).catch(function (err) {
			Logger.error(err);
		});
	};

	/**
  * Get one status
  * @param robotName to get status
  * @param partName 	to get status
  * @param callback		return callback(-1 if not found/data otherwise)
  * @param _full 	more data about status
  */
	Status.prototype.getStatus = function (robotName, partName, callback /*, _full*/) {
		var _this8 = this;

		var sendData = [];
		return Promise.try(function (_) {
			var req = _this8.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager'
				}
			}, function (peerId, err, objData) {

				var objectPathRobot = "/fr/partnering/Status/Robots/" + _this8.splitAndCamelCase(robotName, "-");
				var objectPathPart = "/fr/partnering/Status/Robots/" + _this8.splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
				var robotId = objData[objectPathRobot]['fr.partnering.Status.Robot'].RobotId;
				_this8.selector.request({
					service: "status",
					func: "GetPart",
					obj: {
						interface: 'fr.partnering.Status.Part',
						path: objectPathPart
					}
				}, function (peerId, err, data) {
					sendData.push(data);
					_this8._getRobotModelFromRecv2(sendData, robotId, robotName);
					if (err != null) {
						if (typeof callback === 'function') callback(-1);
					} else {
						if (typeof callback === 'function') callback(_this8.robotModel);
					}
				});
			});
		}).catch(function (err) {
			Logger.error(err);
		});
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

},{"bluebird":undefined,"util":4}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJzcmMvc3RhdHVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQzFrQkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JBOzs7Ozs7Ozs7Ozs7QUFZQSxDQUFDLFlBQVU7O0FBRVYsS0FBSSxZQUFZLEVBQUUsT0FBTyxNQUFQLEtBQWtCLFdBQXBCLENBQWhCO0FBQ0EsS0FBRyxDQUFDLFNBQUosRUFBZTtBQUFFLE1BQUksVUFBVSxRQUFRLFVBQVIsQ0FBZDtBQUFvQyxFQUFyRCxNQUNLO0FBQUUsTUFBSSxVQUFVLE9BQU8s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Q0EsbUJBQWlCLE9BQWpCLENBQXlCLGVBQU87QUFDL0IscUJBQWtCLElBQUksTUFBSixDQUFXLENBQVgsRUFBYyxXQUFkLEtBQThCLElBQUksU0FBSixDQUFjLENBQWQsQ0FBaEQ7QUFDQSxHQUZEO0FBR0EsU0FBTyxjQUFQO0FBQ0EsRUFQRDtBQVNBLENBN3VCRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9cmV0dXJuIGV9KSgpIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgOiBQYXJ0bmVyaW5nIDMuMCAoMjAwNy0yMDE2KVxuICogQXV0aG9yIDogU3lsdmFpbiBNYWjDqSA8c3lsdmFpbi5tYWhlQHBhcnRuZXJpbmcuZnI+XG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgZGl5YS1zZGsuXG4gKlxuICogZGl5YS1zZGsgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogZGl5YS1zZGsgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggZGl5YS1zZGsuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuXG5cblxuXG4vKiBtYXlhLWNsaWVudFxuICogQ29weXJpZ2h0IChjKSAyMDE0LCBQYXJ0bmVyaW5nIFJvYm90aWNzLCBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVGhpcyBsaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vclxuICogbW9kaWZ5IGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBhcyBwdWJsaXNoZWQgYnkgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbjsgdmVyc2lvblxuICpcdDMuMCBvZiB0aGUgTGljZW5zZS4gVGhpcyBsaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlXG4gKiB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlblxuICogdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUlxuICogUFVSUE9TRS4gU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIGxpYnJhcnkuXG4gKi9cbihmdW5jdGlvbigpe1xuXG5cdHZhciBpc0Jyb3dzZXIgPSAhKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKTtcblx0aWYoIWlzQnJvd3NlcikgeyB2YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7IH1cblx0ZWxzZSB7IHZhciBQcm9taXNlID0gd2luZG93LlByb21pc2U7IH1cblx0dmFyIERpeWFTZWxlY3RvciA9IGQxLkRpeWFTZWxlY3Rvcjtcblx0dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cblxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQvLy8vLy8vLy8vLy8vLy8vLy8vIExvZ2dpbmcgdXRpbGl0eSBtZXRob2RzIC8vLy8vLy8vLy8vLy8vLy8vL1xuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cdHZhciBERUJVRyA9IHRydWU7XG5cdHZhciBMb2dnZXIgPSB7XG5cdFx0bG9nOiBmdW5jdGlvbihtZXNzYWdlKXtcblx0XHRcdGlmKERFQlVHKSBjb25zb2xlLmxvZyhtZXNzYWdlKTtcblx0XHR9LFxuXG5cdFx0ZGVidWc6IGZ1bmN0aW9uKG1lc3NhZ2UsIC4uLmFyZ3Mpe1xuXHRcdFx0aWYoREVCVUcpIGNvbnNvbGUubG9nKG1lc3NhZ2UsIC4uLmFyZ3MpO1xuXHRcdH0sXG5cblx0XHR3YXJuOiBmdW5jdGlvbihtZXNzYWdlKXtcblx0XHRcdGlmKERFQlVHKSBjb25zb2xlLndhcm4obWVzc2FnZSk7XG5cdFx0fSxcblxuXHRcdGVycm9yOiBmdW5jdGlvbihtZXNzYWdlKXtcblx0XHRcdGlmKERFQlVHKSBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICpcdGNhbGxiYWNrIDogZnVuY3Rpb24gY2FsbGVkIGFmdGVyIG1vZGVsIHVwZGF0ZWRcblx0ICogKi9cblx0ZnVuY3Rpb24gU3RhdHVzKHNlbGVjdG9yKXtcblx0XHR0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3I7XG5cdFx0dGhpcy5fY29kZXIgPSBzZWxlY3Rvci5lbmNvZGUoKTtcblx0XHR0aGlzLnN1YnNjcmlwdGlvbnMgPSBbXTtcblxuXHRcdC8qKiBtb2RlbCBvZiByb2JvdCA6IGF2YWlsYWJsZSBwYXJ0cyBhbmQgc3RhdHVzICoqL1xuXHRcdHRoaXMucm9ib3RNb2RlbCA9IFtdO1xuXHRcdHRoaXMuX3JvYm90TW9kZWxJbml0ID0gZmFsc2U7XG5cdFx0dGhpcy5fcGFydFJlZmVyZW5jZU1hcCA9IFtdO1xuXG5cdFx0LyoqKiBzdHJ1Y3R1cmUgb2YgZGF0YSBjb25maWcgKioqXG5cdFx0XHQgY3JpdGVyaWEgOlxuXHRcdFx0ICAgdGltZTogYWxsIDMgdGltZSBjcml0ZXJpYSBzaG91bGQgbm90IGJlIGRlZmluZWQgYXQgdGhlIHNhbWUgdGltZS4gKHJhbmdlIHdvdWxkIGJlIGdpdmVuIHVwKVxuXHRcdFx0ICAgICBiZWc6IHtbbnVsbF0sdGltZX0gKG51bGwgbWVhbnMgbW9zdCByZWNlbnQpIC8vIHN0b3JlZCBhIFVUQyBpbiBtcyAobnVtKVxuXHRcdFx0ICAgICBlbmQ6IHtbbnVsbF0sIHRpbWV9IChudWxsIG1lYW5zIG1vc3Qgb2xkZXN0KSAvLyBzdG9yZWQgYXMgVVRDIGluIG1zIChudW0pXG5cdFx0XHQgICAgIHJhbmdlOiB7W251bGxdLCB0aW1lfSAocmFuZ2Ugb2YgdGltZShwb3NpdGl2ZSkgKSAvLyBpbiBzIChudW0pXG5cdFx0XHQgICByb2JvdDoge0FycmF5T2YgSUQgb3IgW1wiYWxsXCJdfVxuXHRcdFx0ICAgcGxhY2U6IHtBcnJheU9mIElEIG9yIFtcImFsbFwiXX1cblx0XHRcdCBvcGVyYXRvcjoge1tsYXN0XSwgbWF4LCBtb3ksIHNkfSAtKCBtYXliZSBtb3kgc2hvdWxkIGJlIGRlZmF1bHRcblx0XHRcdCAuLi5cblxuXHRcdFx0IHBhcnRzIDoge1tudWxsXSBvciBBcnJheU9mIFBhcnRzSWR9IHRvIGdldCBlcnJvcnNcblx0XHRcdCBzdGF0dXMgOiB7W251bGxdIG9yIEFycmF5T2YgU3RhdHVzTmFtZX0gdG8gZ2V0IHN0YXR1c1xuXG5cdFx0XHQgc2FtcGxpbmc6IHtbbnVsbF0gb3IgaW50fVxuXHRcdCovXG5cdFx0dGhpcy5kYXRhQ29uZmlnID0ge1xuXHRcdFx0Y3JpdGVyaWE6IHtcblx0XHRcdFx0dGltZToge1xuXHRcdFx0XHRcdGJlZzogbnVsbCxcblx0XHRcdFx0XHRlbmQ6IG51bGwsXG5cdFx0XHRcdFx0cmFuZ2U6IG51bGwgLy8gaW4gc1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRyb2JvdDogbnVsbFxuXHRcdFx0fSxcblx0XHRcdG9wZXJhdG9yOiAnbGFzdCcsXG5cdFx0XHRwYXJ0czogbnVsbCxcblx0XHRcdHN0YXR1czogbnVsbFxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblx0LyoqXG5cdCAqIEdldCByb2JvdE1vZGVsIDpcblx0ICoge1xuXHQgKiAgcGFydHM6IHtcblx0ICpcdFx0XCJwYXJ0WFhcIjoge1xuXHQgKiBcdFx0XHQgZXJyb3JzRGVzY3I6IHsgZW5jb3VudGVyZWQgZXJyb3JzIGluZGV4ZWQgYnkgZXJyb3JJZHM+MCB9XG5cdCAqXHRcdFx0XHQ+IENvbmZpZyBvZiBlcnJvcnMgOlxuXHQgKlx0XHRcdFx0XHRjcml0TGV2ZWw6IEZMT0FULCAvLyBjb3VsZCBiZSBpbnQuLi5cblx0ICogXHRcdFx0XHRcdG1zZzogU1RSSU5HLFxuXHQgKlx0XHRcdFx0XHRzdG9wU2VydmljZUlkOiBTVFJJTkcsXG5cdCAqXHRcdFx0XHRcdHJ1blNjcmlwdDogU2VxdWVsaXplLlNUUklORyxcblx0ICpcdFx0XHRcdFx0bWlzc2lvbk1hc2s6IFNlcXVlbGl6ZS5JTlRFR0VSLFxuXHQgKlx0XHRcdFx0XHRydW5MZXZlbDogU2VxdWVsaXplLklOVEVHRVJcblx0ICpcdFx0XHRlcnJvcjpbRkxPQVQsIC4uLl0sIC8vIGNvdWxkIGJlIGludC4uLlxuXHQgKlx0XHRcdHRpbWU6W0ZMT0FULCAuLi5dLFxuXHQgKlx0XHRcdHJvYm90OltGTE9BVCwgLi4uXSxcblx0ICpcdFx0XHQvLy8gcGxhY2U6W0ZMT0FULCAuLi5dLCBub3QgaW1wbGVtZW50ZWQgeWV0XG5cdCAqXHRcdH0sXG5cdCAqXHQgXHQuLi4gKFwiUGFydFlZXCIpXG5cdCAqICB9LFxuXHQgKiAgc3RhdHVzOiB7XG5cdCAqXHRcdFwic3RhdHVzWFhcIjoge1xuXHQgKlx0XHRcdFx0ZGF0YTpbRkxPQVQsIC4uLl0sIC8vIGNvdWxkIGJlIGludC4uLlxuXHQgKlx0XHRcdFx0dGltZTpbRkxPQVQsIC4uLl0sXG5cdCAqXHRcdFx0XHRyb2JvdDpbRkxPQVQsIC4uLl0sXG5cdCAqXHRcdFx0XHQvLy8gcGxhY2U6W0ZMT0FULCAuLi5dLCBub3QgaW1wbGVtZW50ZWQgeWV0XG5cdCAqXHRcdFx0XHRyYW5nZTogW0ZMT0FULCBGTE9BVF0sXG5cdCAqXHRcdFx0XHRsYWJlbDogc3RyaW5nXG5cdCAqXHRcdFx0fSxcblx0ICpcdCBcdC4uLiAoXCJTdGF0dXNZWVwiKVxuXHQgKiAgfVxuXHQgKiB9XG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmdldFJvYm90TW9kZWwgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLnJvYm90TW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhQ29uZmlnIGNvbmZpZyBmb3IgZGF0YSByZXF1ZXN0XG5cdCAqIGlmIGRhdGFDb25maWcgaXMgZGVmaW5lIDogc2V0IGFuZCByZXR1cm4gdGhpc1xuXHQgKlx0IEByZXR1cm4ge1N0YXR1c30gdGhpc1xuXHQgKiBlbHNlXG5cdCAqXHQgQHJldHVybiB7T2JqZWN0fSBjdXJyZW50IGRhdGFDb25maWdcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YUNvbmZpZyA9IGZ1bmN0aW9uKG5ld0RhdGFDb25maWcpe1xuXHRcdGlmKG5ld0RhdGFDb25maWcpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZz1uZXdEYXRhQ29uZmlnO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB0aGlzLmRhdGFDb25maWc7XG5cdH07XG5cdC8qKlxuXHQgKiBUTyBCRSBJTVBMRU1FTlRFRCA6IG9wZXJhdG9yIG1hbmFnZW1lbnQgaW4gRE4tU3RhdHVzXG5cdCAqIEBwYXJhbSAge1N0cmluZ31cdCBuZXdPcGVyYXRvciA6IHtbbGFzdF0sIG1heCwgbW95LCBzZH1cblx0ICogQHJldHVybiB7U3RhdHVzfSB0aGlzIC0gY2hhaW5hYmxlXG5cdCAqIFNldCBvcGVyYXRvciBjcml0ZXJpYS5cblx0ICogRGVwZW5kcyBvbiBuZXdPcGVyYXRvclxuXHQgKlx0QHBhcmFtIHtTdHJpbmd9IG5ld09wZXJhdG9yXG5cdCAqXHRAcmV0dXJuIHRoaXNcblx0ICogR2V0IG9wZXJhdG9yIGNyaXRlcmlhLlxuXHQgKlx0QHJldHVybiB7U3RyaW5nfSBvcGVyYXRvclxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5EYXRhT3BlcmF0b3IgPSBmdW5jdGlvbihuZXdPcGVyYXRvcil7XG5cdFx0aWYobmV3T3BlcmF0b3IpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5vcGVyYXRvciA9IG5ld09wZXJhdG9yO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB0aGlzLmRhdGFDb25maWcub3BlcmF0b3I7XG5cdH07XG5cdC8qKlxuXHQgKiBEZXBlbmRzIG9uIG51bVNhbXBsZXNcblx0ICogQHBhcmFtIHtpbnR9IG51bWJlciBvZiBzYW1wbGVzIGluIGRhdGFNb2RlbFxuXHQgKiBpZiBkZWZpbmVkIDogc2V0IG51bWJlciBvZiBzYW1wbGVzXG5cdCAqXHRAcmV0dXJuIHtTdGF0dXN9IHRoaXNcblx0ICogZWxzZVxuXHQgKlx0QHJldHVybiB7aW50fSBudW1iZXIgb2Ygc2FtcGxlc1xuXHQgKiovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YVNhbXBsaW5nID0gZnVuY3Rpb24obnVtU2FtcGxlcyl7XG5cdFx0aWYobnVtU2FtcGxlcykge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLnNhbXBsaW5nID0gbnVtU2FtcGxlcztcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gdGhpcy5kYXRhQ29uZmlnLnNhbXBsaW5nO1xuXHR9O1xuXHQvKipcblx0ICogU2V0IG9yIGdldCBkYXRhIHRpbWUgY3JpdGVyaWEgYmVnIGFuZCBlbmQuXG5cdCAqIElmIHBhcmFtIGRlZmluZWRcblx0ICpcdEBwYXJhbSB7RGF0ZX0gbmV3VGltZUJlZyAvLyBtYXkgYmUgbnVsbFxuXHQgKlx0QHBhcmFtIHtEYXRlfSBuZXdUaW1lRW5kIC8vIG1heSBiZSBudWxsXG5cdCAqXHRAcmV0dXJuIHtTdGF0dXN9IHRoaXNcblx0ICogSWYgbm8gcGFyYW0gZGVmaW5lZDpcblx0ICpcdEByZXR1cm4ge09iamVjdH0gVGltZSBvYmplY3Q6IGZpZWxkcyBiZWcgYW5kIGVuZC5cblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YVRpbWUgPSBmdW5jdGlvbihuZXdUaW1lQmVnLG5ld1RpbWVFbmQsIG5ld1JhbmdlKXtcblx0XHRpZihuZXdUaW1lQmVnIHx8IG5ld1RpbWVFbmQgfHwgbmV3UmFuZ2UpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS50aW1lLmJlZyA9IG5ld1RpbWVCZWcuZ2V0VGltZSgpO1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUuZW5kID0gbmV3VGltZUVuZC5nZXRUaW1lKCk7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5yYW5nZSA9IG5ld1JhbmdlO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGJlZzogbmV3IERhdGUodGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUuYmVnKSxcblx0XHRcdFx0ZW5kOiBuZXcgRGF0ZSh0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5lbmQpLFxuXHRcdFx0XHRyYW5nZTogbmV3IERhdGUodGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUucmFuZ2UpXG5cdFx0XHR9O1xuXHR9O1xuXHQvKipcblx0ICogRGVwZW5kcyBvbiByb2JvdElkc1xuXHQgKiBTZXQgcm9ib3QgY3JpdGVyaWEuXG5cdCAqXHRAcGFyYW0ge0FycmF5W0ludF19IHJvYm90SWRzIGxpc3Qgb2Ygcm9ib3QgSWRzXG5cdCAqIEdldCByb2JvdCBjcml0ZXJpYS5cblx0ICpcdEByZXR1cm4ge0FycmF5W0ludF19IGxpc3Qgb2Ygcm9ib3QgSWRzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFSb2JvdElkcyA9IGZ1bmN0aW9uKHJvYm90SWRzKXtcblx0XHRpZihyb2JvdElkcykge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnJvYm90ID0gcm9ib3RJZHM7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS5yb2JvdDtcblx0fTtcblx0LyoqXG5cdCAqIERlcGVuZHMgb24gcGxhY2VJZHMgLy8gbm90IHJlbGV2YW50Pywgbm90IGltcGxlbWVudGVkIHlldFxuXHQgKiBTZXQgcGxhY2UgY3JpdGVyaWEuXG5cdCAqXHRAcGFyYW0ge0FycmF5W0ludF19IHBsYWNlSWRzIGxpc3Qgb2YgcGxhY2UgSWRzXG5cdCAqIEdldCBwbGFjZSBjcml0ZXJpYS5cblx0ICpcdEByZXR1cm4ge0FycmF5W0ludF19IGxpc3Qgb2YgcGxhY2UgSWRzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFQbGFjZUlkcyA9IGZ1bmN0aW9uKHBsYWNlSWRzKXtcblx0XHRpZihwbGFjZUlkcykge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnBsYWNlSWQgPSBwbGFjZUlkcztcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gdGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnBsYWNlO1xuXHR9O1xuXHQvKipcblx0ICogR2V0IGRhdGEgYnkgc2Vuc29yIG5hbWUuXG5cdCAqXHRAcGFyYW0ge0FycmF5W1N0cmluZ119IHNlbnNvck5hbWUgbGlzdCBvZiBzZW5zb3JzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmdldERhdGFCeU5hbWUgPSBmdW5jdGlvbihzZW5zb3JOYW1lcyl7XG5cdFx0dmFyIGRhdGE9W107XG5cdFx0Zm9yKHZhciBuIGluIHNlbnNvck5hbWVzKSB7XG5cdFx0XHRkYXRhLnB1c2godGhpcy5kYXRhTW9kZWxbc2Vuc29yTmFtZXNbbl1dKTtcblx0XHR9XG5cdFx0cmV0dXJuIGRhdGE7XG5cdH07XG5cblx0LyoqXG4gXHQgKiBHZXQgYWxsIHN0YXR1c2VzIHdpdGhpbiA0IGRheXNcblx0ICogQHBhcmFtIHsqfSByb2JvdF9vYmplY3QgXG5cdCAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXHRcdHJldHVybiBjYWxsYmFjaygtMSBpZiBub3QgZm91bmQvZGF0YSBvdGhlcndpc2UpXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLl9nZXRBbmRVcGRhdGVNdWx0aWRheVN0YXR1c2VzID0gZnVuY3Rpb24gKHJvYm90X29iamVjdHMsIGNhbGxiYWNrKSB7XG5cdFx0TG9nZ2VyLmRlYnVnKGBTdGF0dXMuZ2V0SW5pdGlhbFN0YXR1c2ApXG5cdFx0cm9ib3Rfb2JqZWN0cy5mb3JFYWNoKG9iamVjdCA9PiB7XG5cdFx0XHRpZiAob2JqZWN0LlJvYm90SWQgPT0gbnVsbCB8fCBvYmplY3QuUm9ib3ROYW1lID09IG51bGwpIHtcblx0XHRcdFx0TG9nZ2VyLndhcm4oYE11bHRpZGF5IHN0YXR1cyByZXF1ZXN0IGVycm9yOiBib3RoIFJvYm90SWQgYW5kIFJvYm90TmFtZSBzaG91bGQgYmUgbm90IG51bGw6ICR7b2JqZWN0LlJvYm90SWR9LCAke29iamVjdC5Sb2JvdE5hbWV9YClcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9XG5cdFx0XHRsZXQgcmVxID0ge1xuXHRcdFx0XHRzZXJ2aWNlOiBcInN0YXR1c1wiLFxuXHRcdFx0XHRmdW5jOiBcIkdldE11bHRpZGF5U3RhdHVzZXNcIixcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMnLFxuXHRcdFx0XHRcdHBhdGg6IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzXCJcblx0XHRcdFx0fSxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdHJvYm90X25hbWVzOiBbb2JqZWN0LlJvYm90TmFtZV1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0bGV0IGZuID0gKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKC0xKTtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKVxuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIFVwZGF0ZSByb2JvdE1vZGVsIHZhcmlhYmxlXG5cdFx0XHRcdExvZ2dlci5kZWJ1ZygnUmVjZWl2ZWQgbXVsdGlkYXkgc3RhdHVzZXMgb2Ygcm9ib3QnLCBvYmplY3QuUm9ib3RJZCwgb2JqZWN0LlJvYm90TmFtZSwgZGF0YSlcblx0XHRcdFx0dGhpcy5fZ2V0Um9ib3RNb2RlbEZyb21SZWN2MihkYXRhLCBvYmplY3QuUm9ib3RJZCwgb2JqZWN0LlJvYm90TmFtZSk7XG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwpXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdExvZ2dlci5kZWJ1ZyhgUmVxdWVzdGluZyBtdWx0aWRheSBzdGF0dXNlcyBvZiByb2JvdDpgLCBvYmplY3QuUm9ib3RJZCwgb2JqZWN0LlJvYm90TmFtZSlcblx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdChyZXEsIGZuKVxuXHRcdH0pXG5cdH07XG5cblx0LyoqXG5cdCAqIEdldCAnUGFydHMnIHJlZmVyZW5jZSBtYXAgdG8gcmVkdWNlIHN0YXR1cyBwYXlsb2FkLiBEdXBsaWNhdGVkIGNvbnRlbnRzIGluIHN0YXR1cyBhcmUgc3RvcmVkIGluIHRoZSBtYXAuXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLl9nZXRQYXJ0UmVmZXJlbmNlTWFwID0gZnVuY3Rpb24gKCkge1xuXHRcdGlmICh0aGlzLl9wYXJ0UmVmZXJlbmNlTWFwID09IG51bGwgfHwgdGhpcy5fcGFydFJlZmVyZW5jZU1hcC5sZW5ndGggPT0gMCkge1xuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdFx0dGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHRcdFx0XHRzZXJ2aWNlOiAnU3RhdHVzJyxcblx0XHRcdFx0XHRmdW5jOiAnR2V0UGFydFJlZmVyZW5jZU1hcCcsXG5cdFx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cycsXG5cdFx0XHRcdFx0XHRwYXRoOiAnL2ZyL3BhcnRuZXJpbmcvU3RhdHVzJ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdFx0TG9nZ2VyLmRlYnVnKGBQYXJ0UmVmZXJlbmNlTWFwLCBlcnJgLCBkYXRhLCBlcnIpXG5cdFx0XHRcdFx0aWYgKGRhdGEgPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0ZGF0YSA9IFtdXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRoaXMuX3BhcnRSZWZlcmVuY2VNYXAgPSBkYXRhXG5cdFx0XHRcdFx0cmVzb2x2ZSgpIC8vIHJldHVybnMgYSBtYXAgb2YgcGFydGlkIHRvIGl0cyBwcm9wZXJ0aWVzXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdH1cblx0XHRMb2dnZXIuZGVidWcoJ1BhcnRSZWZlcmVuY2VNYXAgYWxyZWFkeSBleGlzdHMsIG5vIG5lZWQgdG8gcmVxdWVzdC4gTnVtYmVyIG9mIHBhcnRzOicsIHRoaXMuX3BhcnRSZWZlcmVuY2VNYXAubGVuZ3RoKVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQgJ1N0YXR1c0V2dHMnIHJlZmVyZW5jZSBtYXAgdG8gcmVkdWNlIHN0YXR1cyBwYXlsb2FkLiBEdXBsaWNhdGVkIGNvbnRlbnRzIGluIHN0YXR1cyBhcmUgc3RvcmVkIGluIHRoZSBtYXAuXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLl9nZXRTdGF0dXNFdnRSZWZlcmVuY2VNYXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKHRoaXMuX3N0YXR1c0V2dFJlZmVyZW5jZU1hcCA9PSBudWxsIHx8IHRoaXMuX3N0YXR1c0V2dFJlZmVyZW5jZU1hcC5sZW5ndGggPT0gMCkge1xuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdFx0dGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHRcdFx0XHRzZXJ2aWNlOiAnU3RhdHVzJyxcblx0XHRcdFx0XHRmdW5jOiAnR2V0U3RhdHVzRXZ0UmVmZXJlbmNlTWFwJyxcblx0XHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzJyxcblx0XHRcdFx0XHRcdHBhdGg6ICcvZnIvcGFydG5lcmluZy9TdGF0dXMnXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0XHRMb2dnZXIuZGVidWcoYFN0YXR1c0V2dFJlZmVyZW5jZU1hcCwgZXJyYCwgZGF0YSwgZXJyKVxuXHRcdFx0XHRcdGlmIChkYXRhID09IG51bGwpIHtcblx0XHRcdFx0XHRcdGRhdGEgPSBbXVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLl9zdGF0dXNFdnRSZWZlcmVuY2VNYXAgPSBkYXRhXG5cdFx0XHRcdFx0cmVzb2x2ZSgpIC8vIHJldHVybnMgYSBtYXAgb2YgcGFydGlkIHRvIGl0cyBwcm9wZXJ0aWVzXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdH1cblx0XHRMb2dnZXIuZGVidWcoJ1N0YXR1c0V2dFJlZmVyZW5jZU1hcCBhbHJlYWR5IGV4aXN0cywgbm8gbmVlZCB0byByZXF1ZXN0LiBOdW1iZXIgb2YgcGFydHM6JywgdGhpcy5fc3RhdHVzRXZ0UmVmZXJlbmNlTWFwLmxlbmd0aClcblx0fTtcblxuXHQvKipcblx0ICogUXVlcnkgZm9yIGluaXRpYWwgc3RhdHVzZXNcblx0ICogU3Vic2NyaWJlIHRvIGVycm9yL3N0YXR1cyB1cGRhdGVzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLndhdGNoID0gZnVuY3Rpb24gKHJvYm90TmFtZXMsIGNhbGxiYWNrKSB7XG5cdFx0TG9nZ2VyLmRlYnVnKGBTdGF0dXMud2F0Y2g6IHJvYm90TmFtZXNgLCByb2JvdE5hbWVzKVxuXG5cdFx0dGhpcy5zZWxlY3Rvci5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cdFx0dGhpcy5zZWxlY3Rvci5fY29ubmVjdGlvbi5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cblx0XHQvLyBQcm9taXNlIHRvIHJldHJpZXZlIGxpc3Qgb2YgcGFpcmVkIG5laWdoYm9ycywgaS5lLiBhbGwgbmVpZ2hib3Igcm9ib3RzIGluIHRoZSBzYW1lIG1lc2ggbmV0d29ya1xuXHRcdGxldCBnZXROZWlnaGJvcnMgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnRGl5YU5vZGUnLFxuXHRcdFx0XHRmdW5jOiAnTGlzdE5laWdoYm9ycycsXG5cdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuRGl5YU5vZGUuTWVzaE5ldHdvcmsnLFxuXHRcdFx0XHRcdHBhdGg6ICcvZnIvcGFydG5lcmluZy9EaXlhTm9kZS9NZXNoTmV0d29yaydcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBuZWlnaGJvcnMpID0+IHtcblx0XHRcdFx0TG9nZ2VyLmRlYnVnKGBuZWlnaGJvcnMsIGVycmAsIG5laWdoYm9ycywgZXJyKVxuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRyZWplY3QoZXJyKVxuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIFRoaXMgb25seSByZXR1cm5zIHRoZSBsaXN0IG9mIHBoeXNpY2FsIGRldmljZXMgcGFpcmVkIGludG8gdGhlIG1lc2ggbmV0d29yaywgdGhlIGRpeWEtc2VydmVyIGluc3RhbmNlIGlzIG5vdCBhbHJlYWR5IGluY2x1ZGVkIGluIHRoZSBsaXN0XG5cdFx0XHRcdGlmIChuZWlnaGJvcnMgPT0gbnVsbCkge1xuXHRcdFx0XHRcdG5laWdoYm9ycyA9IFtdXG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzb2x2ZShuZWlnaGJvcnMpIC8vIHJldHVybnMgYSBhcnJheSBvZiBuZWlnaGJvciBvYmplY3QsIGVhY2ggb2JqZWN0IGlzIGFuIGFycmF5IG9mIFtyb2JvdC1uYW1lLCBhZGRyZXNzLCBib29sXVxuXHRcdFx0fSlcblx0XHR9KVxuXG5cdFx0Ly8gUHJvbWlzZSB0byByZXRyaWV2ZSBhbGwgb2JqZWN0cyAocm9ib3RzLCBwYXJ0cykgZXhwb3NlZCBpbiBEQnVzIGJ5IGRpeWEtbm9kZS1zdGF0dXNcblx0XHRsZXQgZ2V0UGFydHMgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHRcdFx0ZnVuYzogJ0dldE1hbmFnZWRPYmplY3RzJyxcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnb3JnLmZyZWVkZXNrdG9wLkRCdXMuT2JqZWN0TWFuYWdlcicsXG5cdFx0XHRcdH1cblx0XHRcdH0sIChwZWVySWQsIGVyciwgb2JqRGF0YSkgPT4geyAvLyBnZXQgYWxsIG9iamVjdCBwYXRocywgaW50ZXJmYWNlcyBhbmQgcHJvcGVydGllcyBjaGlsZHJlbiBvZiBTdGF0dXNcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsIHx8IG9iakRhdGEgPT0gbnVsbCkge1xuXHRcdFx0XHRcdHJlamVjdChlcnIpXG5cdFx0XHRcdH1cblx0XHRcdFx0TG9nZ2VyLmRlYnVnKGBNYW5hZ2VkUGFydHNgLCBvYmpEYXRhKVxuXHRcdFx0XHRyZXNvbHZlKG9iakRhdGEpIC8vIHJldHVybnMgYSBtYXAgdGhhdCBsaW5rcyB0aGUgb2JqZWN0IHBhdGggdG8gaXRzIGNvcnJlc3BvbmRpbmcgaW50ZXJmYWNlXG5cdFx0XHR9KVxuXHRcdH0pXG5cblx0XHRsZXQgcm9ib3RJZmFjZSA9ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCdcblx0XHRsZXQgcGFydElmYWNlID0gJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnXG5cblx0XHQvLyBqcyBvYmplY3RzIG9mIHJvYm90cyBhbmQgcGFydHNcblx0XHRsZXQgcm9ib3RzID0gW10gLy8gbGlzdCBvZiByb2JvdCBvYmplY3RzXG5cdFx0bGV0IHBhcnRzID0gW10gLy8gbGlzdCBvZiBwYXJ0IG9iamVjdFxuXHRcdGxldCBtZXNoZWRSb2JvdE5hbWVzID0gW10gLy8gbGlzdCBvZiBuYW1lcyBvZiByb2JvdHMgYW5kIGRpeWEtc2VydmVyIGluIHRoZSBtZXNoIG5ldHdvcmtcblxuXHRcdC8vIFJldHJpZXZlIHJlZmVyZW5jZSBtYXAgb2Yga2V5cyBhbmQgdmFsdWVzIGluIG9yZGVyIHRvIHJlZHVjZSBwYXlsb2FkIGZvciBzdGF0dXMgcmVxdWVzdHNcblx0XHRyZXR1cm4gUHJvbWlzZS50cnkoXyA9PiB0aGlzLl9nZXRQYXJ0UmVmZXJlbmNlTWFwKCkpXG5cdFx0XHQudGhlbihfID0+IHRoaXMuX2dldFN0YXR1c0V2dFJlZmVyZW5jZU1hcCgpKVxuXHRcdFx0LnRoZW4oXyA9PiBnZXROZWlnaGJvcnMpXG5cdFx0XHQudGhlbihyZXQgPT4ge1xuXHRcdFx0XHRpZiAocmV0ID09IG51bGwgfHwgIUFycmF5LmlzQXJyYXkocmV0KSkge1xuXHRcdFx0XHRcdG1lc2hlZFJvYm90TmFtZXMgPSBbXVxuXHRcdFx0XHR9XG5cdFx0XHRcdGxldCBob3N0bmFtZSA9IHRoaXMuc2VsZWN0b3IuX2Nvbm5lY3Rpb24uX3NlbGZcblx0XHRcdFx0bWVzaGVkUm9ib3ROYW1lcyA9IHJldC5tYXAociA9PiByWzBdKSAvLyB3ZSBvbmx5IGtlZXAgdGhlIHJvYm90IG5hbWVzXG5cdFx0XHRcdGlmICghbWVzaGVkUm9ib3ROYW1lcy5pbmNsdWRlcyhob3N0bmFtZSkpIHtcblx0XHRcdFx0XHRtZXNoZWRSb2JvdE5hbWVzLnB1c2goaG9zdG5hbWUpIC8vIGFkZCBob3N0bmFtZSwgaS5lLiB0aGUgZGl5YS1zZXJ2ZXIsIHdoaWNoIGlzIG5vdCBpbiB0aGUgbGlzdCBvZiBuZWlnaGJvcnNcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC50aGVuKF8gPT4gZ2V0UGFydHMpXG5cdFx0XHQudGhlbihyZXQgPT4ge1xuXHRcdFx0XHRmb3IgKGxldCBvYmplY3RQYXRoIGluIHJldCkge1xuXHRcdFx0XHRcdC8vIHRoZSBvYmplY3Qgb2J0YWluZWQgZnJvbSB0aGUgb2JqZWN0IHBhdGhcblx0XHRcdFx0XHRsZXQgb2JqZWN0ID0gcmV0W29iamVjdFBhdGhdXG5cblx0XHRcdFx0XHQvLyBpZiB0aGUgcmV0dXJuIG9iamVjdCBpcyBvZiBhIHJvYm90IGluIHRoZSBsaXN0IG9mIG5laWdoYm9ycywgb3Igb2YgdGhlIGRpeWEtc2VydmVyLCByZXRyaWV2ZSBhbGwgb2ZpdHMgcmVsZXZhbnQgc3RhdHVzZXNcblx0XHRcdFx0XHRMb2dnZXIuZGVidWcoJ09iamVjdCcsIG9iamVjdClcblx0XHRcdFx0XHRMb2dnZXIuZGVidWcoJ3JvYm90SWZhY2UnLCByb2JvdElmYWNlKVxuXG5cdFx0XHRcdFx0aWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShyb2JvdElmYWNlKSkge1xuXHRcdFx0XHRcdFx0cm9ib3RzLnB1c2gob2JqZWN0W3JvYm90SWZhY2VdKVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIGlmIHRoZSByZXR1cm4gb2JqZWN0IGlzIG9mIGEgcGFydCwgbGlzdGVuIHRvIHNpZ25hbCBTdGF0dXNDaGFuZ2VkIG9mIHRoZSBwYXJ0XG5cdFx0XHRcdFx0aWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShwYXJ0SWZhY2UpKSB7XG5cdFx0XHRcdFx0XHRwYXJ0cy5wdXNoKG9iamVjdFtwYXJ0SWZhY2VdKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdExvZ2dlci5kZWJ1ZygnZ2V0UGFydHMnLCByZXQpXG5cdFx0XHRcdExvZ2dlci5kZWJ1Zygncm9ib3RzJywgcm9ib3RzKVxuXG5cdFx0XHRcdC8vIGZpbGVyIGFuZCBrZWVwIHRoZSBkaXlhLXNlcnZlciBhbmQgdGhlIHJvYm90cyB0aGF0IGFyZSBvbmx5IGluIHRoZSBzYW1lIG1lc2ggbmV0d29ya3Ncblx0XHRcdFx0cm9ib3RzID0gcm9ib3RzLmZpbHRlcihyb2JvdCA9PiBtZXNoZWRSb2JvdE5hbWVzLmluY2x1ZGVzKHJvYm90LlJvYm90TmFtZSkpIC8vIG9ubHkga2VlcHMgcm9ib3RzIHRoYXQgYXJlIG5laWdoYm9ycyAoaS5lLiBpbiB0aGUgc2FtZSBtZXNoIG5ldHdvcmspXG5cblx0XHRcdFx0Ly8gVE9ETyAtIGZpbHRlciBwYXJ0cyB0aGF0IGJlbG9uZ3MgdG8gdGhlIGZpbHRlcmVkIHJvYm90c1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKF8gPT4ge1xuXHRcdFx0XHQvLyBSZXRyaWV2ZSBpbml0aWFsIHN0YXR1c2VzIGZyb20gdGhlIGZpbHRlcmVkIHJvYm90c1xuXHRcdFx0XHRMb2dnZXIuZGVidWcoJ1JvYm90cyBhbmQgZGl5YS1zZXJ2ZXIgaW4gdGhlIG1lc2ggbmV0d29yazonLCByb2JvdHMpXG5cdFx0XHRcdHJldHVybiB0aGlzLl9nZXRBbmRVcGRhdGVNdWx0aWRheVN0YXR1c2VzKHJvYm90cywgY2FsbGJhY2spXG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oXyA9PiB7XG5cdFx0XHRcdC8vIExpc3RlbiB0byBTdGF0dXNDaGFuZ2UgZnJvbSB0aGUgcGFydHMgYmVsb25naW5nIHRvIHRoZSBmaWx0ZXJlZCByb2JvdHNcblx0XHRcdFx0TG9nZ2VyLmRlYnVnKCdQYXJ0cyBiZWxvbmdpbmcgdG8gdGhlIGZpbHRlcmVkIHJvYm90czonLCBwYXJ0cylcblxuXHRcdFx0XHQvLyBUT0RPXG5cdFx0XHR9KVxuXG5cdFx0aWYgKHRydWUpIHJldHVyblxuXG5cdFx0Ly8gLy8gU3Vic2NyaWJlIHRvIHNpZ25hbHNcblxuXHRcdC8vIGxldCBzZW5kRGF0YSA9IFtdO1xuXHRcdC8vIGxldCByb2JvdElkcyA9IFtdO1xuXHRcdC8vIHJldHVybiBQcm9taXNlLnRyeShfID0+IHtcblx0XHQvLyBcdGxldCByZXEgPSB0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdC8vIFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHQvLyBcdFx0ZnVuYzogJ0dldE1hbmFnZWRPYmplY3RzJyxcblx0XHQvLyBcdFx0b2JqOiB7XG5cdFx0Ly8gXHRcdFx0aW50ZXJmYWNlOiAnb3JnLmZyZWVkZXNrdG9wLkRCdXMuT2JqZWN0TWFuYWdlcicsXG5cdFx0Ly8gXHRcdH1cblx0XHQvLyBcdH0sIChwZWVySWQsIGVyciwgb2JqRGF0YSkgPT4geyAvLyBnZXQgYWxsIG9iamVjdCBwYXRocywgaW50ZXJmYWNlcyBhbmQgcHJvcGVydGllcyBjaGlsZHJlbiBvZiBTdGF0dXNcblx0XHQvLyBcdFx0bGV0IHJvYm90TmFtZSA9ICcnO1xuXHRcdC8vIFx0XHRsZXQgcm9ib3RJZCA9IDE7XG5cblx0XHQvLyBcdFx0TG9nZ2VyLmRlYnVnKGBTdGF0dXMuR2V0TWFuYWdlZE9iamVjdHM6IG9iakRhdGEgPSBgKVxuXHRcdC8vIFx0XHRMb2dnZXIuZGVidWcob2JqRGF0YSlcblxuXHRcdC8vIFx0XHRmb3IgKGxldCBvYmplY3RQYXRoIGluIG9iakRhdGEpIHtcblx0XHQvLyBcdFx0XHRpZiAob2JqRGF0YVtvYmplY3RQYXRoXVsnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXSAhPSBudWxsKSB7XG5cdFx0Ly8gXHRcdFx0XHRyb2JvdE5hbWUgPSBvYmpEYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90TmFtZTtcblx0XHQvLyBcdFx0XHRcdHJvYm90SWQgPSBvYmpEYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90SWQ7XG5cdFx0Ly8gXHRcdFx0XHRyb2JvdElkc1tyb2JvdE5hbWVdID0gcm9ib3RJZDtcblx0XHQvLyBcdFx0XHRcdHRoaXMuX2dldEluaXRpYWxTdGF0dXMocm9ib3RJZCwgcm9ib3ROYW1lLCBmdW5jdGlvbiAobW9kZWwpIHtcblx0XHQvLyBcdFx0XHRcdFx0Y2FsbGJhY2sobW9kZWwsIHBlZXJJZCk7XG5cdFx0Ly8gXHRcdFx0XHR9KVxuXHRcdC8vIFx0XHRcdH1cblx0XHQvLyBcdFx0XHRpZiAob2JqRGF0YVtvYmplY3RQYXRoXVsnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCddICE9IG51bGwpIHtcblx0XHQvLyBcdFx0XHRcdGxldCBzdWJzID0gdGhpcy5zZWxlY3Rvci5zdWJzY3JpYmUoey8vIHN1YnNjcmliZXMgdG8gc3RhdHVzIGNoYW5nZXMgZm9yIGFsbCBwYXJ0c1xuXHRcdC8vIFx0XHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHQvLyBcdFx0XHRcdFx0ZnVuYzogJ1N0YXR1c0NoYW5nZWQnLFxuXHRcdC8vIFx0XHRcdFx0XHRvYmo6IHtcblx0XHQvLyBcdFx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0XHQvLyBcdFx0XHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoXG5cdFx0Ly8gXHRcdFx0XHRcdH0sXG5cdFx0Ly8gXHRcdFx0XHRcdGRhdGE6IHJvYm90TmFtZXNcblx0XHQvLyBcdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdC8vIFx0XHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHQvLyBcdFx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJTdGF0dXNTdWJzY3JpYmU6XCIgKyBlcnIpO1xuXHRcdC8vIFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdC8vIFx0XHRcdFx0XHRcdExvZ2dlci5kZWJ1ZyhgU3RhdHVzQ2hhbmdlZCBpcyBjYWxsZWRgKVxuXHRcdC8vIFx0XHRcdFx0XHRcdHNlbmREYXRhWzBdID0gZGF0YTtcblx0XHQvLyBcdFx0XHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdC8vIFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHQvLyBcdFx0XHRcdFx0XHRcdGNhbGxiYWNrKHRoaXMucm9ib3RNb2RlbCwgcGVlcklkKTtcblx0XHQvLyBcdFx0XHRcdFx0XHR9XG5cdFx0Ly8gXHRcdFx0XHRcdH1cblx0XHQvLyBcdFx0XHRcdH0pO1xuXHRcdC8vIFx0XHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zLnB1c2goc3Vicyk7XG5cdFx0Ly8gXHRcdFx0fVxuXHRcdC8vIFx0XHR9XG5cdFx0Ly8gXHR9KVxuXHRcdC8vIH0pLmNhdGNoKGVyciA9PiB7XG5cdFx0Ly8gXHRMb2dnZXIuZXJyb3IoZXJyKTtcblx0XHQvLyB9KVxuXG5cdH07XG5cblx0LyoqXG5cdCAqIENsb3NlIGFsbCBzdWJzY3JpcHRpb25zXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmNsb3NlU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uKCl7XG5cdFx0Zm9yKHZhciBpIGluIHRoaXMuc3Vic2NyaXB0aW9ucykge1xuXHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zW2ldLmNsb3NlKCk7XG5cdFx0fVxuXHRcdHRoaXMuc3Vic2NyaXB0aW9ucyA9W107XG5cdFx0dGhpcy5yb2JvdE1vZGVsID0gW107XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldCBkYXRhIGdpdmVuIGRhdGFDb25maWcuXG5cdCAqIEBwYXJhbSB7ZnVuY30gY2FsbGJhY2sgOiBjYWxsZWQgYWZ0ZXIgdXBkYXRlXG5cdCAqIFRPRE8gVVNFIFBST01JU0Vcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuZ2V0RGF0YSA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBkYXRhQ29uZmlnKXtcblx0XHR2YXIgZGF0YU1vZGVsID0ge307XG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KF8gPT4ge1xuXHRcdFx0aWYoZGF0YUNvbmZpZyAhPSBudWxsKVxuXHRcdFx0XHR0aGlzLkRhdGFDb25maWcoZGF0YUNvbmZpZyk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcIlJlcXVlc3Q6IFwiK0pTT04uc3RyaW5naWZ5KGRhdGFDb25maWcpKTtcblx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRcdGZ1bmM6IFwiRGF0YVJlcXVlc3RcIixcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdHR5cGU6XCJzcGxSZXFcIixcblx0XHRcdFx0XHRkYXRhQ29uZmlnOiB0aGlzLmRhdGFDb25maWdcblx0XHRcdFx0fVxuXHRcdFx0fSwgKGRuSWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJbXCIgKyB0aGlzLmRhdGFDb25maWcuc2Vuc29ycyArIFwiXSBSZWN2IGVycjogXCIgKyBKU09OLnN0cmluZ2lmeShlcnIpKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoZGF0YS5oZWFkZXIuZXJyb3IgIT0gbnVsbCkge1xuXHRcdFx0XHRcdC8vIFRPRE8gOiBjaGVjay91c2UgZXJyIHN0YXR1cyBhbmQgYWRhcHQgYmVoYXZpb3IgYWNjb3JkaW5nbHlcblx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJVcGRhdGVEYXRhOlxcblwiK0pTT04uc3RyaW5naWZ5KGRhdGEuaGVhZGVyLnJlcUNvbmZpZykpO1xuXHRcdFx0XHRcdExvZ2dlci5lcnJvcihcIkRhdGEgcmVxdWVzdCBmYWlsZWQgKFwiK2RhdGEuaGVhZGVyLmVycm9yLnN0K1wiKTogXCIrZGF0YS5oZWFkZXIuZXJyb3IubXNnKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly9Mb2dnZXIubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuZGF0YU1vZGVsKSk7XG5cdFx0XHRcdGRhdGFNb2RlbCA9IHRoaXMuX2dldERhdGFNb2RlbEZyb21SZWN2KGRhdGEpO1xuXG5cdFx0XHRcdExvZ2dlci5sb2codGhpcy5nZXREYXRhTW9kZWwoKSk7XG5cdFx0XHRcdGNhbGxiYWNrID0gY2FsbGJhY2suYmluZCh0aGlzKTsgLy8gYmluZCBjYWxsYmFjayB3aXRoIFN0YXR1c1xuXHRcdFx0XHRjYWxsYmFjayhkYXRhTW9kZWwpOyAvLyBjYWxsYmFjayBmdW5jXG5cdFx0XHR9KTtcblx0XHR9KS5jYXRjaChlcnIgPT4ge1xuXHRcdFx0TG9nZ2VyLmVycm9yKGVycilcblx0XHR9KVxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIFVwZGF0ZSBpbnRlcm5hbCByb2JvdCBtb2RlbCB3aXRoIHJlY2VpdmVkIGRhdGEgKHZlcnNpb24gMilcblx0ICogQHBhcmFtICB7T2JqZWN0fSBkYXRhIGRhdGEgcmVjZWl2ZWQgZnJvbSBEaXlhTm9kZSBieSB3ZWJzb2NrZXRcblx0ICogQHJldHVybiB7W3R5cGVdfVx0XHRbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyID0gZnVuY3Rpb24oZGF0YSwgcm9ib3RJZCwgcm9ib3ROYW1lKSB7XG5cdFx0aWYgKHRoaXMuX3BhcnRSZWZlcmVuY2VNYXAgPT0gbnVsbCkge1xuXHRcdFx0dGhpcy5fcGFydFJlZmVyZW5jZU1hcCA9IFtdXG5cdFx0fVxuXHRcdGlmICh0aGlzLl9zdGF0dXNFdnRSZWZlcmVuY2VNYXAgPT0gbnVsbCkge1xuXHRcdFx0dGhpcy5fc3RhdHVzRXZ0UmVmZXJlbmNlTWFwID0gW11cblx0XHR9XG5cdFx0aWYodGhpcy5yb2JvdE1vZGVsID09IG51bGwpXG5cdFx0XHR0aGlzLnJvYm90TW9kZWwgPSBbXTtcblxuXHRcdGlmKHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSAhPSBudWxsKVxuXHRcdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdLnBhcnRzID0ge307IC8vIHJlc2V0IHBhcnRzXG5cblx0XHRpZih0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0gPT0gbnVsbClcblx0XHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSA9IHt9O1xuXG5cdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdID0ge1xuXHRcdFx0cm9ib3Q6IHtcblx0XHRcdFx0bmFtZTogcm9ib3ROYW1lXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKiBleHRyYWN0IHBhcnRzIGluZm8gKiovXG5cdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdLnBhcnRzID0ge307XG5cdFx0bGV0IHJQYXJ0cyA9IHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXS5wYXJ0cztcblxuXHRcdGRhdGEuZm9yRWFjaChkID0+IHtcblx0XHRcdGxldCBwYXJ0SWQgPSBkWzBdO1xuXHRcdFx0bGV0IHRpbWUgPSBkWzFdO1xuXHRcdFx0bGV0IGNvZGUgPSBkWzJdO1xuXG5cdFx0XHQvLyBtYXAgdGhlIGhhc2ggdmFsdWUgdG8gdGhlIHN0YXR1cyBldmVudCB2YWx1ZXNcblx0XHRcdGxldCBoYXNoID0gZFszXTtcblx0XHRcdGxldCBzdGF0dXNFdnRSZWZlcmVuY2UgPSB0aGlzLl9zdGF0dXNFdnRSZWZlcmVuY2VNYXBbaGFzaF1cblx0XHRcdGlmIChzdGF0dXNFdnRSZWZlcmVuY2UgPT0gbnVsbCkge1xuXHRcdFx0XHRMb2dnZXIud2FybihgU3RhdHVzRXZ0UmVmZXJlbmNlIGZpbmRzIG5vIG1hcCBmb3IgaGFzaCBrZXkgJHtoYXNofWApXG5cdFx0XHR9XG5cdFx0XHRsZXQgY29kZVJlZiA9IHN0YXR1c0V2dFJlZmVyZW5jZSA9PSBudWxsID8gbnVsbCA6IHN0YXR1c0V2dFJlZmVyZW5jZVswXTtcblx0XHRcdGxldCBtc2cgPSBzdGF0dXNFdnRSZWZlcmVuY2UgPT0gbnVsbCA/IG51bGwgOiBzdGF0dXNFdnRSZWZlcmVuY2VbMV07XG5cdFx0XHRsZXQgY3JpdExldmVsID0gc3RhdHVzRXZ0UmVmZXJlbmNlID09IG51bGwgPyBudWxsIDogc3RhdHVzRXZ0UmVmZXJlbmNlWzJdO1xuXG5cdFx0XHQvLyBtYXAgdGhlIHBhcnRJZCB0byB0aGUgcGFydCByZWZlcmVuY2UgdmFsdWVzXG5cdFx0XHRsZXQgcGFydFJlZmVyZW5jZSA9IHRoaXMuX3BhcnRSZWZlcmVuY2VNYXBbcGFydElkXTtcblx0XHRcdGlmIChwYXJ0UmVmZXJlbmNlID09IG51bGwpIHtcblx0XHRcdFx0TG9nZ2VyLndhcm4oYFBhcnRSZWZlcmVuY2UgZmluZHMgbm8gbWFwIGZvciBwYXJ0SWQgJHtwYXJ0SWR9YClcblx0XHRcdH1cblx0XHRcdGxldCBwYXJ0TmFtZSA9IHBhcnRSZWZlcmVuY2UgPT0gbnVsbCA/IG51bGwgOiBwYXJ0UmVmZXJlbmNlWzBdO1xuXHRcdFx0bGV0IGxhYmVsID0gcGFydFJlZmVyZW5jZSA9PSBudWxsID8gbnVsbCA6IHBhcnRSZWZlcmVuY2VbMV07XG5cdFx0XHRsZXQgY2F0ZWdvcnkgPSBwYXJ0UmVmZXJlbmNlID09IG51bGwgPyBudWxsIDogcGFydFJlZmVyZW5jZVsyXTtcblxuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdID09IG51bGwpIHtcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0gPSB7fTtcblx0XHRcdH1cblx0XHRcdC8qIHVwZGF0ZSBwYXJ0IGNhdGVnb3J5ICovXG5cdFx0XHRyUGFydHNbcGFydElkXS5jYXRlZ29yeSA9IGNhdGVnb3J5O1xuXHRcdFx0LyogdXBkYXRlIHBhcnQgbmFtZSAqL1xuXHRcdFx0clBhcnRzW3BhcnRJZF0ubmFtZSA9IHBhcnROYW1lID09IG51bGwgPyBudWxsIDogcGFydE5hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdC8qIHVwZGF0ZSBwYXJ0IGxhYmVsICovXG5cdFx0XHRyUGFydHNbcGFydElkXS5sYWJlbCA9IGxhYmVsO1xuXG5cdFx0XHQvKiB1cGRhdGUgZXJyb3IgKi9cblx0XHRcdC8qKiB1cGRhdGUgZXJyb3JMaXN0ICoqL1xuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdCA9PSBudWxsKVxuXHRcdFx0XHRyUGFydHNbcGFydElkXS5lcnJvckxpc3QgPSB7fTtcblxuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdFtjb2RlUmVmXSA9PSBudWxsKVxuXHRcdFx0XHRyUGFydHNbcGFydElkXS5lcnJvckxpc3RbY29kZVJlZl0gPSB7XG5cdFx0XHRcdFx0bXNnOiBtc2csXG5cdFx0XHRcdFx0Y3JpdExldmVsOiBjcml0TGV2ZWwsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IG51bGxcblx0XHRcdFx0fTtcblx0XHRcdGxldCBldnRzX3RtcCA9IHtcblx0XHRcdFx0dGltZTogdGhpcy5fY29kZXIuZnJvbSh0aW1lKSxcblx0XHRcdFx0Y29kZTogdGhpcy5fY29kZXIuZnJvbShjb2RlKSxcblx0XHRcdFx0Y29kZVJlZjogdGhpcy5fY29kZXIuZnJvbShjb2RlUmVmKVxuXHRcdFx0fTtcblx0XHRcdC8qKiBpZiByZWNlaXZlZCBsaXN0IG9mIGV2ZW50cyAqKi9cblx0XHRcdGlmIChBcnJheS5pc0FycmF5KGV2dHNfdG1wLmNvZGUpIHx8IEFycmF5LmlzQXJyYXkoZXZ0c190bXAudGltZSlcblx0XHRcdFx0fHwgQXJyYXkuaXNBcnJheShldnRzX3RtcC5jb2RlUmVmKSkge1xuXHRcdFx0XHRpZiAoZXZ0c190bXAuY29kZS5sZW5ndGggPT09IGV2dHNfdG1wLmNvZGVSZWYubGVuZ3RoXG5cdFx0XHRcdFx0JiYgZXZ0c190bXAuY29kZS5sZW5ndGggPT09IGV2dHNfdG1wLnRpbWUubGVuZ3RoKSB7XG5cdFx0XHRcdFx0LyoqIGJ1aWxkIGxpc3Qgb2YgZXZlbnRzICoqL1xuXHRcdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmV2dHMgPSBbXTtcblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGV2dHNfdG1wLmNvZGUubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmV2dHMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdHRpbWU6IGV2dHNfdG1wLnRpbWVbaV0sXG5cdFx0XHRcdFx0XHRcdGNvZGU6IGV2dHNfdG1wLmNvZGVbaV0sXG5cdFx0XHRcdFx0XHRcdGNvZGVSZWY6IGV2dHNfdG1wLmNvZGVSZWZbaV1cblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIExvZ2dlci5lcnJvcihcIlN0YXR1czpJbmNvbnNpc3RhbnQgbGVuZ3RocyBvZiBidWZmZXJzICh0aW1lL2NvZGUvY29kZVJlZilcIik7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHsgLyoqIGp1c3QgaW4gY2FzZSwgdG8gcHJvdmlkZSBiYWNrd2FyZCBjb21wYXRpYmlsaXR5ICoqL1xuXHRcdFx0XHQvKiogc2V0IHJlY2VpdmVkIGV2ZW50ICoqL1xuXHRcdFx0XHRyUGFydHNbcGFydElkXS5ldnRzID0gW3tcblx0XHRcdFx0XHR0aW1lOiBldnRzX3RtcC50aW1lLFxuXHRcdFx0XHRcdGNvZGU6IGV2dHNfdG1wLmNvZGUsXG5cdFx0XHRcdFx0Y29kZVJlZjogZXZ0c190bXAuY29kZVJlZlxuXHRcdFx0XHR9XTtcblx0XHRcdH1cblx0XHR9KVxuXHR9O1xuXG5cdC8qKiBjcmVhdGUgU3RhdHVzIHNlcnZpY2UgKiovXG5cdERpeWFTZWxlY3Rvci5wcm90b3R5cGUuU3RhdHVzID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gbmV3IFN0YXR1cyh0aGlzKTtcblx0fTtcblxuXHQvKipcblx0ICogU2V0IG9uIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGZpbmQgc3RhdHVzIHRvIG1vZGlmeVxuXHQgKiBAcGFyYW0gcGFydE5hbWUgXHR0byBmaW5kIHN0YXR1cyB0byBtb2RpZnlcblx0ICogQHBhcmFtIGNvZGVcdFx0bmV3Q29kZVxuXHQgKiBAcGFyYW0gc291cmNlXHRcdHNvdXJjZVxuXHQgKiBAcGFyYW0gY2FsbGJhY2tcdFx0cmV0dXJuIGNhbGxiYWNrICg8Ym9vbD5zdWNjZXNzKVxuXHQgKi9cblx0RGl5YVNlbGVjdG9yLnByb3RvdHlwZS5zZXRTdGF0dXMgPSBmdW5jdGlvbiAocm9ib3ROYW1lLCBwYXJ0TmFtZSwgY29kZSwgc291cmNlLCBjYWxsYmFjaykge1xuXHRcdHJldHVybiBQcm9taXNlLnRyeShfID0+IHtcblx0XHRcdHZhciBvYmplY3RQYXRoID0gXCIvZnIvcGFydG5lcmluZy9TdGF0dXMvUm9ib3RzL1wiICsgdGhpcy5zcGxpdEFuZENhbWVsQ2FzZShyb2JvdE5hbWUsIFwiLVwiKSArIFwiL1BhcnRzL1wiICsgcGFydE5hbWU7XG5cdFx0XHR0aGlzLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiBcInN0YXR1c1wiLFxuXHRcdFx0XHRmdW5jOiBcIlNldFBhcnRcIixcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCcsXG5cdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0Ly9yb2JvdE5hbWU6IHJvYm90TmFtZSxcblx0XHRcdFx0XHRjb2RlOiBjb2RlLFxuXHRcdFx0XHRcdC8vcGFydE5hbWU6IHBhcnROYW1lLFxuXHRcdFx0XHRcdHNvdXJjZTogc291cmNlIHwgMVxuXHRcdFx0XHR9XG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soZmFsc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKHRydWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KS5jYXRjaChlcnIgPT4ge1xuXHRcdFx0TG9nZ2VyLmVycm9yKGVycilcblx0XHR9KVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQgb25lIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGdldCBzdGF0dXNcblx0ICogQHBhcmFtIHBhcnROYW1lIFx0dG8gZ2V0IHN0YXR1c1xuXHQgKiBAcGFyYW0gY2FsbGJhY2tcdFx0cmV0dXJuIGNhbGxiYWNrKC0xIGlmIG5vdCBmb3VuZC9kYXRhIG90aGVyd2lzZSlcblx0ICogQHBhcmFtIF9mdWxsIFx0bW9yZSBkYXRhIGFib3V0IHN0YXR1c1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5nZXRTdGF0dXMgPSBmdW5jdGlvbiAocm9ib3ROYW1lLCBwYXJ0TmFtZSwgY2FsbGJhY2svKiwgX2Z1bGwqLykge1xuXHRcdGxldCBzZW5kRGF0YSA9IFtdXG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KF8gPT4ge1xuXHRcdFx0bGV0IHJlcSA9IHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdvcmcuZnJlZWRlc2t0b3AuREJ1cy5PYmplY3RNYW5hZ2VyJyxcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBvYmpEYXRhKSA9PiB7XG5cblx0XHRcdFx0bGV0IG9iamVjdFBhdGhSb2JvdCA9IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9cIiArIHRoaXMuc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIik7XG5cdFx0XHRcdGxldCBvYmplY3RQYXRoUGFydCA9IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9cIiArIHRoaXMuc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIikgKyBcIi9QYXJ0cy9cIiArIHBhcnROYW1lO1xuXHRcdFx0XHRsZXQgcm9ib3RJZCA9IG9iakRhdGFbb2JqZWN0UGF0aFJvYm90XVsnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXS5Sb2JvdElkXG5cdFx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdFx0XHRmdW5jOiBcIkdldFBhcnRcIixcblx0XHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnLFxuXHRcdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFBhcnRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdHNlbmREYXRhLnB1c2goZGF0YSlcblx0XHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soLTEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKHRoaXMucm9ib3RNb2RlbCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0fSkuY2F0Y2goZXJyID0+IHtcblx0XHRcdExvZ2dlci5lcnJvcihlcnIpXG5cdFx0fSlcblx0fTtcblxuXHRTdGF0dXMucHJvdG90eXBlLnNwbGl0QW5kQ2FtZWxDYXNlID0gZnVuY3Rpb24gKGluU3RyaW5nLCBkZWxpbWl0ZXIpIHtcblx0XHRsZXQgYXJyYXlTcGxpdFN0cmluZyA9IGluU3RyaW5nLnNwbGl0KGRlbGltaXRlcik7XG5cdFx0bGV0IG91dENhbWVsU3RyaW5nID0gJyc7XG5cdFx0YXJyYXlTcGxpdFN0cmluZy5mb3JFYWNoKHN0ciA9PiB7XG5cdFx0XHRvdXRDYW1lbFN0cmluZyArPSBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc3Vic3RyaW5nKDEpO1xuXHRcdH0pXG5cdFx0cmV0dXJuIG91dENhbWVsU3RyaW5nO1xuXHR9XG5cbn0pKClcbiJdfQ==
