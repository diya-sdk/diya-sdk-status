(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
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

},{"./support/isBuffer":4,"_process":2,"inherits":3}],6:[function(require,module,exports){
'use strict';

var _fs = require('fs');

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

	// /**
	//  * Get all statuses within 4 days
	//  * @param {*} robot_object 
	//  * @param {function} callback		return callback(-1 if not found/data otherwise)
	//  */
	// Status.prototype._getAndUpdateMultidayStatuses = function (robot_objects, callback) {
	// 	Logger.debug(`Status.getInitialStatus`)
	// 	robot_objects.forEach(object => {
	// 		if (object.RobotId == null || object.RobotName == null) {
	// 			Logger.warn(`Multiday status request error: both RobotId and RobotName should be not null: ${object.RobotId}, ${object.RobotName}`)
	// 			return
	// 		}
	// 		let req = {
	// 			service: "status",
	// 			func: "GetMultidayStatuses",
	// 			obj: {
	// 				interface: 'fr.partnering.Status',
	// 				path: "/fr/partnering/Status"
	// 			},
	// 			data: {
	// 				robot_names: [object.RobotName]
	// 			}
	// 		}
	// 		let fn = (peerId, err, data) => {
	// 			if (err != null) {
	// 				if (typeof callback === 'function') callback(-1);
	// 				throw new Error(err)
	// 			}
	// 			Logger.debug('Received multiday statuses of robot', object.RobotId, object.RobotName, data)
	// 			// Update robotModel variable
	// 			this._getRobotModelFromRecv2(data, object.RobotId, object.RobotName);
	// 			if (typeof callback === 'function') {
	// 				callback(this.robotModel)
	// 			}
	// 		}
	// 		Logger.debug(`Requesting multiday statuses of robot:`, object.RobotId, object.RobotName)
	// 		this.selector.request(req, fn)
	// 	})
	// };

	Status.prototype._subscribeToMultidayStatusUpdate = function (robot_objects, callback) {
		var _this = this;

		Logger.debug('Subscribe to MultidayStatusUpdate');
		var subs = this.selector.subscribe({
			service: 'status',
			func: 'MultidayStatusUpdated',
			obj: {
				interface: 'fr.partnering.Status',
				path: "/fr/partnering/Status"
			}
		}, function (peerId, err, data) {
			Logger.debug('RECEIVED SUBSCRIPTION', data);
			if (err != null) {
				Logger.error("StatusSubscribe:" + err);
				return;
			}
			if (!Array.isArray(data)) {
				Logger.warn("Malformed data from signal MultidayStatusUpdated:" + data);
				return;
			}
			var unpackedData = _this._unpackRobotModels(data[0]);
			Logger.debug('MultidayStatusUpdated is called, data:', unpackedData);
			_this._getRobotModelFromRecv2(unpackedData); // update this.robotModel
			Logger.debug('RobotModel after unpacked:', _this.robotModel);
			if (typeof callback === 'function') {
				callback(_this.robotModel);
			}
		});
		this.subscriptions.push(subs);

		Logger.debug('Send request for MultidayStatusUpdate', robotNames);
		var robotNames = robot_objects.map(function (robot) {
			return robot.RobotName;
		});
		this.selector.request({
			service: "status",
			func: "TriggerMultidayStatuses",
			obj: {
				interface: 'fr.partnering.Status',
				path: "/fr/partnering/Status"
			},
			data: {
				robot_names: robotNames
			}
		}, function (peerId, err, data) {
			// Do nothing since the server should reponse back via signals
			if (err != null) {
				Logger.warn('Cannot connect to status service: ' + err);
				if (typeof callback === 'function') callback(-1);
				throw new Error(err);
			}
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
  * Subscribes to status changes for all parts
  * @param {*} parts 
  * @param {*} callback 
  */
	Status.prototype._subscribeToStatusChanged = function (parts, callback) {
		var _this4 = this;

		if (parts == null) {
			return;
		}

		if (true) {
			return;
		}

		parts.forEach(function (part) {
			var obj = {
				service: 'status',
				func: 'StatusChanged',
				obj: {
					interface: 'fr.partnering.Status.Part',
					path: objectPath
				}
			};
			var fn = function fn(peerId, err, data) {
				if (err != null) {
					Logger.error("StatusSubscribe:" + err);
					return;
				}
				Logger.debug('StatusChanged is called, data:', data);
				// Update robotModel variable
				_this4._getRobotModelFromRecv2(data, part.RobotId, part.RobotName);
				if (typeof callback === 'function') {
					callback(_this4.robotModel);
				}
			};
			var subs = _this4.selector.subscribe(obj, fn);
			_this4.subscriptions.push(subs);
		});

		// 	let subs = this.selector.subscribe({// subscribes to status changes for all parts
		// 		service: 'status',
		// 		func: 'StatusChanged',
		// 		obj: {
		// 				interface: 'fr.partnering.Status.Part',
		// 				path: objectPath
		// 		},
		// 		data: robotNames
		// }, (peerId, err, data) => {
		// 		if (err != null) {
		// 				Logger.error("StatusSubscribe:" + err);
		// 		} else {
		// 				sendData[0] = data;
		// 				this._getRobotModelFromRecv2(sendData, robotId, robotName);
		// 				if (typeof callback === 'function') {
		// 						callback(this.robotModel, peerId);
		// 				}
		// 		}
		// });
		// this.subscriptions.push(subs);
	};

	/**
  * Query for initial statuses
  * Subscribe to error/status updates
  */
	Status.prototype.watch = function (robotNames, callback) {
		var _this5 = this;

		Logger.debug('Status.watch: robotNames', robotNames);

		this.selector.setMaxListeners(0);
		this.selector._connection.setMaxListeners(0);

		// Promise to retrieve list of paired neighbors, i.e. all neighbor robots in the same mesh network
		var getNeighbors = new Promise(function (resolve, reject) {
			_this5.selector.request({
				service: 'MeshNetwork',
				func: 'ListNeighbors'
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
		var getRobotsAndParts = new Promise(function (resolve, reject) {
			_this5.selector.request({
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
				resolve(objData); // returns a map that links the object path to its corresponding interface
			});
		});

		var robotIface = 'fr.partnering.Status.Robot';
		var partIface = 'fr.partnering.Status.Part';

		// js objects of robots and parts
		var robotMap = new Map(); // map robot name to id
		var robots = []; // list of robot objects
		var parts = []; // list of part object
		var meshedRobotNames = []; // list of names of robots and diya-server in the mesh network

		// Retrieve reference map of keys and values in order to reduce payload for status requests
		return Promise.try(function (_) {
			return _this5._getPartReferenceMap();
		}).then(function (_) {
			return _this5._getStatusEvtReferenceMap();
		}).then(function (_) {
			return getNeighbors;
		}).then(function (ret) {
			if (ret == null || !Array.isArray(ret)) {
				meshedRobotNames = [];
			}
			var hostname = _this5.selector._connection._self;
			meshedRobotNames = ret.map(function (r) {
				return r[0];
			}); // we only keep the robot names
			if (!meshedRobotNames.includes(hostname)) {
				meshedRobotNames.push(hostname); // add hostname, i.e. the diya-server, which is not in the list of neighbors
			}
		}).then(function (_) {
			return getRobotsAndParts;
		}).then(function (ret) {
			for (var _objectPath in ret) {
				// the object obtained from the object path
				var object = ret[_objectPath];

				// if the return object is of a robot in the list of neighbors, or of the diya-server, retrieve all ofits relevant statuses
				if (object.hasOwnProperty(robotIface)) {
					// this is robot object
					robots.push(object[robotIface]);
				}

				// if the return object is of a part, listen to signal StatusChanged of the part
				if (object.hasOwnProperty(partIface)) {
					// this is a part object
					var part = object[partIface];
					part.objectPath = _objectPath;
					part.RobotName = _objectPath.split('/')[5]; /* /fr/partnering/Status/Robots/B1R00037/Parts/voct */
					parts.push(part);
				}
			}

			Logger.debug('robots', robots);
			Logger.debug('parts', parts);

			// filer and keep the diya-server and the robots that are only in the same mesh networks
			robots = robots.filter(function (robot) {
				return meshedRobotNames.includes(robot.RobotName);
			}); // only keeps robots that are neighbors (i.e. in the same mesh network)

			// filter parts that belongs to the robot in the mesh network (including the diya-server)
			parts = parts.filter(function (part) {
				return meshedRobotNames.includes(part.RobotName);
			}); // only keeps parts belonging to neighbors (i.e. in the same mesh network)

			// create map of robot name to id for setting RobotId to paths
			robots.forEach(function (robot) {
				if (robotMap.has(robot.RobotName)) {
					return;
				}
				robotMap.set(robot.RobotName, robot.RobotId);
			});

			// set RobotId to each part
			parts.forEach(function (part) {
				part.RobotId = robotMap.get(part.RobotName);
			});

			Logger.debug('meshed robots', robots);
			Logger.debug('meshed parts', parts);
		})
		// Sending fixed chunks to limit payload
		.then(function (_) {
			return _this5._subscribeToMultidayStatusUpdate(robots, callback);
		}); // Retrieve initial statuses from the filtered robots

		// OK - in case sending a large chunk for each robot, payload can be large
		// .then(_ => this._getAndUpdateMultidayStatuses(robots, callback)) // Retrieve initial statuses from the filtered robots
		// .then(_ => this._subscribeToStatusChanged(parts, callback)) // Listen to StatusChange from the parts belonging to the filtered robots

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
		var _this6 = this;

		var dataModel = {};
		return Promise.try(function (_) {
			if (dataConfig != null) _this6.DataConfig(dataConfig);
			// console.log("Request: "+JSON.stringify(dataConfig));
			_this6.selector.request({
				service: "status",
				func: "DataRequest",
				data: {
					type: "splReq",
					dataConfig: _this6.dataConfig
				}
			}, function (dnId, err, data) {
				if (err != null) {
					Logger.error("[" + _this6.dataConfig.sensors + "] Recv err: " + JSON.stringify(err));
					return;
				}
				if (data.header.error != null) {
					// TODO : check/use err status and adapt behavior accordingly
					Logger.error("UpdateData:\n" + JSON.stringify(data.header.reqConfig));
					Logger.error("Data request failed (" + data.header.error.st + "): " + data.header.error.msg);
					return;
				}
				//Logger.log(JSON.stringify(this.dataModel));
				dataModel = _this6._getDataModelFromRecv(data);

				Logger.log(_this6.getDataModel());
				callback = callback.bind(_this6); // bind callback with Status
				callback(dataModel); // callback func
			});
		}).catch(function (err) {
			Logger.error(err);
		});
	};

	/**
  * Restore zipped data from signal MultidayStatusUpdated to a compliant state for use in function {@link _getRobotModelFromRecv2}
  * @param {object} data - zipped data received from signal MultidayStatusUpdated, this data is compressed to reduce memory footprint
  * t.DBUS_DICT (
  *		t.DBUS_STRING,     // robot info i.e. 4:D1R00035
  *		t.DBUS_DICT (
  *			t.DBUS_STRING, // partId
  *			t.DBUS_ARRAY (t.DBUS_STRUCT(t.DBUS_UINT64, t.DBUS_UINT16, t.DBUS_UINT32))
  *                         // time, code, hash
  *		)
  * @return {object} extracted data in form of array of [PartId, Category, PartName, Label, Time, Code, CodeRef, Msg, CritLevel, Description, RobotId, RobotName]
  */
	Status.prototype._unpackRobotModels = function (data) {
		var _this7 = this;

		if (data == null) {
			return;
		}
		// These two reference map should have been retrieved at initial connection
		if (this._partReferenceMap == null) {
			this._partReferenceMap = [];
		}
		if (this._statusEvtReferenceMap == null) {
			this._statusEvtReferenceMap = [];
		}
		// Begin to unpack data
		var statuses = [];

		var _loop = function _loop(robot) {
			var robotIds = robot.split(":"); // i.e. 4:D1R00035
			var robotId = robotIds[0];
			var robotName = robotIds[1];
			if (robotIds.some(function (item) {
				return item == null;
			})) {
				// erroneous data
				return 'continue';
			}

			var _loop2 = function _loop2(partId) {
				var subStatuses = data[robot][partId]; // an array of [time, code, hash]
				if (!Array.isArray(subStatuses)) {
					// erroneous data
					return 'continue';
				}
				// extract part-related information from pre-retrieved map
				var partReference = _this7._partReferenceMap[partId];
				if (partReference == null) {
					Logger.warn('PartReference finds no map for partId ' + partId);
				}
				var partName = partReference == null ? null : partReference[0];
				var label = partReference == null ? null : partReference[1];
				var category = partReference == null ? null : partReference[2];

				subStatuses.forEach(function (subStatus) {
					var time = subStatus[0];
					var code = subStatus[1];

					// map the hash value to the status event values
					var hash = subStatus[2];
					var statusEvtReference = _this7._statusEvtReferenceMap[hash];
					if (statusEvtReference == null) {
						Logger.warn('StatusEvtReference finds no map for hash key ' + hash);
					}
					var codeRef = statusEvtReference == null ? null : statusEvtReference[0];
					var msg = statusEvtReference == null ? null : statusEvtReference[1];
					var critLevel = statusEvtReference == null ? null : statusEvtReference[2];

					// construct full information for each status
					var status = [partId, category, partName, label, time, code, codeRef, msg, critLevel, robotId, robotName];
					statuses.push(status);
				});
			};

			for (var partId in data[robot]) {
				var _ret2 = _loop2(partId);

				if (_ret2 === 'continue') continue;
			}
		};

		for (var robot in data) {
			var _ret = _loop(robot);

			if (_ret === 'continue') continue;
		}
		Logger.debug('Extracted ' + statuses.length + ' statuses');
		return statuses;
	};

	/**
  * Update internal robot model with received data (version 2)
  * @param  {Object} data data received from DiyaNode by websocket having the form
  * 		   [partId, category, partName, label, time, code, codeRef, msg, critLevel, robotId, robotName]
  * @deprecated robotId
  * @deprecated robotName
  * @return {[type]}		[description]
  */
	Status.prototype._getRobotModelFromRecv2 = function (data) {
		var _this8 = this;

		if (!Array.isArray(data)) {
			return;
		}

		if (this.robotModel == null) {
			this.robotModel = [];
		}

		data.forEach(function (d) {
			var robotId = d[9];
			var robotName = d[10];

			if ([robotId, robotName].some(function (item) {
				return item == null;
			})) {
				Logger.warn('Erroneous status data, robotId = ' + robotId + ', robotName = ' + robotName);
				return;
			}

			if (_this8.robotModel[robotId] == null) {
				_this8.robotModel[robotId] = {
					robot: { name: robotName }
				};
			}

			/** extract parts info **/
			var partId = d[0];
			var category = d[1];
			var partName = d[2];
			var label = d[3];
			var time = d[4];
			var code = d[5];
			var codeRef = d[6];
			var msg = d[7];
			var critLevel = d[8];

			if (_this8.robotModel[robotId].parts == null) {
				_this8.robotModel[robotId].parts = {}; // reset parts
			}
			var rParts = _this8.robotModel[robotId].parts;
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
				time: _this8._coder.from(time),
				code: _this8._coder.from(code),
				codeRef: _this8._coder.from(codeRef)
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
		var _this9 = this;

		return Promise.try(function (_) {
			var objectPath = "/fr/partnering/Status/Robots/" + _this9.splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
			_this9.request({
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
		var _this10 = this;

		var sendData = [];
		return Promise.try(function (_) {
			var req = _this10.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager'
				}
			}, function (peerId, err, objData) {

				var objectPathRobot = "/fr/partnering/Status/Robots/" + _this10.splitAndCamelCase(robotName, "-");
				var objectPathPart = "/fr/partnering/Status/Robots/" + _this10.splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
				var robotId = objData[objectPathRobot]['fr.partnering.Status.Robot'].RobotId;
				_this10.selector.request({
					service: "status",
					func: "GetPart",
					obj: {
						interface: 'fr.partnering.Status.Part',
						path: objectPathPart
					}
				}, function (peerId, err, data) {
					sendData.push(data);
					_this10._getRobotModelFromRecv2(sendData, robotId, robotName);
					if (err != null) {
						if (typeof callback === 'function') callback(-1);
					} else {
						if (typeof callback === 'function') callback(_this10.robotModel);
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

},{"bluebird":undefined,"fs":1,"util":5}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwic3JjL3N0YXR1cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUMxa0JBOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCQTs7Ozs7Ozs7Ozs7O0FBWUEsQ0FBQyxZQUFVOztBQUVWLEtBQUksWUFBWSxFQUFFLE9BQU8sTUFBUCxLQUFrQixXQUFwQixDQUFoQjtBQUNBLEtBQUcsQ0FBQyxTQUFKLEVBQWU7QUFBRSxNQUFJLFVBQVUs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QjtBQUNoQixVQUFJLE9BQU8sUUFBUCxLQUFvQixVQUF4QixFQUFvQyxTQUFTLENBQUMsQ0FBVjtBQUNwQyxNQUZELE1BR0s7QUFDSixVQUFJLE9BQU8sUUFBUCxLQUFvQixVQUF4QixFQUFvQyxTQUFTLFFBQUssVUFBZDtBQUNwQztBQUNELEtBaEJEO0FBaUJBLElBNUJTLENBQVY7QUE2QkEsR0E5Qk0sRUE4QkosS0E5QkksQ0E4QkUsZUFBTztBQUNmLFVBQU8sS0FBUCxDQUFhLEdBQWI7QUFDQSxHQWhDTSxDQUFQO0FBaUNBLEVBbkNEOztBQXFDQSxRQUFPLFNBQVAsQ0FBaUIsaUJBQWpCLEdBQXFDLFVBQVUsUUFBVixFQUFvQixTQUFwQixFQUErQjtBQUNuRSxNQUFJLG1CQUFtQixTQUFTLEtBQVQsQ0FBZSxTQUFmLENBQXZCO0FBQ0EsTUFBSSxpQkFBaUIsRUFBckI7QUFDQSxtQkFBaUIsT0FBakIsQ0FBeUIsZUFBTztBQUMvQixxQkFBa0IsSUFBSSxNQUFKLENBQVcsQ0FBWCxFQUFjLFdBQWQsS0FBOEIsSUFBSSxTQUFKLENBQWMsQ0FBZCxDQUFoRDtBQUNBLEdBRkQ7QUFHQSxTQUFPLGNBQVA7QUFDQSxFQVBEO0FBU0EsQ0FsNkJEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc31yZXR1cm4gZX0pKCkiLCIiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwiaW1wb3J0IHsgU3RhdHMgfSBmcm9tICdmcyc7XG5cbi8qXG4gKiBDb3B5cmlnaHQgOiBQYXJ0bmVyaW5nIDMuMCAoMjAwNy0yMDE2KVxuICogQXV0aG9yIDogU3lsdmFpbiBNYWjDqSA8c3lsdmFpbi5tYWhlQHBhcnRuZXJpbmcuZnI+XG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgZGl5YS1zZGsuXG4gKlxuICogZGl5YS1zZGsgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogZGl5YS1zZGsgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggZGl5YS1zZGsuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuXG5cblxuXG4vKiBtYXlhLWNsaWVudFxuICogQ29weXJpZ2h0IChjKSAyMDE0LCBQYXJ0bmVyaW5nIFJvYm90aWNzLCBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVGhpcyBsaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vclxuICogbW9kaWZ5IGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBhcyBwdWJsaXNoZWQgYnkgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbjsgdmVyc2lvblxuICpcdDMuMCBvZiB0aGUgTGljZW5zZS4gVGhpcyBsaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlXG4gKiB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLCBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlblxuICogdGhlIGltcGxpZWQgd2FycmFudHkgb2YgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUlxuICogUFVSUE9TRS4gU2VlIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIGxpYnJhcnkuXG4gKi9cbihmdW5jdGlvbigpe1xuXG5cdHZhciBpc0Jyb3dzZXIgPSAhKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKTtcblx0aWYoIWlzQnJvd3NlcikgeyB2YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7IH1cblx0ZWxzZSB7IHZhciBQcm9taXNlID0gd2luZG93LlByb21pc2U7IH1cblx0dmFyIERpeWFTZWxlY3RvciA9IGQxLkRpeWFTZWxlY3Rvcjtcblx0dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cblxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQvLy8vLy8vLy8vLy8vLy8vLy8vIExvZ2dpbmcgdXRpbGl0eSBtZXRob2RzIC8vLy8vLy8vLy8vLy8vLy8vL1xuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cdHZhciBERUJVRyA9IHRydWU7XG5cdHZhciBMb2dnZXIgPSB7XG5cdFx0bG9nOiBmdW5jdGlvbihtZXNzYWdlKXtcblx0XHRcdGlmKERFQlVHKSBjb25zb2xlLmxvZyhtZXNzYWdlKTtcblx0XHR9LFxuXG5cdFx0ZGVidWc6IGZ1bmN0aW9uKG1lc3NhZ2UsIC4uLmFyZ3Mpe1xuXHRcdFx0aWYoREVCVUcpIGNvbnNvbGUubG9nKG1lc3NhZ2UsIC4uLmFyZ3MpO1xuXHRcdH0sXG5cblx0XHR3YXJuOiBmdW5jdGlvbihtZXNzYWdlKXtcblx0XHRcdGlmKERFQlVHKSBjb25zb2xlLndhcm4obWVzc2FnZSk7XG5cdFx0fSxcblxuXHRcdGVycm9yOiBmdW5jdGlvbihtZXNzYWdlKXtcblx0XHRcdGlmKERFQlVHKSBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICpcdGNhbGxiYWNrIDogZnVuY3Rpb24gY2FsbGVkIGFmdGVyIG1vZGVsIHVwZGF0ZWRcblx0ICogKi9cblx0ZnVuY3Rpb24gU3RhdHVzKHNlbGVjdG9yKXtcblx0XHR0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3I7XG5cdFx0dGhpcy5fY29kZXIgPSBzZWxlY3Rvci5lbmNvZGUoKTtcblx0XHR0aGlzLnN1YnNjcmlwdGlvbnMgPSBbXTtcblxuXHRcdC8qKiBtb2RlbCBvZiByb2JvdCA6IGF2YWlsYWJsZSBwYXJ0cyBhbmQgc3RhdHVzICoqL1xuXHRcdHRoaXMucm9ib3RNb2RlbCA9IFtdO1xuXHRcdHRoaXMuX3JvYm90TW9kZWxJbml0ID0gZmFsc2U7XG5cdFx0dGhpcy5fcGFydFJlZmVyZW5jZU1hcCA9IFtdO1xuXG5cdFx0LyoqKiBzdHJ1Y3R1cmUgb2YgZGF0YSBjb25maWcgKioqXG5cdFx0XHQgY3JpdGVyaWEgOlxuXHRcdFx0ICAgdGltZTogYWxsIDMgdGltZSBjcml0ZXJpYSBzaG91bGQgbm90IGJlIGRlZmluZWQgYXQgdGhlIHNhbWUgdGltZS4gKHJhbmdlIHdvdWxkIGJlIGdpdmVuIHVwKVxuXHRcdFx0ICAgICBiZWc6IHtbbnVsbF0sdGltZX0gKG51bGwgbWVhbnMgbW9zdCByZWNlbnQpIC8vIHN0b3JlZCBhIFVUQyBpbiBtcyAobnVtKVxuXHRcdFx0ICAgICBlbmQ6IHtbbnVsbF0sIHRpbWV9IChudWxsIG1lYW5zIG1vc3Qgb2xkZXN0KSAvLyBzdG9yZWQgYXMgVVRDIGluIG1zIChudW0pXG5cdFx0XHQgICAgIHJhbmdlOiB7W251bGxdLCB0aW1lfSAocmFuZ2Ugb2YgdGltZShwb3NpdGl2ZSkgKSAvLyBpbiBzIChudW0pXG5cdFx0XHQgICByb2JvdDoge0FycmF5T2YgSUQgb3IgW1wiYWxsXCJdfVxuXHRcdFx0ICAgcGxhY2U6IHtBcnJheU9mIElEIG9yIFtcImFsbFwiXX1cblx0XHRcdCBvcGVyYXRvcjoge1tsYXN0XSwgbWF4LCBtb3ksIHNkfSAtKCBtYXliZSBtb3kgc2hvdWxkIGJlIGRlZmF1bHRcblx0XHRcdCAuLi5cblxuXHRcdFx0IHBhcnRzIDoge1tudWxsXSBvciBBcnJheU9mIFBhcnRzSWR9IHRvIGdldCBlcnJvcnNcblx0XHRcdCBzdGF0dXMgOiB7W251bGxdIG9yIEFycmF5T2YgU3RhdHVzTmFtZX0gdG8gZ2V0IHN0YXR1c1xuXG5cdFx0XHQgc2FtcGxpbmc6IHtbbnVsbF0gb3IgaW50fVxuXHRcdCovXG5cdFx0dGhpcy5kYXRhQ29uZmlnID0ge1xuXHRcdFx0Y3JpdGVyaWE6IHtcblx0XHRcdFx0dGltZToge1xuXHRcdFx0XHRcdGJlZzogbnVsbCxcblx0XHRcdFx0XHRlbmQ6IG51bGwsXG5cdFx0XHRcdFx0cmFuZ2U6IG51bGwgLy8gaW4gc1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRyb2JvdDogbnVsbFxuXHRcdFx0fSxcblx0XHRcdG9wZXJhdG9yOiAnbGFzdCcsXG5cdFx0XHRwYXJ0czogbnVsbCxcblx0XHRcdHN0YXR1czogbnVsbFxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblx0LyoqXG5cdCAqIEdldCByb2JvdE1vZGVsIDpcblx0ICoge1xuXHQgKiAgcGFydHM6IHtcblx0ICpcdFx0XCJwYXJ0WFhcIjoge1xuXHQgKiBcdFx0XHQgZXJyb3JzRGVzY3I6IHsgZW5jb3VudGVyZWQgZXJyb3JzIGluZGV4ZWQgYnkgZXJyb3JJZHM+MCB9XG5cdCAqXHRcdFx0XHQ+IENvbmZpZyBvZiBlcnJvcnMgOlxuXHQgKlx0XHRcdFx0XHRjcml0TGV2ZWw6IEZMT0FULCAvLyBjb3VsZCBiZSBpbnQuLi5cblx0ICogXHRcdFx0XHRcdG1zZzogU1RSSU5HLFxuXHQgKlx0XHRcdFx0XHRzdG9wU2VydmljZUlkOiBTVFJJTkcsXG5cdCAqXHRcdFx0XHRcdHJ1blNjcmlwdDogU2VxdWVsaXplLlNUUklORyxcblx0ICpcdFx0XHRcdFx0bWlzc2lvbk1hc2s6IFNlcXVlbGl6ZS5JTlRFR0VSLFxuXHQgKlx0XHRcdFx0XHRydW5MZXZlbDogU2VxdWVsaXplLklOVEVHRVJcblx0ICpcdFx0XHRlcnJvcjpbRkxPQVQsIC4uLl0sIC8vIGNvdWxkIGJlIGludC4uLlxuXHQgKlx0XHRcdHRpbWU6W0ZMT0FULCAuLi5dLFxuXHQgKlx0XHRcdHJvYm90OltGTE9BVCwgLi4uXSxcblx0ICpcdFx0XHQvLy8gcGxhY2U6W0ZMT0FULCAuLi5dLCBub3QgaW1wbGVtZW50ZWQgeWV0XG5cdCAqXHRcdH0sXG5cdCAqXHQgXHQuLi4gKFwiUGFydFlZXCIpXG5cdCAqICB9LFxuXHQgKiAgc3RhdHVzOiB7XG5cdCAqXHRcdFwic3RhdHVzWFhcIjoge1xuXHQgKlx0XHRcdFx0ZGF0YTpbRkxPQVQsIC4uLl0sIC8vIGNvdWxkIGJlIGludC4uLlxuXHQgKlx0XHRcdFx0dGltZTpbRkxPQVQsIC4uLl0sXG5cdCAqXHRcdFx0XHRyb2JvdDpbRkxPQVQsIC4uLl0sXG5cdCAqXHRcdFx0XHQvLy8gcGxhY2U6W0ZMT0FULCAuLi5dLCBub3QgaW1wbGVtZW50ZWQgeWV0XG5cdCAqXHRcdFx0XHRyYW5nZTogW0ZMT0FULCBGTE9BVF0sXG5cdCAqXHRcdFx0XHRsYWJlbDogc3RyaW5nXG5cdCAqXHRcdFx0fSxcblx0ICpcdCBcdC4uLiAoXCJTdGF0dXNZWVwiKVxuXHQgKiAgfVxuXHQgKiB9XG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmdldFJvYm90TW9kZWwgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLnJvYm90TW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhQ29uZmlnIGNvbmZpZyBmb3IgZGF0YSByZXF1ZXN0XG5cdCAqIGlmIGRhdGFDb25maWcgaXMgZGVmaW5lIDogc2V0IGFuZCByZXR1cm4gdGhpc1xuXHQgKlx0IEByZXR1cm4ge1N0YXR1c30gdGhpc1xuXHQgKiBlbHNlXG5cdCAqXHQgQHJldHVybiB7T2JqZWN0fSBjdXJyZW50IGRhdGFDb25maWdcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YUNvbmZpZyA9IGZ1bmN0aW9uKG5ld0RhdGFDb25maWcpe1xuXHRcdGlmKG5ld0RhdGFDb25maWcpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZz1uZXdEYXRhQ29uZmlnO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB0aGlzLmRhdGFDb25maWc7XG5cdH07XG5cdC8qKlxuXHQgKiBUTyBCRSBJTVBMRU1FTlRFRCA6IG9wZXJhdG9yIG1hbmFnZW1lbnQgaW4gRE4tU3RhdHVzXG5cdCAqIEBwYXJhbSAge1N0cmluZ31cdCBuZXdPcGVyYXRvciA6IHtbbGFzdF0sIG1heCwgbW95LCBzZH1cblx0ICogQHJldHVybiB7U3RhdHVzfSB0aGlzIC0gY2hhaW5hYmxlXG5cdCAqIFNldCBvcGVyYXRvciBjcml0ZXJpYS5cblx0ICogRGVwZW5kcyBvbiBuZXdPcGVyYXRvclxuXHQgKlx0QHBhcmFtIHtTdHJpbmd9IG5ld09wZXJhdG9yXG5cdCAqXHRAcmV0dXJuIHRoaXNcblx0ICogR2V0IG9wZXJhdG9yIGNyaXRlcmlhLlxuXHQgKlx0QHJldHVybiB7U3RyaW5nfSBvcGVyYXRvclxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5EYXRhT3BlcmF0b3IgPSBmdW5jdGlvbihuZXdPcGVyYXRvcil7XG5cdFx0aWYobmV3T3BlcmF0b3IpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5vcGVyYXRvciA9IG5ld09wZXJhdG9yO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB0aGlzLmRhdGFDb25maWcub3BlcmF0b3I7XG5cdH07XG5cdC8qKlxuXHQgKiBEZXBlbmRzIG9uIG51bVNhbXBsZXNcblx0ICogQHBhcmFtIHtpbnR9IG51bWJlciBvZiBzYW1wbGVzIGluIGRhdGFNb2RlbFxuXHQgKiBpZiBkZWZpbmVkIDogc2V0IG51bWJlciBvZiBzYW1wbGVzXG5cdCAqXHRAcmV0dXJuIHtTdGF0dXN9IHRoaXNcblx0ICogZWxzZVxuXHQgKlx0QHJldHVybiB7aW50fSBudW1iZXIgb2Ygc2FtcGxlc1xuXHQgKiovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YVNhbXBsaW5nID0gZnVuY3Rpb24obnVtU2FtcGxlcyl7XG5cdFx0aWYobnVtU2FtcGxlcykge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLnNhbXBsaW5nID0gbnVtU2FtcGxlcztcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gdGhpcy5kYXRhQ29uZmlnLnNhbXBsaW5nO1xuXHR9O1xuXHQvKipcblx0ICogU2V0IG9yIGdldCBkYXRhIHRpbWUgY3JpdGVyaWEgYmVnIGFuZCBlbmQuXG5cdCAqIElmIHBhcmFtIGRlZmluZWRcblx0ICpcdEBwYXJhbSB7RGF0ZX0gbmV3VGltZUJlZyAvLyBtYXkgYmUgbnVsbFxuXHQgKlx0QHBhcmFtIHtEYXRlfSBuZXdUaW1lRW5kIC8vIG1heSBiZSBudWxsXG5cdCAqXHRAcmV0dXJuIHtTdGF0dXN9IHRoaXNcblx0ICogSWYgbm8gcGFyYW0gZGVmaW5lZDpcblx0ICpcdEByZXR1cm4ge09iamVjdH0gVGltZSBvYmplY3Q6IGZpZWxkcyBiZWcgYW5kIGVuZC5cblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YVRpbWUgPSBmdW5jdGlvbihuZXdUaW1lQmVnLG5ld1RpbWVFbmQsIG5ld1JhbmdlKXtcblx0XHRpZihuZXdUaW1lQmVnIHx8IG5ld1RpbWVFbmQgfHwgbmV3UmFuZ2UpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS50aW1lLmJlZyA9IG5ld1RpbWVCZWcuZ2V0VGltZSgpO1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUuZW5kID0gbmV3VGltZUVuZC5nZXRUaW1lKCk7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5yYW5nZSA9IG5ld1JhbmdlO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGJlZzogbmV3IERhdGUodGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUuYmVnKSxcblx0XHRcdFx0ZW5kOiBuZXcgRGF0ZSh0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5lbmQpLFxuXHRcdFx0XHRyYW5nZTogbmV3IERhdGUodGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUucmFuZ2UpXG5cdFx0XHR9O1xuXHR9O1xuXHQvKipcblx0ICogRGVwZW5kcyBvbiByb2JvdElkc1xuXHQgKiBTZXQgcm9ib3QgY3JpdGVyaWEuXG5cdCAqXHRAcGFyYW0ge0FycmF5W0ludF19IHJvYm90SWRzIGxpc3Qgb2Ygcm9ib3QgSWRzXG5cdCAqIEdldCByb2JvdCBjcml0ZXJpYS5cblx0ICpcdEByZXR1cm4ge0FycmF5W0ludF19IGxpc3Qgb2Ygcm9ib3QgSWRzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFSb2JvdElkcyA9IGZ1bmN0aW9uKHJvYm90SWRzKXtcblx0XHRpZihyb2JvdElkcykge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnJvYm90ID0gcm9ib3RJZHM7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS5yb2JvdDtcblx0fTtcblx0LyoqXG5cdCAqIERlcGVuZHMgb24gcGxhY2VJZHMgLy8gbm90IHJlbGV2YW50Pywgbm90IGltcGxlbWVudGVkIHlldFxuXHQgKiBTZXQgcGxhY2UgY3JpdGVyaWEuXG5cdCAqXHRAcGFyYW0ge0FycmF5W0ludF19IHBsYWNlSWRzIGxpc3Qgb2YgcGxhY2UgSWRzXG5cdCAqIEdldCBwbGFjZSBjcml0ZXJpYS5cblx0ICpcdEByZXR1cm4ge0FycmF5W0ludF19IGxpc3Qgb2YgcGxhY2UgSWRzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFQbGFjZUlkcyA9IGZ1bmN0aW9uKHBsYWNlSWRzKXtcblx0XHRpZihwbGFjZUlkcykge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnBsYWNlSWQgPSBwbGFjZUlkcztcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gdGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnBsYWNlO1xuXHR9O1xuXHQvKipcblx0ICogR2V0IGRhdGEgYnkgc2Vuc29yIG5hbWUuXG5cdCAqXHRAcGFyYW0ge0FycmF5W1N0cmluZ119IHNlbnNvck5hbWUgbGlzdCBvZiBzZW5zb3JzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmdldERhdGFCeU5hbWUgPSBmdW5jdGlvbihzZW5zb3JOYW1lcyl7XG5cdFx0dmFyIGRhdGE9W107XG5cdFx0Zm9yKHZhciBuIGluIHNlbnNvck5hbWVzKSB7XG5cdFx0XHRkYXRhLnB1c2godGhpcy5kYXRhTW9kZWxbc2Vuc29yTmFtZXNbbl1dKTtcblx0XHR9XG5cdFx0cmV0dXJuIGRhdGE7XG5cdH07XG5cblx0Ly8gLyoqXG4gXHQvLyAgKiBHZXQgYWxsIHN0YXR1c2VzIHdpdGhpbiA0IGRheXNcblx0Ly8gICogQHBhcmFtIHsqfSByb2JvdF9vYmplY3QgXG5cdC8vICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXHRcdHJldHVybiBjYWxsYmFjaygtMSBpZiBub3QgZm91bmQvZGF0YSBvdGhlcndpc2UpXG5cdC8vICAqL1xuXHQvLyBTdGF0dXMucHJvdG90eXBlLl9nZXRBbmRVcGRhdGVNdWx0aWRheVN0YXR1c2VzID0gZnVuY3Rpb24gKHJvYm90X29iamVjdHMsIGNhbGxiYWNrKSB7XG5cdC8vIFx0TG9nZ2VyLmRlYnVnKGBTdGF0dXMuZ2V0SW5pdGlhbFN0YXR1c2ApXG5cdC8vIFx0cm9ib3Rfb2JqZWN0cy5mb3JFYWNoKG9iamVjdCA9PiB7XG5cdC8vIFx0XHRpZiAob2JqZWN0LlJvYm90SWQgPT0gbnVsbCB8fCBvYmplY3QuUm9ib3ROYW1lID09IG51bGwpIHtcblx0Ly8gXHRcdFx0TG9nZ2VyLndhcm4oYE11bHRpZGF5IHN0YXR1cyByZXF1ZXN0IGVycm9yOiBib3RoIFJvYm90SWQgYW5kIFJvYm90TmFtZSBzaG91bGQgYmUgbm90IG51bGw6ICR7b2JqZWN0LlJvYm90SWR9LCAke29iamVjdC5Sb2JvdE5hbWV9YClcblx0Ly8gXHRcdFx0cmV0dXJuXG5cdC8vIFx0XHR9XG5cdC8vIFx0XHRsZXQgcmVxID0ge1xuXHQvLyBcdFx0XHRzZXJ2aWNlOiBcInN0YXR1c1wiLFxuXHQvLyBcdFx0XHRmdW5jOiBcIkdldE11bHRpZGF5U3RhdHVzZXNcIixcblx0Ly8gXHRcdFx0b2JqOiB7XG5cdC8vIFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMnLFxuXHQvLyBcdFx0XHRcdHBhdGg6IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzXCJcblx0Ly8gXHRcdFx0fSxcblx0Ly8gXHRcdFx0ZGF0YToge1xuXHQvLyBcdFx0XHRcdHJvYm90X25hbWVzOiBbb2JqZWN0LlJvYm90TmFtZV1cblx0Ly8gXHRcdFx0fVxuXHQvLyBcdFx0fVxuXHQvLyBcdFx0bGV0IGZuID0gKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdC8vIFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHQvLyBcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKC0xKTtcblx0Ly8gXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKVxuXHQvLyBcdFx0XHR9XG5cdC8vIFx0XHRcdExvZ2dlci5kZWJ1ZygnUmVjZWl2ZWQgbXVsdGlkYXkgc3RhdHVzZXMgb2Ygcm9ib3QnLCBvYmplY3QuUm9ib3RJZCwgb2JqZWN0LlJvYm90TmFtZSwgZGF0YSlcblx0Ly8gXHRcdFx0Ly8gVXBkYXRlIHJvYm90TW9kZWwgdmFyaWFibGVcblx0Ly8gXHRcdFx0dGhpcy5fZ2V0Um9ib3RNb2RlbEZyb21SZWN2MihkYXRhLCBvYmplY3QuUm9ib3RJZCwgb2JqZWN0LlJvYm90TmFtZSk7XG5cdC8vIFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0Ly8gXHRcdFx0XHRjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwpXG5cdC8vIFx0XHRcdH1cblx0Ly8gXHRcdH1cblx0Ly8gXHRcdExvZ2dlci5kZWJ1ZyhgUmVxdWVzdGluZyBtdWx0aWRheSBzdGF0dXNlcyBvZiByb2JvdDpgLCBvYmplY3QuUm9ib3RJZCwgb2JqZWN0LlJvYm90TmFtZSlcblx0Ly8gXHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdChyZXEsIGZuKVxuXHQvLyBcdH0pXG5cdC8vIH07XG5cblx0U3RhdHVzLnByb3RvdHlwZS5fc3Vic2NyaWJlVG9NdWx0aWRheVN0YXR1c1VwZGF0ZSA9IGZ1bmN0aW9uIChyb2JvdF9vYmplY3RzLCBjYWxsYmFjaykge1xuXHRcdExvZ2dlci5kZWJ1ZyhgU3Vic2NyaWJlIHRvIE11bHRpZGF5U3RhdHVzVXBkYXRlYClcblx0XHRsZXQgc3VicyA9IHRoaXMuc2VsZWN0b3Iuc3Vic2NyaWJlKHtcblx0XHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0XHRcdGZ1bmM6ICdNdWx0aWRheVN0YXR1c1VwZGF0ZWQnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cycsXG5cdFx0XHRcdFx0cGF0aDogXCIvZnIvcGFydG5lcmluZy9TdGF0dXNcIlxuXHRcdFx0XHR9XG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0TG9nZ2VyLmRlYnVnKGBSRUNFSVZFRCBTVUJTQ1JJUFRJT05gLCBkYXRhKVxuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJTdGF0dXNTdWJzY3JpYmU6XCIgKyBlcnIpXG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KGRhdGEpKSB7XG5cdFx0XHRcdFx0TG9nZ2VyLndhcm4oXCJNYWxmb3JtZWQgZGF0YSBmcm9tIHNpZ25hbCBNdWx0aWRheVN0YXR1c1VwZGF0ZWQ6XCIgKyBkYXRhKVxuXHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHR9XG5cdFx0XHRcdGxldCB1bnBhY2tlZERhdGEgPSB0aGlzLl91bnBhY2tSb2JvdE1vZGVscyhkYXRhWzBdKVxuXHRcdFx0XHRMb2dnZXIuZGVidWcoYE11bHRpZGF5U3RhdHVzVXBkYXRlZCBpcyBjYWxsZWQsIGRhdGE6YCwgdW5wYWNrZWREYXRhKVxuXHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHVucGFja2VkRGF0YSkgLy8gdXBkYXRlIHRoaXMucm9ib3RNb2RlbFxuXHRcdFx0XHRMb2dnZXIuZGVidWcoYFJvYm90TW9kZWwgYWZ0ZXIgdW5wYWNrZWQ6YCwgdGhpcy5yb2JvdE1vZGVsKVxuXHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2sodGhpcy5yb2JvdE1vZGVsKTtcblx0XHRcdFx0fVxuXHRcdH0pXG5cdFx0dGhpcy5zdWJzY3JpcHRpb25zLnB1c2goc3VicylcblxuXHRcdExvZ2dlci5kZWJ1ZyhgU2VuZCByZXF1ZXN0IGZvciBNdWx0aWRheVN0YXR1c1VwZGF0ZWAsIHJvYm90TmFtZXMpXG5cdFx0bGV0IHJvYm90TmFtZXMgPSByb2JvdF9vYmplY3RzLm1hcChyb2JvdCA9PiByb2JvdC5Sb2JvdE5hbWUpXG5cdFx0dGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdFx0ZnVuYzogXCJUcmlnZ2VyTXVsdGlkYXlTdGF0dXNlc1wiLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cycsXG5cdFx0XHRcdFx0cGF0aDogXCIvZnIvcGFydG5lcmluZy9TdGF0dXNcIlxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0cm9ib3RfbmFtZXM6IHJvYm90TmFtZXNcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdC8vIERvIG5vdGhpbmcgc2luY2UgdGhlIHNlcnZlciBzaG91bGQgcmVwb25zZSBiYWNrIHZpYSBzaWduYWxzXG5cdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdExvZ2dlci53YXJuKGBDYW5ub3QgY29ubmVjdCB0byBzdGF0dXMgc2VydmljZTogJHtlcnJ9YClcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjaygtMSk7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGVycilcblx0XHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHQvKipcblx0ICogR2V0ICdQYXJ0cycgcmVmZXJlbmNlIG1hcCB0byByZWR1Y2Ugc3RhdHVzIHBheWxvYWQuIER1cGxpY2F0ZWQgY29udGVudHMgaW4gc3RhdHVzIGFyZSBzdG9yZWQgaW4gdGhlIG1hcC5cblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuX2dldFBhcnRSZWZlcmVuY2VNYXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKHRoaXMuX3BhcnRSZWZlcmVuY2VNYXAgPT0gbnVsbCB8fCB0aGlzLl9wYXJ0UmVmZXJlbmNlTWFwLmxlbmd0aCA9PSAwKSB7XG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRcdHNlcnZpY2U6ICdTdGF0dXMnLFxuXHRcdFx0XHRcdGZ1bmM6ICdHZXRQYXJ0UmVmZXJlbmNlTWFwJyxcblx0XHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzJyxcblx0XHRcdFx0XHRcdHBhdGg6ICcvZnIvcGFydG5lcmluZy9TdGF0dXMnXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0XHRMb2dnZXIuZGVidWcoYFBhcnRSZWZlcmVuY2VNYXAsIGVycmAsIGRhdGEsIGVycilcblx0XHRcdFx0XHRpZiAoZGF0YSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRkYXRhID0gW11cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy5fcGFydFJlZmVyZW5jZU1hcCA9IGRhdGFcblx0XHRcdFx0XHRyZXNvbHZlKCkgLy8gcmV0dXJucyBhIG1hcCBvZiBwYXJ0aWQgdG8gaXRzIHByb3BlcnRpZXNcblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0fVxuXHRcdExvZ2dlci5kZWJ1ZygnUGFydFJlZmVyZW5jZU1hcCBhbHJlYWR5IGV4aXN0cywgbm8gbmVlZCB0byByZXF1ZXN0LiBOdW1iZXIgb2YgcGFydHM6JywgdGhpcy5fcGFydFJlZmVyZW5jZU1hcC5sZW5ndGgpXG5cdH07XG5cblx0LyoqXG5cdCAqIEdldCAnU3RhdHVzRXZ0cycgcmVmZXJlbmNlIG1hcCB0byByZWR1Y2Ugc3RhdHVzIHBheWxvYWQuIER1cGxpY2F0ZWQgY29udGVudHMgaW4gc3RhdHVzIGFyZSBzdG9yZWQgaW4gdGhlIG1hcC5cblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuX2dldFN0YXR1c0V2dFJlZmVyZW5jZU1hcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAodGhpcy5fc3RhdHVzRXZ0UmVmZXJlbmNlTWFwID09IG51bGwgfHwgdGhpcy5fc3RhdHVzRXZ0UmVmZXJlbmNlTWFwLmxlbmd0aCA9PSAwKSB7XG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRcdHNlcnZpY2U6ICdTdGF0dXMnLFxuXHRcdFx0XHRcdGZ1bmM6ICdHZXRTdGF0dXNFdnRSZWZlcmVuY2VNYXAnLFxuXHRcdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMnLFxuXHRcdFx0XHRcdFx0cGF0aDogJy9mci9wYXJ0bmVyaW5nL1N0YXR1cydcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdExvZ2dlci5kZWJ1ZyhgU3RhdHVzRXZ0UmVmZXJlbmNlTWFwLCBlcnJgLCBkYXRhLCBlcnIpXG5cdFx0XHRcdFx0aWYgKGRhdGEgPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0ZGF0YSA9IFtdXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRoaXMuX3N0YXR1c0V2dFJlZmVyZW5jZU1hcCA9IGRhdGFcblx0XHRcdFx0XHRyZXNvbHZlKCkgLy8gcmV0dXJucyBhIG1hcCBvZiBwYXJ0aWQgdG8gaXRzIHByb3BlcnRpZXNcblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0fVxuXHRcdExvZ2dlci5kZWJ1ZygnU3RhdHVzRXZ0UmVmZXJlbmNlTWFwIGFscmVhZHkgZXhpc3RzLCBubyBuZWVkIHRvIHJlcXVlc3QuIE51bWJlciBvZiBwYXJ0czonLCB0aGlzLl9zdGF0dXNFdnRSZWZlcmVuY2VNYXAubGVuZ3RoKVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBTdWJzY3JpYmVzIHRvIHN0YXR1cyBjaGFuZ2VzIGZvciBhbGwgcGFydHNcblx0ICogQHBhcmFtIHsqfSBwYXJ0cyBcblx0ICogQHBhcmFtIHsqfSBjYWxsYmFjayBcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuX3N1YnNjcmliZVRvU3RhdHVzQ2hhbmdlZCA9IGZ1bmN0aW9uIChwYXJ0cywgY2FsbGJhY2spIHtcblx0XHRpZiAocGFydHMgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0aWYgKHRydWUpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdHBhcnRzLmZvckVhY2gocGFydCA9PiB7XG5cdFx0XHRsZXQgb2JqID0ge1xuXHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHRcdFx0ZnVuYzogJ1N0YXR1c0NoYW5nZWQnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0XHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGxldCBmbiA9IChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJTdGF0dXNTdWJzY3JpYmU6XCIgKyBlcnIpXG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblx0XHRcdFx0TG9nZ2VyLmRlYnVnKGBTdGF0dXNDaGFuZ2VkIGlzIGNhbGxlZCwgZGF0YTpgLCBkYXRhKVxuXHRcdFx0XHQvLyBVcGRhdGUgcm9ib3RNb2RlbCB2YXJpYWJsZVxuXHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKGRhdGEsIHBhcnQuUm9ib3RJZCwgcGFydC5Sb2JvdE5hbWUpO1xuXHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2sodGhpcy5yb2JvdE1vZGVsKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0bGV0IHN1YnMgPSB0aGlzLnNlbGVjdG9yLnN1YnNjcmliZShvYmosIGZuKTtcblx0XHRcdHRoaXMuc3Vic2NyaXB0aW9ucy5wdXNoKHN1YnMpO1xuXHRcdH0pXG5cblx0Ly8gXHRsZXQgc3VicyA9IHRoaXMuc2VsZWN0b3Iuc3Vic2NyaWJlKHsvLyBzdWJzY3JpYmVzIHRvIHN0YXR1cyBjaGFuZ2VzIGZvciBhbGwgcGFydHNcblx0Ly8gXHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHQvLyBcdFx0ZnVuYzogJ1N0YXR1c0NoYW5nZWQnLFxuXHQvLyBcdFx0b2JqOiB7XG5cdC8vIFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCcsXG5cdC8vIFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFxuXHQvLyBcdFx0fSxcblx0Ly8gXHRcdGRhdGE6IHJvYm90TmFtZXNcblx0Ly8gfSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdC8vIFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0Ly8gXHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJTdGF0dXNTdWJzY3JpYmU6XCIgKyBlcnIpO1xuXHQvLyBcdFx0fSBlbHNlIHtcblx0Ly8gXHRcdFx0XHRzZW5kRGF0YVswXSA9IGRhdGE7XG5cdC8vIFx0XHRcdFx0dGhpcy5fZ2V0Um9ib3RNb2RlbEZyb21SZWN2MihzZW5kRGF0YSwgcm9ib3RJZCwgcm9ib3ROYW1lKTtcblx0Ly8gXHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG5cdC8vIFx0XHRcdFx0XHRcdGNhbGxiYWNrKHRoaXMucm9ib3RNb2RlbCwgcGVlcklkKTtcblx0Ly8gXHRcdFx0XHR9XG5cdC8vIFx0XHR9XG5cdC8vIH0pO1xuXHQvLyB0aGlzLnN1YnNjcmlwdGlvbnMucHVzaChzdWJzKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFF1ZXJ5IGZvciBpbml0aWFsIHN0YXR1c2VzXG5cdCAqIFN1YnNjcmliZSB0byBlcnJvci9zdGF0dXMgdXBkYXRlc1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS53YXRjaCA9IGZ1bmN0aW9uIChyb2JvdE5hbWVzLCBjYWxsYmFjaykge1xuXHRcdExvZ2dlci5kZWJ1ZyhgU3RhdHVzLndhdGNoOiByb2JvdE5hbWVzYCwgcm9ib3ROYW1lcylcblxuXHRcdHRoaXMuc2VsZWN0b3Iuc2V0TWF4TGlzdGVuZXJzKDApO1xuXHRcdHRoaXMuc2VsZWN0b3IuX2Nvbm5lY3Rpb24uc2V0TWF4TGlzdGVuZXJzKDApO1xuXG5cdFx0Ly8gUHJvbWlzZSB0byByZXRyaWV2ZSBsaXN0IG9mIHBhaXJlZCBuZWlnaGJvcnMsIGkuZS4gYWxsIG5laWdoYm9yIHJvYm90cyBpbiB0aGUgc2FtZSBtZXNoIG5ldHdvcmtcblx0XHRsZXQgZ2V0TmVpZ2hib3JzID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0dGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHRcdFx0c2VydmljZTogJ01lc2hOZXR3b3JrJyxcblx0XHRcdFx0ZnVuYzogJ0xpc3ROZWlnaGJvcnMnLFxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBuZWlnaGJvcnMpID0+IHtcblx0XHRcdFx0TG9nZ2VyLmRlYnVnKGBuZWlnaGJvcnMsIGVycmAsIG5laWdoYm9ycywgZXJyKVxuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRyZWplY3QoZXJyKVxuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIFRoaXMgb25seSByZXR1cm5zIHRoZSBsaXN0IG9mIHBoeXNpY2FsIGRldmljZXMgcGFpcmVkIGludG8gdGhlIG1lc2ggbmV0d29yaywgdGhlIGRpeWEtc2VydmVyIGluc3RhbmNlIGlzIG5vdCBhbHJlYWR5IGluY2x1ZGVkIGluIHRoZSBsaXN0XG5cdFx0XHRcdGlmIChuZWlnaGJvcnMgPT0gbnVsbCkge1xuXHRcdFx0XHRcdG5laWdoYm9ycyA9IFtdXG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzb2x2ZShuZWlnaGJvcnMpIC8vIHJldHVybnMgYSBhcnJheSBvZiBuZWlnaGJvciBvYmplY3QsIGVhY2ggb2JqZWN0IGlzIGFuIGFycmF5IG9mIFtyb2JvdC1uYW1lLCBhZGRyZXNzLCBib29sXVxuXHRcdFx0fSlcblx0XHR9KVxuXG5cdFx0Ly8gUHJvbWlzZSB0byByZXRyaWV2ZSBhbGwgb2JqZWN0cyAocm9ib3RzLCBwYXJ0cykgZXhwb3NlZCBpbiBEQnVzIGJ5IGRpeWEtbm9kZS1zdGF0dXNcblx0XHRsZXQgZ2V0Um9ib3RzQW5kUGFydHMgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHRcdFx0ZnVuYzogJ0dldE1hbmFnZWRPYmplY3RzJyxcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnb3JnLmZyZWVkZXNrdG9wLkRCdXMuT2JqZWN0TWFuYWdlcicsXG5cdFx0XHRcdH1cblx0XHRcdH0sIChwZWVySWQsIGVyciwgb2JqRGF0YSkgPT4geyAvLyBnZXQgYWxsIG9iamVjdCBwYXRocywgaW50ZXJmYWNlcyBhbmQgcHJvcGVydGllcyBjaGlsZHJlbiBvZiBTdGF0dXNcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsIHx8IG9iakRhdGEgPT0gbnVsbCkge1xuXHRcdFx0XHRcdHJlamVjdChlcnIpXG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzb2x2ZShvYmpEYXRhKSAvLyByZXR1cm5zIGEgbWFwIHRoYXQgbGlua3MgdGhlIG9iamVjdCBwYXRoIHRvIGl0cyBjb3JyZXNwb25kaW5nIGludGVyZmFjZVxuXHRcdFx0fSlcblx0XHR9KVxuXG5cdFx0bGV0IHJvYm90SWZhY2UgPSAnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXG5cdFx0bGV0IHBhcnRJZmFjZSA9ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0J1xuXG5cdFx0Ly8ganMgb2JqZWN0cyBvZiByb2JvdHMgYW5kIHBhcnRzXG5cdFx0bGV0IHJvYm90TWFwID0gbmV3IE1hcCgpIC8vIG1hcCByb2JvdCBuYW1lIHRvIGlkXG5cdFx0bGV0IHJvYm90cyA9IFtdIC8vIGxpc3Qgb2Ygcm9ib3Qgb2JqZWN0c1xuXHRcdGxldCBwYXJ0cyA9IFtdIC8vIGxpc3Qgb2YgcGFydCBvYmplY3Rcblx0XHRsZXQgbWVzaGVkUm9ib3ROYW1lcyA9IFtdIC8vIGxpc3Qgb2YgbmFtZXMgb2Ygcm9ib3RzIGFuZCBkaXlhLXNlcnZlciBpbiB0aGUgbWVzaCBuZXR3b3JrXG5cblx0XHQvLyBSZXRyaWV2ZSByZWZlcmVuY2UgbWFwIG9mIGtleXMgYW5kIHZhbHVlcyBpbiBvcmRlciB0byByZWR1Y2UgcGF5bG9hZCBmb3Igc3RhdHVzIHJlcXVlc3RzXG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KF8gPT4gdGhpcy5fZ2V0UGFydFJlZmVyZW5jZU1hcCgpKVxuXHRcdFx0LnRoZW4oXyA9PiB0aGlzLl9nZXRTdGF0dXNFdnRSZWZlcmVuY2VNYXAoKSlcblx0XHRcdC50aGVuKF8gPT4gZ2V0TmVpZ2hib3JzKVxuXHRcdFx0LnRoZW4ocmV0ID0+IHtcblx0XHRcdFx0aWYgKHJldCA9PSBudWxsIHx8ICFBcnJheS5pc0FycmF5KHJldCkpIHtcblx0XHRcdFx0XHRtZXNoZWRSb2JvdE5hbWVzID0gW11cblx0XHRcdFx0fVxuXHRcdFx0XHRsZXQgaG9zdG5hbWUgPSB0aGlzLnNlbGVjdG9yLl9jb25uZWN0aW9uLl9zZWxmXG5cdFx0XHRcdG1lc2hlZFJvYm90TmFtZXMgPSByZXQubWFwKHIgPT4gclswXSkgLy8gd2Ugb25seSBrZWVwIHRoZSByb2JvdCBuYW1lc1xuXHRcdFx0XHRpZiAoIW1lc2hlZFJvYm90TmFtZXMuaW5jbHVkZXMoaG9zdG5hbWUpKSB7XG5cdFx0XHRcdFx0bWVzaGVkUm9ib3ROYW1lcy5wdXNoKGhvc3RuYW1lKSAvLyBhZGQgaG9zdG5hbWUsIGkuZS4gdGhlIGRpeWEtc2VydmVyLCB3aGljaCBpcyBub3QgaW4gdGhlIGxpc3Qgb2YgbmVpZ2hib3JzXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQudGhlbihfID0+IGdldFJvYm90c0FuZFBhcnRzKVxuXHRcdFx0LnRoZW4ocmV0ID0+IHtcblx0XHRcdFx0Zm9yIChsZXQgb2JqZWN0UGF0aCBpbiByZXQpIHtcblx0XHRcdFx0XHQvLyB0aGUgb2JqZWN0IG9idGFpbmVkIGZyb20gdGhlIG9iamVjdCBwYXRoXG5cdFx0XHRcdFx0bGV0IG9iamVjdCA9IHJldFtvYmplY3RQYXRoXVxuXG5cdFx0XHRcdFx0Ly8gaWYgdGhlIHJldHVybiBvYmplY3QgaXMgb2YgYSByb2JvdCBpbiB0aGUgbGlzdCBvZiBuZWlnaGJvcnMsIG9yIG9mIHRoZSBkaXlhLXNlcnZlciwgcmV0cmlldmUgYWxsIG9maXRzIHJlbGV2YW50IHN0YXR1c2VzXG5cdFx0XHRcdFx0aWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShyb2JvdElmYWNlKSkgeyAvLyB0aGlzIGlzIHJvYm90IG9iamVjdFxuXHRcdFx0XHRcdFx0cm9ib3RzLnB1c2gob2JqZWN0W3JvYm90SWZhY2VdKVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIGlmIHRoZSByZXR1cm4gb2JqZWN0IGlzIG9mIGEgcGFydCwgbGlzdGVuIHRvIHNpZ25hbCBTdGF0dXNDaGFuZ2VkIG9mIHRoZSBwYXJ0XG5cdFx0XHRcdFx0aWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShwYXJ0SWZhY2UpKSB7IC8vIHRoaXMgaXMgYSBwYXJ0IG9iamVjdFxuXHRcdFx0XHRcdFx0bGV0IHBhcnQgPSBvYmplY3RbcGFydElmYWNlXVxuXHRcdFx0XHRcdFx0cGFydC5vYmplY3RQYXRoID0gb2JqZWN0UGF0aFxuXHRcdFx0XHRcdFx0cGFydC5Sb2JvdE5hbWUgPSBvYmplY3RQYXRoLnNwbGl0KCcvJylbNV0gLyogL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9CMVIwMDAzNy9QYXJ0cy92b2N0ICovXG5cdFx0XHRcdFx0XHRwYXJ0cy5wdXNoKHBhcnQpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0TG9nZ2VyLmRlYnVnKCdyb2JvdHMnLCByb2JvdHMpXG5cdFx0XHRcdExvZ2dlci5kZWJ1ZygncGFydHMnLCBwYXJ0cylcblxuXHRcdFx0XHQvLyBmaWxlciBhbmQga2VlcCB0aGUgZGl5YS1zZXJ2ZXIgYW5kIHRoZSByb2JvdHMgdGhhdCBhcmUgb25seSBpbiB0aGUgc2FtZSBtZXNoIG5ldHdvcmtzXG5cdFx0XHRcdHJvYm90cyA9IHJvYm90cy5maWx0ZXIocm9ib3QgPT4gbWVzaGVkUm9ib3ROYW1lcy5pbmNsdWRlcyhyb2JvdC5Sb2JvdE5hbWUpKSAvLyBvbmx5IGtlZXBzIHJvYm90cyB0aGF0IGFyZSBuZWlnaGJvcnMgKGkuZS4gaW4gdGhlIHNhbWUgbWVzaCBuZXR3b3JrKVxuXG5cdFx0XHRcdC8vIGZpbHRlciBwYXJ0cyB0aGF0IGJlbG9uZ3MgdG8gdGhlIHJvYm90IGluIHRoZSBtZXNoIG5ldHdvcmsgKGluY2x1ZGluZyB0aGUgZGl5YS1zZXJ2ZXIpXG5cdFx0XHRcdHBhcnRzID0gcGFydHMuZmlsdGVyKHBhcnQgPT4gbWVzaGVkUm9ib3ROYW1lcy5pbmNsdWRlcyhwYXJ0LlJvYm90TmFtZSkpIC8vIG9ubHkga2VlcHMgcGFydHMgYmVsb25naW5nIHRvIG5laWdoYm9ycyAoaS5lLiBpbiB0aGUgc2FtZSBtZXNoIG5ldHdvcmspXG5cblx0XHRcdFx0Ly8gY3JlYXRlIG1hcCBvZiByb2JvdCBuYW1lIHRvIGlkIGZvciBzZXR0aW5nIFJvYm90SWQgdG8gcGF0aHNcblx0XHRcdFx0cm9ib3RzLmZvckVhY2gocm9ib3QgPT4ge1xuXHRcdFx0XHRcdGlmIChyb2JvdE1hcC5oYXMocm9ib3QuUm9ib3ROYW1lKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJvYm90TWFwLnNldChyb2JvdC5Sb2JvdE5hbWUsIHJvYm90LlJvYm90SWQpXG5cdFx0XHRcdH0pXG5cblx0XHRcdFx0Ly8gc2V0IFJvYm90SWQgdG8gZWFjaCBwYXJ0XG5cdFx0XHRcdHBhcnRzLmZvckVhY2gocGFydCA9PiB7XG5cdFx0XHRcdFx0cGFydC5Sb2JvdElkID0gcm9ib3RNYXAuZ2V0KHBhcnQuUm9ib3ROYW1lKVxuXHRcdFx0XHR9KVxuXHRcdFx0XHRcblx0XHRcdFx0TG9nZ2VyLmRlYnVnKCdtZXNoZWQgcm9ib3RzJywgcm9ib3RzKVxuXHRcdFx0XHRMb2dnZXIuZGVidWcoJ21lc2hlZCBwYXJ0cycsIHBhcnRzKVxuXHRcdFx0fSlcblx0XHRcdC8vIFNlbmRpbmcgZml4ZWQgY2h1bmtzIHRvIGxpbWl0IHBheWxvYWRcblx0XHRcdC50aGVuKF8gPT4gdGhpcy5fc3Vic2NyaWJlVG9NdWx0aWRheVN0YXR1c1VwZGF0ZShyb2JvdHMsIGNhbGxiYWNrKSkgLy8gUmV0cmlldmUgaW5pdGlhbCBzdGF0dXNlcyBmcm9tIHRoZSBmaWx0ZXJlZCByb2JvdHNcblx0XHRcdFxuXHRcdFx0Ly8gT0sgLSBpbiBjYXNlIHNlbmRpbmcgYSBsYXJnZSBjaHVuayBmb3IgZWFjaCByb2JvdCwgcGF5bG9hZCBjYW4gYmUgbGFyZ2Vcblx0XHRcdC8vIC50aGVuKF8gPT4gdGhpcy5fZ2V0QW5kVXBkYXRlTXVsdGlkYXlTdGF0dXNlcyhyb2JvdHMsIGNhbGxiYWNrKSkgLy8gUmV0cmlldmUgaW5pdGlhbCBzdGF0dXNlcyBmcm9tIHRoZSBmaWx0ZXJlZCByb2JvdHNcblx0XHRcdC8vIC50aGVuKF8gPT4gdGhpcy5fc3Vic2NyaWJlVG9TdGF0dXNDaGFuZ2VkKHBhcnRzLCBjYWxsYmFjaykpIC8vIExpc3RlbiB0byBTdGF0dXNDaGFuZ2UgZnJvbSB0aGUgcGFydHMgYmVsb25naW5nIHRvIHRoZSBmaWx0ZXJlZCByb2JvdHNcblxuXHRcdGlmICh0cnVlKSByZXR1cm5cblxuXHRcdC8vIC8vIFN1YnNjcmliZSB0byBzaWduYWxzXG5cblx0XHQvLyBsZXQgc2VuZERhdGEgPSBbXTtcblx0XHQvLyBsZXQgcm9ib3RJZHMgPSBbXTtcblx0XHQvLyByZXR1cm4gUHJvbWlzZS50cnkoXyA9PiB7XG5cdFx0Ly8gXHRsZXQgcmVxID0gdGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHQvLyBcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0Ly8gXHRcdGZ1bmM6ICdHZXRNYW5hZ2VkT2JqZWN0cycsXG5cdFx0Ly8gXHRcdG9iajoge1xuXHRcdC8vIFx0XHRcdGludGVyZmFjZTogJ29yZy5mcmVlZGVza3RvcC5EQnVzLk9iamVjdE1hbmFnZXInLFxuXHRcdC8vIFx0XHR9XG5cdFx0Ly8gXHR9LCAocGVlcklkLCBlcnIsIG9iakRhdGEpID0+IHsgLy8gZ2V0IGFsbCBvYmplY3QgcGF0aHMsIGludGVyZmFjZXMgYW5kIHByb3BlcnRpZXMgY2hpbGRyZW4gb2YgU3RhdHVzXG5cdFx0Ly8gXHRcdGxldCByb2JvdE5hbWUgPSAnJztcblx0XHQvLyBcdFx0bGV0IHJvYm90SWQgPSAxO1xuXG5cdFx0Ly8gXHRcdExvZ2dlci5kZWJ1ZyhgU3RhdHVzLkdldE1hbmFnZWRPYmplY3RzOiBvYmpEYXRhID0gYClcblx0XHQvLyBcdFx0TG9nZ2VyLmRlYnVnKG9iakRhdGEpXG5cblx0XHQvLyBcdFx0Zm9yIChsZXQgb2JqZWN0UGF0aCBpbiBvYmpEYXRhKSB7XG5cdFx0Ly8gXHRcdFx0aWYgKG9iakRhdGFbb2JqZWN0UGF0aF1bJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90J10gIT0gbnVsbCkge1xuXHRcdC8vIFx0XHRcdFx0cm9ib3ROYW1lID0gb2JqRGF0YVtvYmplY3RQYXRoXVsnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXS5Sb2JvdE5hbWU7XG5cdFx0Ly8gXHRcdFx0XHRyb2JvdElkID0gb2JqRGF0YVtvYmplY3RQYXRoXVsnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXS5Sb2JvdElkO1xuXHRcdC8vIFx0XHRcdFx0cm9ib3RJZHNbcm9ib3ROYW1lXSA9IHJvYm90SWQ7XG5cdFx0Ly8gXHRcdFx0XHR0aGlzLl9nZXRJbml0aWFsU3RhdHVzKHJvYm90SWQsIHJvYm90TmFtZSwgZnVuY3Rpb24gKG1vZGVsKSB7XG5cdFx0Ly8gXHRcdFx0XHRcdGNhbGxiYWNrKG1vZGVsLCBwZWVySWQpO1xuXHRcdC8vIFx0XHRcdFx0fSlcblx0XHQvLyBcdFx0XHR9XG5cdFx0Ly8gXHRcdFx0aWYgKG9iakRhdGFbb2JqZWN0UGF0aF1bJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnXSAhPSBudWxsKSB7XG5cdFx0Ly8gXHRcdFx0XHRsZXQgc3VicyA9IHRoaXMuc2VsZWN0b3Iuc3Vic2NyaWJlKHsvLyBzdWJzY3JpYmVzIHRvIHN0YXR1cyBjaGFuZ2VzIGZvciBhbGwgcGFydHNcblx0XHQvLyBcdFx0XHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0Ly8gXHRcdFx0XHRcdGZ1bmM6ICdTdGF0dXNDaGFuZ2VkJyxcblx0XHQvLyBcdFx0XHRcdFx0b2JqOiB7XG5cdFx0Ly8gXHRcdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCcsXG5cdFx0Ly8gXHRcdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFxuXHRcdC8vIFx0XHRcdFx0XHR9LFxuXHRcdC8vIFx0XHRcdFx0XHRkYXRhOiByb2JvdE5hbWVzXG5cdFx0Ly8gXHRcdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHQvLyBcdFx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0Ly8gXHRcdFx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiU3RhdHVzU3Vic2NyaWJlOlwiICsgZXJyKTtcblx0XHQvLyBcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHQvLyBcdFx0XHRcdFx0XHRMb2dnZXIuZGVidWcoYFN0YXR1c0NoYW5nZWQgaXMgY2FsbGVkYClcblx0XHQvLyBcdFx0XHRcdFx0XHRzZW5kRGF0YVswXSA9IGRhdGE7XG5cdFx0Ly8gXHRcdFx0XHRcdFx0dGhpcy5fZ2V0Um9ib3RNb2RlbEZyb21SZWN2MihzZW5kRGF0YSwgcm9ib3RJZCwgcm9ib3ROYW1lKTtcblx0XHQvLyBcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0Ly8gXHRcdFx0XHRcdFx0XHRjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwsIHBlZXJJZCk7XG5cdFx0Ly8gXHRcdFx0XHRcdFx0fVxuXHRcdC8vIFx0XHRcdFx0XHR9XG5cdFx0Ly8gXHRcdFx0XHR9KTtcblx0XHQvLyBcdFx0XHRcdHRoaXMuc3Vic2NyaXB0aW9ucy5wdXNoKHN1YnMpO1xuXHRcdC8vIFx0XHRcdH1cblx0XHQvLyBcdFx0fVxuXHRcdC8vIFx0fSlcblx0XHQvLyB9KS5jYXRjaChlcnIgPT4ge1xuXHRcdC8vIFx0TG9nZ2VyLmVycm9yKGVycik7XG5cdFx0Ly8gfSlcblxuXHR9O1xuXG5cdC8qKlxuXHQgKiBDbG9zZSBhbGwgc3Vic2NyaXB0aW9uc1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5jbG9zZVN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbigpe1xuXHRcdGZvcih2YXIgaSBpbiB0aGlzLnN1YnNjcmlwdGlvbnMpIHtcblx0XHRcdHRoaXMuc3Vic2NyaXB0aW9uc1tpXS5jbG9zZSgpO1xuXHRcdH1cblx0XHR0aGlzLnN1YnNjcmlwdGlvbnMgPVtdO1xuXHRcdHRoaXMucm9ib3RNb2RlbCA9IFtdO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQgZGF0YSBnaXZlbiBkYXRhQ29uZmlnLlxuXHQgKiBAcGFyYW0ge2Z1bmN9IGNhbGxiYWNrIDogY2FsbGVkIGFmdGVyIHVwZGF0ZVxuXHQgKiBUT0RPIFVTRSBQUk9NSVNFXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmdldERhdGEgPSBmdW5jdGlvbihjYWxsYmFjaywgZGF0YUNvbmZpZyl7XG5cdFx0dmFyIGRhdGFNb2RlbCA9IHt9O1xuXHRcdHJldHVybiBQcm9taXNlLnRyeShfID0+IHtcblx0XHRcdGlmKGRhdGFDb25maWcgIT0gbnVsbClcblx0XHRcdFx0dGhpcy5EYXRhQ29uZmlnKGRhdGFDb25maWcpO1xuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJSZXF1ZXN0OiBcIitKU09OLnN0cmluZ2lmeShkYXRhQ29uZmlnKSk7XG5cdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiBcInN0YXR1c1wiLFxuXHRcdFx0XHRmdW5jOiBcIkRhdGFSZXF1ZXN0XCIsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHR0eXBlOlwic3BsUmVxXCIsXG5cdFx0XHRcdFx0ZGF0YUNvbmZpZzogdGhpcy5kYXRhQ29uZmlnXG5cdFx0XHRcdH1cblx0XHRcdH0sIChkbklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiW1wiICsgdGhpcy5kYXRhQ29uZmlnLnNlbnNvcnMgKyBcIl0gUmVjdiBlcnI6IFwiICsgSlNPTi5zdHJpbmdpZnkoZXJyKSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKGRhdGEuaGVhZGVyLmVycm9yICE9IG51bGwpIHtcblx0XHRcdFx0XHQvLyBUT0RPIDogY2hlY2svdXNlIGVyciBzdGF0dXMgYW5kIGFkYXB0IGJlaGF2aW9yIGFjY29yZGluZ2x5XG5cdFx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiVXBkYXRlRGF0YTpcXG5cIitKU09OLnN0cmluZ2lmeShkYXRhLmhlYWRlci5yZXFDb25maWcpKTtcblx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJEYXRhIHJlcXVlc3QgZmFpbGVkIChcIitkYXRhLmhlYWRlci5lcnJvci5zdCtcIik6IFwiK2RhdGEuaGVhZGVyLmVycm9yLm1zZyk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vTG9nZ2VyLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmRhdGFNb2RlbCkpO1xuXHRcdFx0XHRkYXRhTW9kZWwgPSB0aGlzLl9nZXREYXRhTW9kZWxGcm9tUmVjdihkYXRhKTtcblxuXHRcdFx0XHRMb2dnZXIubG9nKHRoaXMuZ2V0RGF0YU1vZGVsKCkpO1xuXHRcdFx0XHRjYWxsYmFjayA9IGNhbGxiYWNrLmJpbmQodGhpcyk7IC8vIGJpbmQgY2FsbGJhY2sgd2l0aCBTdGF0dXNcblx0XHRcdFx0Y2FsbGJhY2soZGF0YU1vZGVsKTsgLy8gY2FsbGJhY2sgZnVuY1xuXHRcdFx0fSk7XG5cdFx0fSkuY2F0Y2goZXJyID0+IHtcblx0XHRcdExvZ2dlci5lcnJvcihlcnIpXG5cdFx0fSlcblx0fTtcblxuXHQvKipcblx0ICogUmVzdG9yZSB6aXBwZWQgZGF0YSBmcm9tIHNpZ25hbCBNdWx0aWRheVN0YXR1c1VwZGF0ZWQgdG8gYSBjb21wbGlhbnQgc3RhdGUgZm9yIHVzZSBpbiBmdW5jdGlvbiB7QGxpbmsgX2dldFJvYm90TW9kZWxGcm9tUmVjdjJ9XG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gemlwcGVkIGRhdGEgcmVjZWl2ZWQgZnJvbSBzaWduYWwgTXVsdGlkYXlTdGF0dXNVcGRhdGVkLCB0aGlzIGRhdGEgaXMgY29tcHJlc3NlZCB0byByZWR1Y2UgbWVtb3J5IGZvb3RwcmludFxuXHQgKiB0LkRCVVNfRElDVCAoXG5cdCAqXHRcdHQuREJVU19TVFJJTkcsICAgICAvLyByb2JvdCBpbmZvIGkuZS4gNDpEMVIwMDAzNVxuXHQgKlx0XHR0LkRCVVNfRElDVCAoXG5cdCAqXHRcdFx0dC5EQlVTX1NUUklORywgLy8gcGFydElkXG5cdCAqXHRcdFx0dC5EQlVTX0FSUkFZICh0LkRCVVNfU1RSVUNUKHQuREJVU19VSU5UNjQsIHQuREJVU19VSU5UMTYsIHQuREJVU19VSU5UMzIpKVxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aW1lLCBjb2RlLCBoYXNoXG5cdCAqXHRcdClcblx0ICogQHJldHVybiB7b2JqZWN0fSBleHRyYWN0ZWQgZGF0YSBpbiBmb3JtIG9mIGFycmF5IG9mIFtQYXJ0SWQsIENhdGVnb3J5LCBQYXJ0TmFtZSwgTGFiZWwsIFRpbWUsIENvZGUsIENvZGVSZWYsIE1zZywgQ3JpdExldmVsLCBEZXNjcmlwdGlvbiwgUm9ib3RJZCwgUm9ib3ROYW1lXVxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5fdW5wYWNrUm9ib3RNb2RlbHMgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0aWYgKGRhdGEgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdC8vIFRoZXNlIHR3byByZWZlcmVuY2UgbWFwIHNob3VsZCBoYXZlIGJlZW4gcmV0cmlldmVkIGF0IGluaXRpYWwgY29ubmVjdGlvblxuXHRcdGlmICh0aGlzLl9wYXJ0UmVmZXJlbmNlTWFwID09IG51bGwpIHtcblx0XHRcdHRoaXMuX3BhcnRSZWZlcmVuY2VNYXAgPSBbXVxuXHRcdH1cblx0XHRpZiAodGhpcy5fc3RhdHVzRXZ0UmVmZXJlbmNlTWFwID09IG51bGwpIHtcblx0XHRcdHRoaXMuX3N0YXR1c0V2dFJlZmVyZW5jZU1hcCA9IFtdXG5cdFx0fVxuXHRcdC8vIEJlZ2luIHRvIHVucGFjayBkYXRhXG5cdFx0bGV0IHN0YXR1c2VzID0gW11cblx0XHRmb3IgKGxldCByb2JvdCBpbiBkYXRhKSB7XG5cdFx0XHRsZXQgcm9ib3RJZHMgPSByb2JvdC5zcGxpdChcIjpcIikgLy8gaS5lLiA0OkQxUjAwMDM1XG5cdFx0XHRsZXQgcm9ib3RJZCA9IHJvYm90SWRzWzBdXG5cdFx0XHRsZXQgcm9ib3ROYW1lID0gcm9ib3RJZHNbMV1cblx0XHRcdGlmIChyb2JvdElkcy5zb21lKGl0ZW0gPT4gaXRlbSA9PSBudWxsKSkgeyAvLyBlcnJvbmVvdXMgZGF0YVxuXHRcdFx0XHRjb250aW51ZVxuXHRcdFx0fVxuXHRcdFx0Zm9yIChsZXQgcGFydElkIGluIGRhdGFbcm9ib3RdKSB7XG5cdFx0XHRcdGxldCBzdWJTdGF0dXNlcyA9IGRhdGFbcm9ib3RdW3BhcnRJZF0gLy8gYW4gYXJyYXkgb2YgW3RpbWUsIGNvZGUsIGhhc2hdXG5cdFx0XHRcdGlmICghQXJyYXkuaXNBcnJheShzdWJTdGF0dXNlcykpIHsgLy8gZXJyb25lb3VzIGRhdGFcblx0XHRcdFx0XHRjb250aW51ZVxuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIGV4dHJhY3QgcGFydC1yZWxhdGVkIGluZm9ybWF0aW9uIGZyb20gcHJlLXJldHJpZXZlZCBtYXBcblx0XHRcdFx0bGV0IHBhcnRSZWZlcmVuY2UgPSB0aGlzLl9wYXJ0UmVmZXJlbmNlTWFwW3BhcnRJZF07XG5cdFx0XHRcdGlmIChwYXJ0UmVmZXJlbmNlID09IG51bGwpIHtcblx0XHRcdFx0XHRMb2dnZXIud2FybihgUGFydFJlZmVyZW5jZSBmaW5kcyBubyBtYXAgZm9yIHBhcnRJZCAke3BhcnRJZH1gKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGxldCBwYXJ0TmFtZSA9IHBhcnRSZWZlcmVuY2UgPT0gbnVsbCA/IG51bGwgOiBwYXJ0UmVmZXJlbmNlWzBdO1xuXHRcdFx0XHRsZXQgbGFiZWwgPSBwYXJ0UmVmZXJlbmNlID09IG51bGwgPyBudWxsIDogcGFydFJlZmVyZW5jZVsxXTtcblx0XHRcdFx0bGV0IGNhdGVnb3J5ID0gcGFydFJlZmVyZW5jZSA9PSBudWxsID8gbnVsbCA6IHBhcnRSZWZlcmVuY2VbMl07XG5cblx0XHRcdFx0c3ViU3RhdHVzZXMuZm9yRWFjaChzdWJTdGF0dXMgPT4ge1xuXHRcdFx0XHRcdGxldCB0aW1lID0gc3ViU3RhdHVzWzBdXG5cdFx0XHRcdFx0bGV0IGNvZGUgPSBzdWJTdGF0dXNbMV1cblxuXHRcdFx0XHRcdC8vIG1hcCB0aGUgaGFzaCB2YWx1ZSB0byB0aGUgc3RhdHVzIGV2ZW50IHZhbHVlc1xuXHRcdFx0XHRcdGxldCBoYXNoID0gc3ViU3RhdHVzWzJdXG5cdFx0XHRcdFx0bGV0IHN0YXR1c0V2dFJlZmVyZW5jZSA9IHRoaXMuX3N0YXR1c0V2dFJlZmVyZW5jZU1hcFtoYXNoXVxuXHRcdFx0XHRcdGlmIChzdGF0dXNFdnRSZWZlcmVuY2UgPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0TG9nZ2VyLndhcm4oYFN0YXR1c0V2dFJlZmVyZW5jZSBmaW5kcyBubyBtYXAgZm9yIGhhc2gga2V5ICR7aGFzaH1gKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRsZXQgY29kZVJlZiA9IHN0YXR1c0V2dFJlZmVyZW5jZSA9PSBudWxsID8gbnVsbCA6IHN0YXR1c0V2dFJlZmVyZW5jZVswXTtcblx0XHRcdFx0XHRsZXQgbXNnID0gc3RhdHVzRXZ0UmVmZXJlbmNlID09IG51bGwgPyBudWxsIDogc3RhdHVzRXZ0UmVmZXJlbmNlWzFdO1xuXHRcdFx0XHRcdGxldCBjcml0TGV2ZWwgPSBzdGF0dXNFdnRSZWZlcmVuY2UgPT0gbnVsbCA/IG51bGwgOiBzdGF0dXNFdnRSZWZlcmVuY2VbMl07XG5cblx0XHRcdFx0XHQvLyBjb25zdHJ1Y3QgZnVsbCBpbmZvcm1hdGlvbiBmb3IgZWFjaCBzdGF0dXNcblx0XHRcdFx0XHRsZXQgc3RhdHVzID0gW3BhcnRJZCwgY2F0ZWdvcnksIHBhcnROYW1lLCBsYWJlbCwgdGltZSwgY29kZSwgY29kZVJlZiwgbXNnLCBjcml0TGV2ZWwsIHJvYm90SWQsIHJvYm90TmFtZV1cblx0XHRcdFx0XHRzdGF0dXNlcy5wdXNoKHN0YXR1cyk7XG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0fVxuXHRcdExvZ2dlci5kZWJ1ZyhgRXh0cmFjdGVkICR7c3RhdHVzZXMubGVuZ3RofSBzdGF0dXNlc2ApXG5cdFx0cmV0dXJuIHN0YXR1c2VzXG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlIGludGVybmFsIHJvYm90IG1vZGVsIHdpdGggcmVjZWl2ZWQgZGF0YSAodmVyc2lvbiAyKVxuXHQgKiBAcGFyYW0gIHtPYmplY3R9IGRhdGEgZGF0YSByZWNlaXZlZCBmcm9tIERpeWFOb2RlIGJ5IHdlYnNvY2tldCBoYXZpbmcgdGhlIGZvcm1cblx0ICogXHRcdCAgIFtwYXJ0SWQsIGNhdGVnb3J5LCBwYXJ0TmFtZSwgbGFiZWwsIHRpbWUsIGNvZGUsIGNvZGVSZWYsIG1zZywgY3JpdExldmVsLCByb2JvdElkLCByb2JvdE5hbWVdXG5cdCAqIEBkZXByZWNhdGVkIHJvYm90SWRcblx0ICogQGRlcHJlY2F0ZWQgcm9ib3ROYW1lXG5cdCAqIEByZXR1cm4ge1t0eXBlXX1cdFx0W2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5fZ2V0Um9ib3RNb2RlbEZyb21SZWN2MiA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRpZiAoIUFycmF5LmlzQXJyYXkoZGF0YSkpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGlmICh0aGlzLnJvYm90TW9kZWwgPT0gbnVsbCkge1xuXHRcdFx0dGhpcy5yb2JvdE1vZGVsID0gW107XG5cdFx0fVxuXG5cdFx0ZGF0YS5mb3JFYWNoKGQgPT4ge1xuXHRcdFx0bGV0IHJvYm90SWQgPSBkWzldXG5cdFx0XHRsZXQgcm9ib3ROYW1lID0gZFsxMF1cblxuXHRcdFx0aWYgKFtyb2JvdElkLCByb2JvdE5hbWVdLnNvbWUoaXRlbSA9PiBpdGVtID09IG51bGwpKSB7XG5cdFx0XHRcdExvZ2dlci53YXJuKGBFcnJvbmVvdXMgc3RhdHVzIGRhdGEsIHJvYm90SWQgPSAke3JvYm90SWR9LCByb2JvdE5hbWUgPSAke3JvYm90TmFtZX1gKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblxuXHRcdFx0aWYgKHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSA9PSBudWxsKSB7XG5cdFx0XHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSA9IHtcblx0XHRcdFx0XHRyb2JvdDogeyBuYW1lOiByb2JvdE5hbWUgfVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8qKiBleHRyYWN0IHBhcnRzIGluZm8gKiovXG5cdFx0XHRsZXQgcGFydElkID0gZFswXVxuXHRcdFx0bGV0IGNhdGVnb3J5ID0gZFsxXTtcblx0XHRcdGxldCBwYXJ0TmFtZSA9IGRbMl07XG5cdFx0XHRsZXQgbGFiZWwgPSBkWzNdO1xuXHRcdFx0bGV0IHRpbWUgPSBkWzRdO1xuXHRcdFx0bGV0IGNvZGUgPSBkWzVdO1xuXHRcdFx0bGV0IGNvZGVSZWYgPSBkWzZdO1xuXHRcdFx0bGV0IG1zZyA9IGRbN107XG5cdFx0XHRsZXQgY3JpdExldmVsID0gZFs4XTtcblxuXHRcdFx0aWYgKHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXS5wYXJ0cyA9PSBudWxsKSB7XG5cdFx0XHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXS5wYXJ0cyA9IHt9IC8vIHJlc2V0IHBhcnRzXG5cdFx0XHR9XG5cdFx0XHRsZXQgclBhcnRzID0gdGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdLnBhcnRzXG5cdFx0XHRpZiAoclBhcnRzW3BhcnRJZF0gPT0gbnVsbCkge1xuXHRcdFx0XHRyUGFydHNbcGFydElkXSA9IHt9O1xuXHRcdFx0fVxuXHRcdFx0LyogdXBkYXRlIHBhcnQgY2F0ZWdvcnkgKi9cblx0XHRcdHJQYXJ0c1twYXJ0SWRdLmNhdGVnb3J5ID0gY2F0ZWdvcnk7XG5cdFx0XHQvKiB1cGRhdGUgcGFydCBuYW1lICovXG5cdFx0XHRyUGFydHNbcGFydElkXS5uYW1lID0gcGFydE5hbWUgPT0gbnVsbCA/IG51bGwgOiBwYXJ0TmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0LyogdXBkYXRlIHBhcnQgbGFiZWwgKi9cblx0XHRcdHJQYXJ0c1twYXJ0SWRdLmxhYmVsID0gbGFiZWw7XG5cblx0XHRcdC8qIHVwZGF0ZSBlcnJvciAqL1xuXHRcdFx0LyoqIHVwZGF0ZSBlcnJvckxpc3QgKiovXG5cdFx0XHRpZiAoclBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0ID09IG51bGwpXG5cdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdCA9IHt9O1xuXG5cdFx0XHRpZiAoclBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0W2NvZGVSZWZdID09IG51bGwpXG5cdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdFtjb2RlUmVmXSA9IHtcblx0XHRcdFx0XHRtc2c6IG1zZyxcblx0XHRcdFx0XHRjcml0TGV2ZWw6IGNyaXRMZXZlbCxcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogbnVsbFxuXHRcdFx0XHR9O1xuXHRcdFx0bGV0IGV2dHNfdG1wID0ge1xuXHRcdFx0XHR0aW1lOiB0aGlzLl9jb2Rlci5mcm9tKHRpbWUpLFxuXHRcdFx0XHRjb2RlOiB0aGlzLl9jb2Rlci5mcm9tKGNvZGUpLFxuXHRcdFx0XHRjb2RlUmVmOiB0aGlzLl9jb2Rlci5mcm9tKGNvZGVSZWYpXG5cdFx0XHR9O1xuXHRcdFx0LyoqIGlmIHJlY2VpdmVkIGxpc3Qgb2YgZXZlbnRzICoqL1xuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoZXZ0c190bXAuY29kZSkgfHwgQXJyYXkuaXNBcnJheShldnRzX3RtcC50aW1lKSB8fCBBcnJheS5pc0FycmF5KGV2dHNfdG1wLmNvZGVSZWYpKSB7XG5cdFx0XHRcdGlmIChldnRzX3RtcC5jb2RlLmxlbmd0aCA9PT0gZXZ0c190bXAuY29kZVJlZi5sZW5ndGhcblx0XHRcdFx0XHQmJiBldnRzX3RtcC5jb2RlLmxlbmd0aCA9PT0gZXZ0c190bXAudGltZS5sZW5ndGgpIHtcblx0XHRcdFx0XHQvKiogYnVpbGQgbGlzdCBvZiBldmVudHMgKiovXG5cdFx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXZ0cyA9IFtdO1xuXHRcdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZXZ0c190bXAuY29kZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXZ0cy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0dGltZTogZXZ0c190bXAudGltZVtpXSxcblx0XHRcdFx0XHRcdFx0Y29kZTogZXZ0c190bXAuY29kZVtpXSxcblx0XHRcdFx0XHRcdFx0Y29kZVJlZjogZXZ0c190bXAuY29kZVJlZltpXVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdExvZ2dlci5lcnJvcihcIlN0YXR1czpJbmNvbnNpc3RhbnQgbGVuZ3RocyBvZiBidWZmZXJzICh0aW1lL2NvZGUvY29kZVJlZilcIik7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7IC8qKiBqdXN0IGluIGNhc2UsIHRvIHByb3ZpZGUgYmFja3dhcmQgY29tcGF0aWJpbGl0eSAqKi9cblx0XHRcdFx0LyoqIHNldCByZWNlaXZlZCBldmVudCAqKi9cblx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXZ0cyA9IFt7XG5cdFx0XHRcdFx0dGltZTogZXZ0c190bXAudGltZSxcblx0XHRcdFx0XHRjb2RlOiBldnRzX3RtcC5jb2RlLFxuXHRcdFx0XHRcdGNvZGVSZWY6IGV2dHNfdG1wLmNvZGVSZWZcblx0XHRcdFx0fV07XG5cdFx0XHR9XG5cdFx0fSlcblx0fTtcblxuXHQvKiogY3JlYXRlIFN0YXR1cyBzZXJ2aWNlICoqL1xuXHREaXlhU2VsZWN0b3IucHJvdG90eXBlLlN0YXR1cyA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIG5ldyBTdGF0dXModGhpcyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFNldCBvbiBzdGF0dXNcblx0ICogQHBhcmFtIHJvYm90TmFtZSB0byBmaW5kIHN0YXR1cyB0byBtb2RpZnlcblx0ICogQHBhcmFtIHBhcnROYW1lIFx0dG8gZmluZCBzdGF0dXMgdG8gbW9kaWZ5XG5cdCAqIEBwYXJhbSBjb2RlXHRcdG5ld0NvZGVcblx0ICogQHBhcmFtIHNvdXJjZVx0XHRzb3VyY2Vcblx0ICogQHBhcmFtIGNhbGxiYWNrXHRcdHJldHVybiBjYWxsYmFjayAoPGJvb2w+c3VjY2Vzcylcblx0ICovXG5cdERpeWFTZWxlY3Rvci5wcm90b3R5cGUuc2V0U3RhdHVzID0gZnVuY3Rpb24gKHJvYm90TmFtZSwgcGFydE5hbWUsIGNvZGUsIHNvdXJjZSwgY2FsbGJhY2spIHtcblx0XHRyZXR1cm4gUHJvbWlzZS50cnkoXyA9PiB7XG5cdFx0XHR2YXIgb2JqZWN0UGF0aCA9IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9cIiArIHRoaXMuc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIikgKyBcIi9QYXJ0cy9cIiArIHBhcnROYW1lO1xuXHRcdFx0dGhpcy5yZXF1ZXN0KHtcblx0XHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdFx0ZnVuYzogXCJTZXRQYXJ0XCIsXG5cdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnLFxuXHRcdFx0XHRcdHBhdGg6IG9iamVjdFBhdGhcblx0XHRcdFx0fSxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdC8vcm9ib3ROYW1lOiByb2JvdE5hbWUsXG5cdFx0XHRcdFx0Y29kZTogY29kZSxcblx0XHRcdFx0XHQvL3BhcnROYW1lOiBwYXJ0TmFtZSxcblx0XHRcdFx0XHRzb3VyY2U6IHNvdXJjZSB8IDFcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKGZhbHNlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayh0cnVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSkuY2F0Y2goZXJyID0+IHtcblx0XHRcdExvZ2dlci5lcnJvcihlcnIpXG5cdFx0fSlcblx0fTtcblxuXHQvKipcblx0ICogR2V0IG9uZSBzdGF0dXNcblx0ICogQHBhcmFtIHJvYm90TmFtZSB0byBnZXQgc3RhdHVzXG5cdCAqIEBwYXJhbSBwYXJ0TmFtZSBcdHRvIGdldCBzdGF0dXNcblx0ICogQHBhcmFtIGNhbGxiYWNrXHRcdHJldHVybiBjYWxsYmFjaygtMSBpZiBub3QgZm91bmQvZGF0YSBvdGhlcndpc2UpXG5cdCAqIEBwYXJhbSBfZnVsbCBcdG1vcmUgZGF0YSBhYm91dCBzdGF0dXNcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuZ2V0U3RhdHVzID0gZnVuY3Rpb24gKHJvYm90TmFtZSwgcGFydE5hbWUsIGNhbGxiYWNrLyosIF9mdWxsKi8pIHtcblx0XHRsZXQgc2VuZERhdGEgPSBbXVxuXHRcdHJldHVybiBQcm9taXNlLnRyeShfID0+IHtcblx0XHRcdGxldCByZXEgPSB0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHRcdFx0ZnVuYzogJ0dldE1hbmFnZWRPYmplY3RzJyxcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnb3JnLmZyZWVkZXNrdG9wLkRCdXMuT2JqZWN0TWFuYWdlcicsXG5cdFx0XHRcdH1cblx0XHRcdH0sIChwZWVySWQsIGVyciwgb2JqRGF0YSkgPT4ge1xuXG5cdFx0XHRcdGxldCBvYmplY3RQYXRoUm9ib3QgPSBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1cy9Sb2JvdHMvXCIgKyB0aGlzLnNwbGl0QW5kQ2FtZWxDYXNlKHJvYm90TmFtZSwgXCItXCIpO1xuXHRcdFx0XHRsZXQgb2JqZWN0UGF0aFBhcnQgPSBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1cy9Sb2JvdHMvXCIgKyB0aGlzLnNwbGl0QW5kQ2FtZWxDYXNlKHJvYm90TmFtZSwgXCItXCIpICsgXCIvUGFydHMvXCIgKyBwYXJ0TmFtZTtcblx0XHRcdFx0bGV0IHJvYm90SWQgPSBvYmpEYXRhW29iamVjdFBhdGhSb2JvdF1bJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90J10uUm9ib3RJZFxuXHRcdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRcdFx0ZnVuYzogXCJHZXRQYXJ0XCIsXG5cdFx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0XHRcdFx0XHRcdHBhdGg6IG9iamVjdFBhdGhQYXJ0XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0XHRzZW5kRGF0YS5wdXNoKGRhdGEpXG5cdFx0XHRcdFx0dGhpcy5fZ2V0Um9ib3RNb2RlbEZyb21SZWN2MihzZW5kRGF0YSwgcm9ib3RJZCwgcm9ib3ROYW1lKTtcblx0XHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKC0xKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9KVxuXHRcdH0pLmNhdGNoKGVyciA9PiB7XG5cdFx0XHRMb2dnZXIuZXJyb3IoZXJyKVxuXHRcdH0pXG5cdH07XG5cblx0U3RhdHVzLnByb3RvdHlwZS5zcGxpdEFuZENhbWVsQ2FzZSA9IGZ1bmN0aW9uIChpblN0cmluZywgZGVsaW1pdGVyKSB7XG5cdFx0bGV0IGFycmF5U3BsaXRTdHJpbmcgPSBpblN0cmluZy5zcGxpdChkZWxpbWl0ZXIpO1xuXHRcdGxldCBvdXRDYW1lbFN0cmluZyA9ICcnO1xuXHRcdGFycmF5U3BsaXRTdHJpbmcuZm9yRWFjaChzdHIgPT4ge1xuXHRcdFx0b3V0Q2FtZWxTdHJpbmcgKz0gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyLnN1YnN0cmluZygxKTtcblx0XHR9KVxuXHRcdHJldHVybiBvdXRDYW1lbFN0cmluZztcblx0fVxuXG59KSgpXG4iXX0=
