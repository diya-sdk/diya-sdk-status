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
				Logger.debug('Received multiday statuses of robot', object.RobotId, object.RobotName, data);
				// Update robotModel variable
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
				Logger.debug('ManagedParts', objData);
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
				Logger.debug('Object', object);
				Logger.debug('robotIface', robotIface);

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
			Logger.debug('getParts', parts);

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
		}).then(function (_) {
			return _this5._getAndUpdateMultidayStatuses(robots, callback);
		}) // Retrieve initial statuses from the filtered robots
		.then(function (_) {
			return _this5._subscribeToStatusChanged(parts, callback);
		}); // Listen to StatusChange from the parts belonging to the filtered robots

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
  * Update internal robot model with received data (version 2)
  * @param  {Object} data data received from DiyaNode by websocket
  * @return {[type]}		[description]
  */
	Status.prototype._getRobotModelFromRecv2 = function (data, robotId, robotName) {
		var _this7 = this;

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
			var statusEvtReference = _this7._statusEvtReferenceMap[hash];
			if (statusEvtReference == null) {
				Logger.warn('StatusEvtReference finds no map for hash key ' + hash);
			}
			var codeRef = statusEvtReference == null ? null : statusEvtReference[0];
			var msg = statusEvtReference == null ? null : statusEvtReference[1];
			var critLevel = statusEvtReference == null ? null : statusEvtReference[2];

			// map the partId to the part reference values
			var partReference = _this7._partReferenceMap[partId];
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
				time: _this7._coder.from(time),
				code: _this7._coder.from(code),
				codeRef: _this7._coder.from(codeRef)
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
		var _this8 = this;

		return Promise.try(function (_) {
			var objectPath = "/fr/partnering/Status/Robots/" + _this8.splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
			_this8.request({
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
		var _this9 = this;

		var sendData = [];
		return Promise.try(function (_) {
			var req = _this9.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager'
				}
			}, function (peerId, err, objData) {

				var objectPathRobot = "/fr/partnering/Status/Robots/" + _this9.splitAndCamelCase(robotName, "-");
				var objectPathPart = "/fr/partnering/Status/Robots/" + _this9.splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
				var robotId = objData[objectPathRobot]['fr.partnering.Status.Robot'].RobotId;
				_this9.selector.request({
					service: "status",
					func: "GetPart",
					obj: {
						interface: 'fr.partnering.Status.Part',
						path: objectPathPart
					}
				}, function (peerId, err, data) {
					sendData.push(data);
					_this9._getRobotModelFromRecv2(sendData, robotId, robotName);
					if (err != null) {
						if (typeof callback === 'function') callback(-1);
					} else {
						if (typeof callback === 'function') callback(_this9.robotModel);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJzcmMvc3RhdHVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQzFrQkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JBOzs7Ozs7Ozs7Ozs7QUFZQSxDQUFDLFlBQVU7O0FBRVYsS0FBSSxZQUFZLEVBQUUsT0FBTyxNQUFQLEtBQWtCLFdBQXBCLENBQWhCO0FBQ0EsS0FBRyxDQUFDLFNBQUosRUFBZTtBQUFFLE1BQUksVUFBVSxRQUFRLFVBQVIsQ0FBZDtBQUFvQyxFQUFyRCxNQUNLO0FBQUUsTUFBSSxVQUFVLE9BQU8s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QUF2QyxFQUFnRCxTQUFoRDtBQUNBLFNBQUksT0FBTyxJQUFYLEVBQWlCO0FBQ2hCLFVBQUksT0FBTyxRQUFQLEtBQW9CLFVBQXhCLEVBQW9DLFNBQVMsQ0FBQyxDQUFWO0FBQ3BDLE1BRkQsTUFHSztBQUNKLFVBQUksT0FBTyxRQUFQLEtBQW9CLFVBQXhCLEVBQW9DLFNBQVMsT0FBSyxVQUFkO0FBQ3BDO0FBQ0QsS0FoQkQ7QUFpQkEsSUE1QlMsQ0FBVjtBQTZCQSxHQTlCTSxFQThCSixLQTlCSSxDQThCRSxlQUFPO0FBQ2YsVUFBTyxLQUFQLENBQWEsR0FBYjtBQUNBLEdBaENNLENBQVA7QUFpQ0EsRUFuQ0Q7O0FBcUNBLFFBQU8sU0FBUCxDQUFpQixpQkFBakIsR0FBcUMsVUFBVSxRQUFWLEVBQW9CLFNBQXBCLEVBQStCO0FBQ25FLE1BQUksbUJBQW1CLFNBQVMsS0FBVCxDQUFlLFNBQWYsQ0FBdkI7QUFDQSxNQUFJLGlCQUFpQixFQUFyQjtBQUNBLG1CQUFpQixPQUFqQixDQUF5QixlQUFPO0FBQy9CLHFCQUFrQixJQUFJLE1BQUosQ0FBVyxDQUFYLEVBQWMsV0FBZCxLQUE4QixJQUFJLFNBQUosQ0FBYyxDQUFkLENBQWhEO0FBQ0EsR0FGRDtBQUdBLFNBQU8sY0FBUDtBQUNBLEVBUEQ7QUFTQSxDQW56QkQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfXJldHVybiBlfSkoKSIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDogUGFydG5lcmluZyAzLjAgKDIwMDctMjAxNilcbiAqIEF1dGhvciA6IFN5bHZhaW4gTWFow6kgPHN5bHZhaW4ubWFoZUBwYXJ0bmVyaW5nLmZyPlxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIGRpeWEtc2RrLlxuICpcbiAqIGRpeWEtc2RrIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIGRpeWEtc2RrIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIGRpeWEtc2RrLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cblxuXG5cblxuLyogbWF5YS1jbGllbnRcbiAqIENvcHlyaWdodCAoYykgMjAxNCwgUGFydG5lcmluZyBSb2JvdGljcywgQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgbGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3JcbiAqIG1vZGlmeSBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5IHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IHZlcnNpb25cbiAqXHQzLjAgb2YgdGhlIExpY2Vuc2UuIFRoaXMgbGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZVxuICogdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW5cbiAqIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVJcbiAqIFBVUlBPU0UuIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBsaWJyYXJ5LlxuICovXG4oZnVuY3Rpb24oKXtcblxuXHR2YXIgaXNCcm93c2VyID0gISh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyk7XG5cdGlmKCFpc0Jyb3dzZXIpIHsgdmFyIFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpOyB9XG5cdGVsc2UgeyB2YXIgUHJvbWlzZSA9IHdpbmRvdy5Qcm9taXNlOyB9XG5cdHZhciBEaXlhU2VsZWN0b3IgPSBkMS5EaXlhU2VsZWN0b3I7XG5cdHZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLyBMb2dnaW5nIHV0aWxpdHkgbWV0aG9kcyAvLy8vLy8vLy8vLy8vLy8vLy9cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXHR2YXIgREVCVUcgPSB0cnVlO1xuXHR2YXIgTG9nZ2VyID0ge1xuXHRcdGxvZzogZnVuY3Rpb24obWVzc2FnZSl7XG5cdFx0XHRpZihERUJVRykgY29uc29sZS5sb2cobWVzc2FnZSk7XG5cdFx0fSxcblxuXHRcdGRlYnVnOiBmdW5jdGlvbihtZXNzYWdlLCAuLi5hcmdzKXtcblx0XHRcdGlmKERFQlVHKSBjb25zb2xlLmxvZyhtZXNzYWdlLCAuLi5hcmdzKTtcblx0XHR9LFxuXG5cdFx0d2FybjogZnVuY3Rpb24obWVzc2FnZSl7XG5cdFx0XHRpZihERUJVRykgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuXHRcdH0sXG5cblx0XHRlcnJvcjogZnVuY3Rpb24obWVzc2FnZSl7XG5cdFx0XHRpZihERUJVRykgY29uc29sZS5lcnJvcihtZXNzYWdlKTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqXHRjYWxsYmFjayA6IGZ1bmN0aW9uIGNhbGxlZCBhZnRlciBtb2RlbCB1cGRhdGVkXG5cdCAqICovXG5cdGZ1bmN0aW9uIFN0YXR1cyhzZWxlY3Rvcil7XG5cdFx0dGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yO1xuXHRcdHRoaXMuX2NvZGVyID0gc2VsZWN0b3IuZW5jb2RlKCk7XG5cdFx0dGhpcy5zdWJzY3JpcHRpb25zID0gW107XG5cblx0XHQvKiogbW9kZWwgb2Ygcm9ib3QgOiBhdmFpbGFibGUgcGFydHMgYW5kIHN0YXR1cyAqKi9cblx0XHR0aGlzLnJvYm90TW9kZWwgPSBbXTtcblx0XHR0aGlzLl9yb2JvdE1vZGVsSW5pdCA9IGZhbHNlO1xuXHRcdHRoaXMuX3BhcnRSZWZlcmVuY2VNYXAgPSBbXTtcblxuXHRcdC8qKiogc3RydWN0dXJlIG9mIGRhdGEgY29uZmlnICoqKlxuXHRcdFx0IGNyaXRlcmlhIDpcblx0XHRcdCAgIHRpbWU6IGFsbCAzIHRpbWUgY3JpdGVyaWEgc2hvdWxkIG5vdCBiZSBkZWZpbmVkIGF0IHRoZSBzYW1lIHRpbWUuIChyYW5nZSB3b3VsZCBiZSBnaXZlbiB1cClcblx0XHRcdCAgICAgYmVnOiB7W251bGxdLHRpbWV9IChudWxsIG1lYW5zIG1vc3QgcmVjZW50KSAvLyBzdG9yZWQgYSBVVEMgaW4gbXMgKG51bSlcblx0XHRcdCAgICAgZW5kOiB7W251bGxdLCB0aW1lfSAobnVsbCBtZWFucyBtb3N0IG9sZGVzdCkgLy8gc3RvcmVkIGFzIFVUQyBpbiBtcyAobnVtKVxuXHRcdFx0ICAgICByYW5nZToge1tudWxsXSwgdGltZX0gKHJhbmdlIG9mIHRpbWUocG9zaXRpdmUpICkgLy8gaW4gcyAobnVtKVxuXHRcdFx0ICAgcm9ib3Q6IHtBcnJheU9mIElEIG9yIFtcImFsbFwiXX1cblx0XHRcdCAgIHBsYWNlOiB7QXJyYXlPZiBJRCBvciBbXCJhbGxcIl19XG5cdFx0XHQgb3BlcmF0b3I6IHtbbGFzdF0sIG1heCwgbW95LCBzZH0gLSggbWF5YmUgbW95IHNob3VsZCBiZSBkZWZhdWx0XG5cdFx0XHQgLi4uXG5cblx0XHRcdCBwYXJ0cyA6IHtbbnVsbF0gb3IgQXJyYXlPZiBQYXJ0c0lkfSB0byBnZXQgZXJyb3JzXG5cdFx0XHQgc3RhdHVzIDoge1tudWxsXSBvciBBcnJheU9mIFN0YXR1c05hbWV9IHRvIGdldCBzdGF0dXNcblxuXHRcdFx0IHNhbXBsaW5nOiB7W251bGxdIG9yIGludH1cblx0XHQqL1xuXHRcdHRoaXMuZGF0YUNvbmZpZyA9IHtcblx0XHRcdGNyaXRlcmlhOiB7XG5cdFx0XHRcdHRpbWU6IHtcblx0XHRcdFx0XHRiZWc6IG51bGwsXG5cdFx0XHRcdFx0ZW5kOiBudWxsLFxuXHRcdFx0XHRcdHJhbmdlOiBudWxsIC8vIGluIHNcblx0XHRcdFx0fSxcblx0XHRcdFx0cm9ib3Q6IG51bGxcblx0XHRcdH0sXG5cdFx0XHRvcGVyYXRvcjogJ2xhc3QnLFxuXHRcdFx0cGFydHM6IG51bGwsXG5cdFx0XHRzdGF0dXM6IG51bGxcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cdC8qKlxuXHQgKiBHZXQgcm9ib3RNb2RlbCA6XG5cdCAqIHtcblx0ICogIHBhcnRzOiB7XG5cdCAqXHRcdFwicGFydFhYXCI6IHtcblx0ICogXHRcdFx0IGVycm9yc0Rlc2NyOiB7IGVuY291bnRlcmVkIGVycm9ycyBpbmRleGVkIGJ5IGVycm9ySWRzPjAgfVxuXHQgKlx0XHRcdFx0PiBDb25maWcgb2YgZXJyb3JzIDpcblx0ICpcdFx0XHRcdFx0Y3JpdExldmVsOiBGTE9BVCwgLy8gY291bGQgYmUgaW50Li4uXG5cdCAqIFx0XHRcdFx0XHRtc2c6IFNUUklORyxcblx0ICpcdFx0XHRcdFx0c3RvcFNlcnZpY2VJZDogU1RSSU5HLFxuXHQgKlx0XHRcdFx0XHRydW5TY3JpcHQ6IFNlcXVlbGl6ZS5TVFJJTkcsXG5cdCAqXHRcdFx0XHRcdG1pc3Npb25NYXNrOiBTZXF1ZWxpemUuSU5URUdFUixcblx0ICpcdFx0XHRcdFx0cnVuTGV2ZWw6IFNlcXVlbGl6ZS5JTlRFR0VSXG5cdCAqXHRcdFx0ZXJyb3I6W0ZMT0FULCAuLi5dLCAvLyBjb3VsZCBiZSBpbnQuLi5cblx0ICpcdFx0XHR0aW1lOltGTE9BVCwgLi4uXSxcblx0ICpcdFx0XHRyb2JvdDpbRkxPQVQsIC4uLl0sXG5cdCAqXHRcdFx0Ly8vIHBsYWNlOltGTE9BVCwgLi4uXSwgbm90IGltcGxlbWVudGVkIHlldFxuXHQgKlx0XHR9LFxuXHQgKlx0IFx0Li4uIChcIlBhcnRZWVwiKVxuXHQgKiAgfSxcblx0ICogIHN0YXR1czoge1xuXHQgKlx0XHRcInN0YXR1c1hYXCI6IHtcblx0ICpcdFx0XHRcdGRhdGE6W0ZMT0FULCAuLi5dLCAvLyBjb3VsZCBiZSBpbnQuLi5cblx0ICpcdFx0XHRcdHRpbWU6W0ZMT0FULCAuLi5dLFxuXHQgKlx0XHRcdFx0cm9ib3Q6W0ZMT0FULCAuLi5dLFxuXHQgKlx0XHRcdFx0Ly8vIHBsYWNlOltGTE9BVCwgLi4uXSwgbm90IGltcGxlbWVudGVkIHlldFxuXHQgKlx0XHRcdFx0cmFuZ2U6IFtGTE9BVCwgRkxPQVRdLFxuXHQgKlx0XHRcdFx0bGFiZWw6IHN0cmluZ1xuXHQgKlx0XHRcdH0sXG5cdCAqXHQgXHQuLi4gKFwiU3RhdHVzWVlcIilcblx0ICogIH1cblx0ICogfVxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5nZXRSb2JvdE1vZGVsID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5yb2JvdE1vZGVsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YUNvbmZpZyBjb25maWcgZm9yIGRhdGEgcmVxdWVzdFxuXHQgKiBpZiBkYXRhQ29uZmlnIGlzIGRlZmluZSA6IHNldCBhbmQgcmV0dXJuIHRoaXNcblx0ICpcdCBAcmV0dXJuIHtTdGF0dXN9IHRoaXNcblx0ICogZWxzZVxuXHQgKlx0IEByZXR1cm4ge09iamVjdH0gY3VycmVudCBkYXRhQ29uZmlnXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFDb25maWcgPSBmdW5jdGlvbihuZXdEYXRhQ29uZmlnKXtcblx0XHRpZihuZXdEYXRhQ29uZmlnKSB7XG5cdFx0XHR0aGlzLmRhdGFDb25maWc9bmV3RGF0YUNvbmZpZztcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gdGhpcy5kYXRhQ29uZmlnO1xuXHR9O1xuXHQvKipcblx0ICogVE8gQkUgSU1QTEVNRU5URUQgOiBvcGVyYXRvciBtYW5hZ2VtZW50IGluIEROLVN0YXR1c1xuXHQgKiBAcGFyYW0gIHtTdHJpbmd9XHQgbmV3T3BlcmF0b3IgOiB7W2xhc3RdLCBtYXgsIG1veSwgc2R9XG5cdCAqIEByZXR1cm4ge1N0YXR1c30gdGhpcyAtIGNoYWluYWJsZVxuXHQgKiBTZXQgb3BlcmF0b3IgY3JpdGVyaWEuXG5cdCAqIERlcGVuZHMgb24gbmV3T3BlcmF0b3Jcblx0ICpcdEBwYXJhbSB7U3RyaW5nfSBuZXdPcGVyYXRvclxuXHQgKlx0QHJldHVybiB0aGlzXG5cdCAqIEdldCBvcGVyYXRvciBjcml0ZXJpYS5cblx0ICpcdEByZXR1cm4ge1N0cmluZ30gb3BlcmF0b3Jcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YU9wZXJhdG9yID0gZnVuY3Rpb24obmV3T3BlcmF0b3Ipe1xuXHRcdGlmKG5ld09wZXJhdG9yKSB7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcub3BlcmF0b3IgPSBuZXdPcGVyYXRvcjtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gdGhpcy5kYXRhQ29uZmlnLm9wZXJhdG9yO1xuXHR9O1xuXHQvKipcblx0ICogRGVwZW5kcyBvbiBudW1TYW1wbGVzXG5cdCAqIEBwYXJhbSB7aW50fSBudW1iZXIgb2Ygc2FtcGxlcyBpbiBkYXRhTW9kZWxcblx0ICogaWYgZGVmaW5lZCA6IHNldCBudW1iZXIgb2Ygc2FtcGxlc1xuXHQgKlx0QHJldHVybiB7U3RhdHVzfSB0aGlzXG5cdCAqIGVsc2Vcblx0ICpcdEByZXR1cm4ge2ludH0gbnVtYmVyIG9mIHNhbXBsZXNcblx0ICoqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFTYW1wbGluZyA9IGZ1bmN0aW9uKG51bVNhbXBsZXMpe1xuXHRcdGlmKG51bVNhbXBsZXMpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5zYW1wbGluZyA9IG51bVNhbXBsZXM7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHRoaXMuZGF0YUNvbmZpZy5zYW1wbGluZztcblx0fTtcblx0LyoqXG5cdCAqIFNldCBvciBnZXQgZGF0YSB0aW1lIGNyaXRlcmlhIGJlZyBhbmQgZW5kLlxuXHQgKiBJZiBwYXJhbSBkZWZpbmVkXG5cdCAqXHRAcGFyYW0ge0RhdGV9IG5ld1RpbWVCZWcgLy8gbWF5IGJlIG51bGxcblx0ICpcdEBwYXJhbSB7RGF0ZX0gbmV3VGltZUVuZCAvLyBtYXkgYmUgbnVsbFxuXHQgKlx0QHJldHVybiB7U3RhdHVzfSB0aGlzXG5cdCAqIElmIG5vIHBhcmFtIGRlZmluZWQ6XG5cdCAqXHRAcmV0dXJuIHtPYmplY3R9IFRpbWUgb2JqZWN0OiBmaWVsZHMgYmVnIGFuZCBlbmQuXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFUaW1lID0gZnVuY3Rpb24obmV3VGltZUJlZyxuZXdUaW1lRW5kLCBuZXdSYW5nZSl7XG5cdFx0aWYobmV3VGltZUJlZyB8fCBuZXdUaW1lRW5kIHx8IG5ld1JhbmdlKSB7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5iZWcgPSBuZXdUaW1lQmVnLmdldFRpbWUoKTtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS50aW1lLmVuZCA9IG5ld1RpbWVFbmQuZ2V0VGltZSgpO1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUucmFuZ2UgPSBuZXdSYW5nZTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRiZWc6IG5ldyBEYXRlKHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS50aW1lLmJlZyksXG5cdFx0XHRcdGVuZDogbmV3IERhdGUodGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUuZW5kKSxcblx0XHRcdFx0cmFuZ2U6IG5ldyBEYXRlKHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS50aW1lLnJhbmdlKVxuXHRcdFx0fTtcblx0fTtcblx0LyoqXG5cdCAqIERlcGVuZHMgb24gcm9ib3RJZHNcblx0ICogU2V0IHJvYm90IGNyaXRlcmlhLlxuXHQgKlx0QHBhcmFtIHtBcnJheVtJbnRdfSByb2JvdElkcyBsaXN0IG9mIHJvYm90IElkc1xuXHQgKiBHZXQgcm9ib3QgY3JpdGVyaWEuXG5cdCAqXHRAcmV0dXJuIHtBcnJheVtJbnRdfSBsaXN0IG9mIHJvYm90IElkc1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5EYXRhUm9ib3RJZHMgPSBmdW5jdGlvbihyb2JvdElkcyl7XG5cdFx0aWYocm9ib3RJZHMpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS5yb2JvdCA9IHJvYm90SWRzO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEucm9ib3Q7XG5cdH07XG5cdC8qKlxuXHQgKiBEZXBlbmRzIG9uIHBsYWNlSWRzIC8vIG5vdCByZWxldmFudD8sIG5vdCBpbXBsZW1lbnRlZCB5ZXRcblx0ICogU2V0IHBsYWNlIGNyaXRlcmlhLlxuXHQgKlx0QHBhcmFtIHtBcnJheVtJbnRdfSBwbGFjZUlkcyBsaXN0IG9mIHBsYWNlIElkc1xuXHQgKiBHZXQgcGxhY2UgY3JpdGVyaWEuXG5cdCAqXHRAcmV0dXJuIHtBcnJheVtJbnRdfSBsaXN0IG9mIHBsYWNlIElkc1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5EYXRhUGxhY2VJZHMgPSBmdW5jdGlvbihwbGFjZUlkcyl7XG5cdFx0aWYocGxhY2VJZHMpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS5wbGFjZUlkID0gcGxhY2VJZHM7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS5wbGFjZTtcblx0fTtcblx0LyoqXG5cdCAqIEdldCBkYXRhIGJ5IHNlbnNvciBuYW1lLlxuXHQgKlx0QHBhcmFtIHtBcnJheVtTdHJpbmddfSBzZW5zb3JOYW1lIGxpc3Qgb2Ygc2Vuc29yc1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5nZXREYXRhQnlOYW1lID0gZnVuY3Rpb24oc2Vuc29yTmFtZXMpe1xuXHRcdHZhciBkYXRhPVtdO1xuXHRcdGZvcih2YXIgbiBpbiBzZW5zb3JOYW1lcykge1xuXHRcdFx0ZGF0YS5wdXNoKHRoaXMuZGF0YU1vZGVsW3NlbnNvck5hbWVzW25dXSk7XG5cdFx0fVxuXHRcdHJldHVybiBkYXRhO1xuXHR9O1xuXG5cdC8qKlxuIFx0ICogR2V0IGFsbCBzdGF0dXNlcyB3aXRoaW4gNCBkYXlzXG5cdCAqIEBwYXJhbSB7Kn0gcm9ib3Rfb2JqZWN0IFxuXHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1x0XHRyZXR1cm4gY2FsbGJhY2soLTEgaWYgbm90IGZvdW5kL2RhdGEgb3RoZXJ3aXNlKVxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5fZ2V0QW5kVXBkYXRlTXVsdGlkYXlTdGF0dXNlcyA9IGZ1bmN0aW9uIChyb2JvdF9vYmplY3RzLCBjYWxsYmFjaykge1xuXHRcdExvZ2dlci5kZWJ1ZyhgU3RhdHVzLmdldEluaXRpYWxTdGF0dXNgKVxuXHRcdHJvYm90X29iamVjdHMuZm9yRWFjaChvYmplY3QgPT4ge1xuXHRcdFx0aWYgKG9iamVjdC5Sb2JvdElkID09IG51bGwgfHwgb2JqZWN0LlJvYm90TmFtZSA9PSBudWxsKSB7XG5cdFx0XHRcdExvZ2dlci53YXJuKGBNdWx0aWRheSBzdGF0dXMgcmVxdWVzdCBlcnJvcjogYm90aCBSb2JvdElkIGFuZCBSb2JvdE5hbWUgc2hvdWxkIGJlIG5vdCBudWxsOiAke29iamVjdC5Sb2JvdElkfSwgJHtvYmplY3QuUm9ib3ROYW1lfWApXG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXHRcdFx0bGV0IHJlcSA9IHtcblx0XHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdFx0ZnVuYzogXCJHZXRNdWx0aWRheVN0YXR1c2VzXCIsXG5cdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzJyxcblx0XHRcdFx0XHRwYXRoOiBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1c1wiXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRyb2JvdF9uYW1lczogW29iamVjdC5Sb2JvdE5hbWVdXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGxldCBmbiA9IChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjaygtMSk7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGVycilcblx0XHRcdFx0fVxuXHRcdFx0XHRMb2dnZXIuZGVidWcoJ1JlY2VpdmVkIG11bHRpZGF5IHN0YXR1c2VzIG9mIHJvYm90Jywgb2JqZWN0LlJvYm90SWQsIG9iamVjdC5Sb2JvdE5hbWUsIGRhdGEpXG5cdFx0XHRcdC8vIFVwZGF0ZSByb2JvdE1vZGVsIHZhcmlhYmxlXG5cdFx0XHRcdHRoaXMuX2dldFJvYm90TW9kZWxGcm9tUmVjdjIoZGF0YSwgb2JqZWN0LlJvYm90SWQsIG9iamVjdC5Sb2JvdE5hbWUpO1xuXHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2sodGhpcy5yb2JvdE1vZGVsKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRMb2dnZXIuZGVidWcoYFJlcXVlc3RpbmcgbXVsdGlkYXkgc3RhdHVzZXMgb2Ygcm9ib3Q6YCwgb2JqZWN0LlJvYm90SWQsIG9iamVjdC5Sb2JvdE5hbWUpXG5cdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3QocmVxLCBmbilcblx0XHR9KVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQgJ1BhcnRzJyByZWZlcmVuY2UgbWFwIHRvIHJlZHVjZSBzdGF0dXMgcGF5bG9hZC4gRHVwbGljYXRlZCBjb250ZW50cyBpbiBzdGF0dXMgYXJlIHN0b3JlZCBpbiB0aGUgbWFwLlxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5fZ2V0UGFydFJlZmVyZW5jZU1hcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAodGhpcy5fcGFydFJlZmVyZW5jZU1hcCA9PSBudWxsIHx8IHRoaXMuX3BhcnRSZWZlcmVuY2VNYXAubGVuZ3RoID09IDApIHtcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdFx0c2VydmljZTogJ1N0YXR1cycsXG5cdFx0XHRcdFx0ZnVuYzogJ0dldFBhcnRSZWZlcmVuY2VNYXAnLFxuXHRcdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMnLFxuXHRcdFx0XHRcdFx0cGF0aDogJy9mci9wYXJ0bmVyaW5nL1N0YXR1cydcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdExvZ2dlci5kZWJ1ZyhgUGFydFJlZmVyZW5jZU1hcCwgZXJyYCwgZGF0YSwgZXJyKVxuXHRcdFx0XHRcdGlmIChkYXRhID09IG51bGwpIHtcblx0XHRcdFx0XHRcdGRhdGEgPSBbXVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLl9wYXJ0UmVmZXJlbmNlTWFwID0gZGF0YVxuXHRcdFx0XHRcdHJlc29sdmUoKSAvLyByZXR1cm5zIGEgbWFwIG9mIHBhcnRpZCB0byBpdHMgcHJvcGVydGllc1xuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHR9XG5cdFx0TG9nZ2VyLmRlYnVnKCdQYXJ0UmVmZXJlbmNlTWFwIGFscmVhZHkgZXhpc3RzLCBubyBuZWVkIHRvIHJlcXVlc3QuIE51bWJlciBvZiBwYXJ0czonLCB0aGlzLl9wYXJ0UmVmZXJlbmNlTWFwLmxlbmd0aClcblx0fTtcblxuXHQvKipcblx0ICogR2V0ICdTdGF0dXNFdnRzJyByZWZlcmVuY2UgbWFwIHRvIHJlZHVjZSBzdGF0dXMgcGF5bG9hZC4gRHVwbGljYXRlZCBjb250ZW50cyBpbiBzdGF0dXMgYXJlIHN0b3JlZCBpbiB0aGUgbWFwLlxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5fZ2V0U3RhdHVzRXZ0UmVmZXJlbmNlTWFwID0gZnVuY3Rpb24gKCkge1xuXHRcdGlmICh0aGlzLl9zdGF0dXNFdnRSZWZlcmVuY2VNYXAgPT0gbnVsbCB8fCB0aGlzLl9zdGF0dXNFdnRSZWZlcmVuY2VNYXAubGVuZ3RoID09IDApIHtcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdFx0c2VydmljZTogJ1N0YXR1cycsXG5cdFx0XHRcdFx0ZnVuYzogJ0dldFN0YXR1c0V2dFJlZmVyZW5jZU1hcCcsXG5cdFx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cycsXG5cdFx0XHRcdFx0XHRwYXRoOiAnL2ZyL3BhcnRuZXJpbmcvU3RhdHVzJ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdFx0TG9nZ2VyLmRlYnVnKGBTdGF0dXNFdnRSZWZlcmVuY2VNYXAsIGVycmAsIGRhdGEsIGVycilcblx0XHRcdFx0XHRpZiAoZGF0YSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRkYXRhID0gW11cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy5fc3RhdHVzRXZ0UmVmZXJlbmNlTWFwID0gZGF0YVxuXHRcdFx0XHRcdHJlc29sdmUoKSAvLyByZXR1cm5zIGEgbWFwIG9mIHBhcnRpZCB0byBpdHMgcHJvcGVydGllc1xuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHR9XG5cdFx0TG9nZ2VyLmRlYnVnKCdTdGF0dXNFdnRSZWZlcmVuY2VNYXAgYWxyZWFkeSBleGlzdHMsIG5vIG5lZWQgdG8gcmVxdWVzdC4gTnVtYmVyIG9mIHBhcnRzOicsIHRoaXMuX3N0YXR1c0V2dFJlZmVyZW5jZU1hcC5sZW5ndGgpXG5cdH07XG5cblx0LyoqXG5cdCAqIFN1YnNjcmliZXMgdG8gc3RhdHVzIGNoYW5nZXMgZm9yIGFsbCBwYXJ0c1xuXHQgKiBAcGFyYW0geyp9IHBhcnRzIFxuXHQgKiBAcGFyYW0geyp9IGNhbGxiYWNrIFxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5fc3Vic2NyaWJlVG9TdGF0dXNDaGFuZ2VkID0gZnVuY3Rpb24gKHBhcnRzLCBjYWxsYmFjaykge1xuXHRcdGlmIChwYXJ0cyA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHRpZiAodHJ1ZSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0cGFydHMuZm9yRWFjaChwYXJ0ID0+IHtcblx0XHRcdGxldCBvYmogPSB7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnU3RhdHVzQ2hhbmdlZCcsXG5cdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnLFxuXHRcdFx0XHRcdHBhdGg6IG9iamVjdFBhdGhcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0bGV0IGZuID0gKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdExvZ2dlci5lcnJvcihcIlN0YXR1c1N1YnNjcmliZTpcIiArIGVycilcblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0fVxuXHRcdFx0XHRMb2dnZXIuZGVidWcoYFN0YXR1c0NoYW5nZWQgaXMgY2FsbGVkLCBkYXRhOmAsIGRhdGEpXG5cdFx0XHRcdC8vIFVwZGF0ZSByb2JvdE1vZGVsIHZhcmlhYmxlXG5cdFx0XHRcdHRoaXMuX2dldFJvYm90TW9kZWxGcm9tUmVjdjIoZGF0YSwgcGFydC5Sb2JvdElkLCBwYXJ0LlJvYm90TmFtZSk7XG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRsZXQgc3VicyA9IHRoaXMuc2VsZWN0b3Iuc3Vic2NyaWJlKG9iaiwgZm4pO1xuXHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zLnB1c2goc3Vicyk7XG5cdFx0fSlcblxuXHQvLyBcdGxldCBzdWJzID0gdGhpcy5zZWxlY3Rvci5zdWJzY3JpYmUoey8vIHN1YnNjcmliZXMgdG8gc3RhdHVzIGNoYW5nZXMgZm9yIGFsbCBwYXJ0c1xuXHQvLyBcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdC8vIFx0XHRmdW5jOiAnU3RhdHVzQ2hhbmdlZCcsXG5cdC8vIFx0XHRvYmo6IHtcblx0Ly8gXHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0Ly8gXHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoXG5cdC8vIFx0XHR9LFxuXHQvLyBcdFx0ZGF0YTogcm9ib3ROYW1lc1xuXHQvLyB9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0Ly8gXHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHQvLyBcdFx0XHRcdExvZ2dlci5lcnJvcihcIlN0YXR1c1N1YnNjcmliZTpcIiArIGVycik7XG5cdC8vIFx0XHR9IGVsc2Uge1xuXHQvLyBcdFx0XHRcdHNlbmREYXRhWzBdID0gZGF0YTtcblx0Ly8gXHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHQvLyBcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0Ly8gXHRcdFx0XHRcdFx0Y2FsbGJhY2sodGhpcy5yb2JvdE1vZGVsLCBwZWVySWQpO1xuXHQvLyBcdFx0XHRcdH1cblx0Ly8gXHRcdH1cblx0Ly8gfSk7XG5cdC8vIHRoaXMuc3Vic2NyaXB0aW9ucy5wdXNoKHN1YnMpO1xuXG5cdH1cblxuXHQvKipcblx0ICogUXVlcnkgZm9yIGluaXRpYWwgc3RhdHVzZXNcblx0ICogU3Vic2NyaWJlIHRvIGVycm9yL3N0YXR1cyB1cGRhdGVzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLndhdGNoID0gZnVuY3Rpb24gKHJvYm90TmFtZXMsIGNhbGxiYWNrKSB7XG5cdFx0TG9nZ2VyLmRlYnVnKGBTdGF0dXMud2F0Y2g6IHJvYm90TmFtZXNgLCByb2JvdE5hbWVzKVxuXG5cdFx0dGhpcy5zZWxlY3Rvci5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cdFx0dGhpcy5zZWxlY3Rvci5fY29ubmVjdGlvbi5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cblx0XHQvLyBQcm9taXNlIHRvIHJldHJpZXZlIGxpc3Qgb2YgcGFpcmVkIG5laWdoYm9ycywgaS5lLiBhbGwgbmVpZ2hib3Igcm9ib3RzIGluIHRoZSBzYW1lIG1lc2ggbmV0d29ya1xuXHRcdGxldCBnZXROZWlnaGJvcnMgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnTWVzaE5ldHdvcmsnLFxuXHRcdFx0XHRmdW5jOiAnTGlzdE5laWdoYm9ycycsXG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIG5laWdoYm9ycykgPT4ge1xuXHRcdFx0XHRMb2dnZXIuZGVidWcoYG5laWdoYm9ycywgZXJyYCwgbmVpZ2hib3JzLCBlcnIpXG5cdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdHJlamVjdChlcnIpXG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gVGhpcyBvbmx5IHJldHVybnMgdGhlIGxpc3Qgb2YgcGh5c2ljYWwgZGV2aWNlcyBwYWlyZWQgaW50byB0aGUgbWVzaCBuZXR3b3JrLCB0aGUgZGl5YS1zZXJ2ZXIgaW5zdGFuY2UgaXMgbm90IGFscmVhZHkgaW5jbHVkZWQgaW4gdGhlIGxpc3Rcblx0XHRcdFx0aWYgKG5laWdoYm9ycyA9PSBudWxsKSB7XG5cdFx0XHRcdFx0bmVpZ2hib3JzID0gW11cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXNvbHZlKG5laWdoYm9ycykgLy8gcmV0dXJucyBhIGFycmF5IG9mIG5laWdoYm9yIG9iamVjdCwgZWFjaCBvYmplY3QgaXMgYW4gYXJyYXkgb2YgW3JvYm90LW5hbWUsIGFkZHJlc3MsIGJvb2xdXG5cdFx0XHR9KVxuXHRcdH0pXG5cblx0XHQvLyBQcm9taXNlIHRvIHJldHJpZXZlIGFsbCBvYmplY3RzIChyb2JvdHMsIHBhcnRzKSBleHBvc2VkIGluIERCdXMgYnkgZGl5YS1ub2RlLXN0YXR1c1xuXHRcdGxldCBnZXRSb2JvdHNBbmRQYXJ0cyA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdvcmcuZnJlZWRlc2t0b3AuREJ1cy5PYmplY3RNYW5hZ2VyJyxcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBvYmpEYXRhKSA9PiB7IC8vIGdldCBhbGwgb2JqZWN0IHBhdGhzLCBpbnRlcmZhY2VzIGFuZCBwcm9wZXJ0aWVzIGNoaWxkcmVuIG9mIFN0YXR1c1xuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwgfHwgb2JqRGF0YSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0cmVqZWN0KGVycilcblx0XHRcdFx0fVxuXHRcdFx0XHRMb2dnZXIuZGVidWcoYE1hbmFnZWRQYXJ0c2AsIG9iakRhdGEpXG5cdFx0XHRcdHJlc29sdmUob2JqRGF0YSkgLy8gcmV0dXJucyBhIG1hcCB0aGF0IGxpbmtzIHRoZSBvYmplY3QgcGF0aCB0byBpdHMgY29ycmVzcG9uZGluZyBpbnRlcmZhY2Vcblx0XHRcdH0pXG5cdFx0fSlcblxuXHRcdGxldCByb2JvdElmYWNlID0gJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90J1xuXHRcdGxldCBwYXJ0SWZhY2UgPSAnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCdcblxuXHRcdC8vIGpzIG9iamVjdHMgb2Ygcm9ib3RzIGFuZCBwYXJ0c1xuXHRcdGxldCByb2JvdE1hcCA9IG5ldyBNYXAoKSAvLyBtYXAgcm9ib3QgbmFtZSB0byBpZFxuXHRcdGxldCByb2JvdHMgPSBbXSAvLyBsaXN0IG9mIHJvYm90IG9iamVjdHNcblx0XHRsZXQgcGFydHMgPSBbXSAvLyBsaXN0IG9mIHBhcnQgb2JqZWN0XG5cdFx0bGV0IG1lc2hlZFJvYm90TmFtZXMgPSBbXSAvLyBsaXN0IG9mIG5hbWVzIG9mIHJvYm90cyBhbmQgZGl5YS1zZXJ2ZXIgaW4gdGhlIG1lc2ggbmV0d29ya1xuXG5cdFx0Ly8gUmV0cmlldmUgcmVmZXJlbmNlIG1hcCBvZiBrZXlzIGFuZCB2YWx1ZXMgaW4gb3JkZXIgdG8gcmVkdWNlIHBheWxvYWQgZm9yIHN0YXR1cyByZXF1ZXN0c1xuXHRcdHJldHVybiBQcm9taXNlLnRyeShfID0+IHRoaXMuX2dldFBhcnRSZWZlcmVuY2VNYXAoKSlcblx0XHRcdC50aGVuKF8gPT4gdGhpcy5fZ2V0U3RhdHVzRXZ0UmVmZXJlbmNlTWFwKCkpXG5cdFx0XHQudGhlbihfID0+IGdldE5laWdoYm9ycylcblx0XHRcdC50aGVuKHJldCA9PiB7XG5cdFx0XHRcdGlmIChyZXQgPT0gbnVsbCB8fCAhQXJyYXkuaXNBcnJheShyZXQpKSB7XG5cdFx0XHRcdFx0bWVzaGVkUm9ib3ROYW1lcyA9IFtdXG5cdFx0XHRcdH1cblx0XHRcdFx0bGV0IGhvc3RuYW1lID0gdGhpcy5zZWxlY3Rvci5fY29ubmVjdGlvbi5fc2VsZlxuXHRcdFx0XHRtZXNoZWRSb2JvdE5hbWVzID0gcmV0Lm1hcChyID0+IHJbMF0pIC8vIHdlIG9ubHkga2VlcCB0aGUgcm9ib3QgbmFtZXNcblx0XHRcdFx0aWYgKCFtZXNoZWRSb2JvdE5hbWVzLmluY2x1ZGVzKGhvc3RuYW1lKSkge1xuXHRcdFx0XHRcdG1lc2hlZFJvYm90TmFtZXMucHVzaChob3N0bmFtZSkgLy8gYWRkIGhvc3RuYW1lLCBpLmUuIHRoZSBkaXlhLXNlcnZlciwgd2hpY2ggaXMgbm90IGluIHRoZSBsaXN0IG9mIG5laWdoYm9yc1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oXyA9PiBnZXRSb2JvdHNBbmRQYXJ0cylcblx0XHRcdC50aGVuKHJldCA9PiB7XG5cdFx0XHRcdGZvciAobGV0IG9iamVjdFBhdGggaW4gcmV0KSB7XG5cdFx0XHRcdFx0Ly8gdGhlIG9iamVjdCBvYnRhaW5lZCBmcm9tIHRoZSBvYmplY3QgcGF0aFxuXHRcdFx0XHRcdGxldCBvYmplY3QgPSByZXRbb2JqZWN0UGF0aF1cblxuXHRcdFx0XHRcdC8vIGlmIHRoZSByZXR1cm4gb2JqZWN0IGlzIG9mIGEgcm9ib3QgaW4gdGhlIGxpc3Qgb2YgbmVpZ2hib3JzLCBvciBvZiB0aGUgZGl5YS1zZXJ2ZXIsIHJldHJpZXZlIGFsbCBvZml0cyByZWxldmFudCBzdGF0dXNlc1xuXHRcdFx0XHRcdExvZ2dlci5kZWJ1ZygnT2JqZWN0Jywgb2JqZWN0KVxuXHRcdFx0XHRcdExvZ2dlci5kZWJ1Zygncm9ib3RJZmFjZScsIHJvYm90SWZhY2UpXG5cblx0XHRcdFx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KHJvYm90SWZhY2UpKSB7IC8vIHRoaXMgaXMgcm9ib3Qgb2JqZWN0XG5cdFx0XHRcdFx0XHRyb2JvdHMucHVzaChvYmplY3Rbcm9ib3RJZmFjZV0pXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gaWYgdGhlIHJldHVybiBvYmplY3QgaXMgb2YgYSBwYXJ0LCBsaXN0ZW4gdG8gc2lnbmFsIFN0YXR1c0NoYW5nZWQgb2YgdGhlIHBhcnRcblx0XHRcdFx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KHBhcnRJZmFjZSkpIHsgLy8gdGhpcyBpcyBhIHBhcnQgb2JqZWN0XG5cdFx0XHRcdFx0XHRsZXQgcGFydCA9IG9iamVjdFtwYXJ0SWZhY2VdXG5cdFx0XHRcdFx0XHRwYXJ0Lm9iamVjdFBhdGggPSBvYmplY3RQYXRoXG5cdFx0XHRcdFx0XHRwYXJ0LlJvYm90TmFtZSA9IG9iamVjdFBhdGguc3BsaXQoJy8nKVs1XSAvKiAvZnIvcGFydG5lcmluZy9TdGF0dXMvUm9ib3RzL0IxUjAwMDM3L1BhcnRzL3ZvY3QgKi9cblx0XHRcdFx0XHRcdHBhcnRzLnB1c2gocGFydClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRMb2dnZXIuZGVidWcoJ3JvYm90cycsIHJvYm90cylcblx0XHRcdFx0TG9nZ2VyLmRlYnVnKCdnZXRQYXJ0cycsIHBhcnRzKVxuXG5cdFx0XHRcdC8vIGZpbGVyIGFuZCBrZWVwIHRoZSBkaXlhLXNlcnZlciBhbmQgdGhlIHJvYm90cyB0aGF0IGFyZSBvbmx5IGluIHRoZSBzYW1lIG1lc2ggbmV0d29ya3Ncblx0XHRcdFx0cm9ib3RzID0gcm9ib3RzLmZpbHRlcihyb2JvdCA9PiBtZXNoZWRSb2JvdE5hbWVzLmluY2x1ZGVzKHJvYm90LlJvYm90TmFtZSkpIC8vIG9ubHkga2VlcHMgcm9ib3RzIHRoYXQgYXJlIG5laWdoYm9ycyAoaS5lLiBpbiB0aGUgc2FtZSBtZXNoIG5ldHdvcmspXG5cblx0XHRcdFx0Ly8gZmlsdGVyIHBhcnRzIHRoYXQgYmVsb25ncyB0byB0aGUgcm9ib3QgaW4gdGhlIG1lc2ggbmV0d29yayAoaW5jbHVkaW5nIHRoZSBkaXlhLXNlcnZlcilcblx0XHRcdFx0cGFydHMgPSBwYXJ0cy5maWx0ZXIocGFydCA9PiBtZXNoZWRSb2JvdE5hbWVzLmluY2x1ZGVzKHBhcnQuUm9ib3ROYW1lKSkgLy8gb25seSBrZWVwcyBwYXJ0cyBiZWxvbmdpbmcgdG8gbmVpZ2hib3JzIChpLmUuIGluIHRoZSBzYW1lIG1lc2ggbmV0d29yaylcblxuXHRcdFx0XHQvLyBjcmVhdGUgbWFwIG9mIHJvYm90IG5hbWUgdG8gaWQgZm9yIHNldHRpbmcgUm9ib3RJZCB0byBwYXRoc1xuXHRcdFx0XHRyb2JvdHMuZm9yRWFjaChyb2JvdCA9PiB7XG5cdFx0XHRcdFx0aWYgKHJvYm90TWFwLmhhcyhyb2JvdC5Sb2JvdE5hbWUpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cm9ib3RNYXAuc2V0KHJvYm90LlJvYm90TmFtZSwgcm9ib3QuUm9ib3RJZClcblx0XHRcdFx0fSlcblxuXHRcdFx0XHQvLyBzZXQgUm9ib3RJZCB0byBlYWNoIHBhcnRcblx0XHRcdFx0cGFydHMuZm9yRWFjaChwYXJ0ID0+IHtcblx0XHRcdFx0XHRwYXJ0LlJvYm90SWQgPSByb2JvdE1hcC5nZXQocGFydC5Sb2JvdE5hbWUpXG5cdFx0XHRcdH0pXG5cdFx0XHRcdFxuXHRcdFx0XHRMb2dnZXIuZGVidWcoJ21lc2hlZCByb2JvdHMnLCByb2JvdHMpXG5cdFx0XHRcdExvZ2dlci5kZWJ1ZygnbWVzaGVkIHBhcnRzJywgcGFydHMpXG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oXyA9PiB0aGlzLl9nZXRBbmRVcGRhdGVNdWx0aWRheVN0YXR1c2VzKHJvYm90cywgY2FsbGJhY2spKSAvLyBSZXRyaWV2ZSBpbml0aWFsIHN0YXR1c2VzIGZyb20gdGhlIGZpbHRlcmVkIHJvYm90c1xuXHRcdFx0LnRoZW4oXyA9PiB0aGlzLl9zdWJzY3JpYmVUb1N0YXR1c0NoYW5nZWQocGFydHMsIGNhbGxiYWNrKSkgLy8gTGlzdGVuIHRvIFN0YXR1c0NoYW5nZSBmcm9tIHRoZSBwYXJ0cyBiZWxvbmdpbmcgdG8gdGhlIGZpbHRlcmVkIHJvYm90c1xuXG5cdFx0aWYgKHRydWUpIHJldHVyblxuXG5cdFx0Ly8gLy8gU3Vic2NyaWJlIHRvIHNpZ25hbHNcblxuXHRcdC8vIGxldCBzZW5kRGF0YSA9IFtdO1xuXHRcdC8vIGxldCByb2JvdElkcyA9IFtdO1xuXHRcdC8vIHJldHVybiBQcm9taXNlLnRyeShfID0+IHtcblx0XHQvLyBcdGxldCByZXEgPSB0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdC8vIFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHQvLyBcdFx0ZnVuYzogJ0dldE1hbmFnZWRPYmplY3RzJyxcblx0XHQvLyBcdFx0b2JqOiB7XG5cdFx0Ly8gXHRcdFx0aW50ZXJmYWNlOiAnb3JnLmZyZWVkZXNrdG9wLkRCdXMuT2JqZWN0TWFuYWdlcicsXG5cdFx0Ly8gXHRcdH1cblx0XHQvLyBcdH0sIChwZWVySWQsIGVyciwgb2JqRGF0YSkgPT4geyAvLyBnZXQgYWxsIG9iamVjdCBwYXRocywgaW50ZXJmYWNlcyBhbmQgcHJvcGVydGllcyBjaGlsZHJlbiBvZiBTdGF0dXNcblx0XHQvLyBcdFx0bGV0IHJvYm90TmFtZSA9ICcnO1xuXHRcdC8vIFx0XHRsZXQgcm9ib3RJZCA9IDE7XG5cblx0XHQvLyBcdFx0TG9nZ2VyLmRlYnVnKGBTdGF0dXMuR2V0TWFuYWdlZE9iamVjdHM6IG9iakRhdGEgPSBgKVxuXHRcdC8vIFx0XHRMb2dnZXIuZGVidWcob2JqRGF0YSlcblxuXHRcdC8vIFx0XHRmb3IgKGxldCBvYmplY3RQYXRoIGluIG9iakRhdGEpIHtcblx0XHQvLyBcdFx0XHRpZiAob2JqRGF0YVtvYmplY3RQYXRoXVsnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXSAhPSBudWxsKSB7XG5cdFx0Ly8gXHRcdFx0XHRyb2JvdE5hbWUgPSBvYmpEYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90TmFtZTtcblx0XHQvLyBcdFx0XHRcdHJvYm90SWQgPSBvYmpEYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90SWQ7XG5cdFx0Ly8gXHRcdFx0XHRyb2JvdElkc1tyb2JvdE5hbWVdID0gcm9ib3RJZDtcblx0XHQvLyBcdFx0XHRcdHRoaXMuX2dldEluaXRpYWxTdGF0dXMocm9ib3RJZCwgcm9ib3ROYW1lLCBmdW5jdGlvbiAobW9kZWwpIHtcblx0XHQvLyBcdFx0XHRcdFx0Y2FsbGJhY2sobW9kZWwsIHBlZXJJZCk7XG5cdFx0Ly8gXHRcdFx0XHR9KVxuXHRcdC8vIFx0XHRcdH1cblx0XHQvLyBcdFx0XHRpZiAob2JqRGF0YVtvYmplY3RQYXRoXVsnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCddICE9IG51bGwpIHtcblx0XHQvLyBcdFx0XHRcdGxldCBzdWJzID0gdGhpcy5zZWxlY3Rvci5zdWJzY3JpYmUoey8vIHN1YnNjcmliZXMgdG8gc3RhdHVzIGNoYW5nZXMgZm9yIGFsbCBwYXJ0c1xuXHRcdC8vIFx0XHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHQvLyBcdFx0XHRcdFx0ZnVuYzogJ1N0YXR1c0NoYW5nZWQnLFxuXHRcdC8vIFx0XHRcdFx0XHRvYmo6IHtcblx0XHQvLyBcdFx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0XHQvLyBcdFx0XHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoXG5cdFx0Ly8gXHRcdFx0XHRcdH0sXG5cdFx0Ly8gXHRcdFx0XHRcdGRhdGE6IHJvYm90TmFtZXNcblx0XHQvLyBcdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdC8vIFx0XHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHQvLyBcdFx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJTdGF0dXNTdWJzY3JpYmU6XCIgKyBlcnIpO1xuXHRcdC8vIFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdC8vIFx0XHRcdFx0XHRcdExvZ2dlci5kZWJ1ZyhgU3RhdHVzQ2hhbmdlZCBpcyBjYWxsZWRgKVxuXHRcdC8vIFx0XHRcdFx0XHRcdHNlbmREYXRhWzBdID0gZGF0YTtcblx0XHQvLyBcdFx0XHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdC8vIFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHQvLyBcdFx0XHRcdFx0XHRcdGNhbGxiYWNrKHRoaXMucm9ib3RNb2RlbCwgcGVlcklkKTtcblx0XHQvLyBcdFx0XHRcdFx0XHR9XG5cdFx0Ly8gXHRcdFx0XHRcdH1cblx0XHQvLyBcdFx0XHRcdH0pO1xuXHRcdC8vIFx0XHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zLnB1c2goc3Vicyk7XG5cdFx0Ly8gXHRcdFx0fVxuXHRcdC8vIFx0XHR9XG5cdFx0Ly8gXHR9KVxuXHRcdC8vIH0pLmNhdGNoKGVyciA9PiB7XG5cdFx0Ly8gXHRMb2dnZXIuZXJyb3IoZXJyKTtcblx0XHQvLyB9KVxuXG5cdH07XG5cblx0LyoqXG5cdCAqIENsb3NlIGFsbCBzdWJzY3JpcHRpb25zXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmNsb3NlU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uKCl7XG5cdFx0Zm9yKHZhciBpIGluIHRoaXMuc3Vic2NyaXB0aW9ucykge1xuXHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zW2ldLmNsb3NlKCk7XG5cdFx0fVxuXHRcdHRoaXMuc3Vic2NyaXB0aW9ucyA9W107XG5cdFx0dGhpcy5yb2JvdE1vZGVsID0gW107XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldCBkYXRhIGdpdmVuIGRhdGFDb25maWcuXG5cdCAqIEBwYXJhbSB7ZnVuY30gY2FsbGJhY2sgOiBjYWxsZWQgYWZ0ZXIgdXBkYXRlXG5cdCAqIFRPRE8gVVNFIFBST01JU0Vcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuZ2V0RGF0YSA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBkYXRhQ29uZmlnKXtcblx0XHR2YXIgZGF0YU1vZGVsID0ge307XG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KF8gPT4ge1xuXHRcdFx0aWYoZGF0YUNvbmZpZyAhPSBudWxsKVxuXHRcdFx0XHR0aGlzLkRhdGFDb25maWcoZGF0YUNvbmZpZyk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcIlJlcXVlc3Q6IFwiK0pTT04uc3RyaW5naWZ5KGRhdGFDb25maWcpKTtcblx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRcdGZ1bmM6IFwiRGF0YVJlcXVlc3RcIixcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdHR5cGU6XCJzcGxSZXFcIixcblx0XHRcdFx0XHRkYXRhQ29uZmlnOiB0aGlzLmRhdGFDb25maWdcblx0XHRcdFx0fVxuXHRcdFx0fSwgKGRuSWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJbXCIgKyB0aGlzLmRhdGFDb25maWcuc2Vuc29ycyArIFwiXSBSZWN2IGVycjogXCIgKyBKU09OLnN0cmluZ2lmeShlcnIpKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoZGF0YS5oZWFkZXIuZXJyb3IgIT0gbnVsbCkge1xuXHRcdFx0XHRcdC8vIFRPRE8gOiBjaGVjay91c2UgZXJyIHN0YXR1cyBhbmQgYWRhcHQgYmVoYXZpb3IgYWNjb3JkaW5nbHlcblx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJVcGRhdGVEYXRhOlxcblwiK0pTT04uc3RyaW5naWZ5KGRhdGEuaGVhZGVyLnJlcUNvbmZpZykpO1xuXHRcdFx0XHRcdExvZ2dlci5lcnJvcihcIkRhdGEgcmVxdWVzdCBmYWlsZWQgKFwiK2RhdGEuaGVhZGVyLmVycm9yLnN0K1wiKTogXCIrZGF0YS5oZWFkZXIuZXJyb3IubXNnKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly9Mb2dnZXIubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuZGF0YU1vZGVsKSk7XG5cdFx0XHRcdGRhdGFNb2RlbCA9IHRoaXMuX2dldERhdGFNb2RlbEZyb21SZWN2KGRhdGEpO1xuXG5cdFx0XHRcdExvZ2dlci5sb2codGhpcy5nZXREYXRhTW9kZWwoKSk7XG5cdFx0XHRcdGNhbGxiYWNrID0gY2FsbGJhY2suYmluZCh0aGlzKTsgLy8gYmluZCBjYWxsYmFjayB3aXRoIFN0YXR1c1xuXHRcdFx0XHRjYWxsYmFjayhkYXRhTW9kZWwpOyAvLyBjYWxsYmFjayBmdW5jXG5cdFx0XHR9KTtcblx0XHR9KS5jYXRjaChlcnIgPT4ge1xuXHRcdFx0TG9nZ2VyLmVycm9yKGVycilcblx0XHR9KVxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIFVwZGF0ZSBpbnRlcm5hbCByb2JvdCBtb2RlbCB3aXRoIHJlY2VpdmVkIGRhdGEgKHZlcnNpb24gMilcblx0ICogQHBhcmFtICB7T2JqZWN0fSBkYXRhIGRhdGEgcmVjZWl2ZWQgZnJvbSBEaXlhTm9kZSBieSB3ZWJzb2NrZXRcblx0ICogQHJldHVybiB7W3R5cGVdfVx0XHRbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyID0gZnVuY3Rpb24oZGF0YSwgcm9ib3RJZCwgcm9ib3ROYW1lKSB7XG5cdFx0aWYgKHRoaXMuX3BhcnRSZWZlcmVuY2VNYXAgPT0gbnVsbCkge1xuXHRcdFx0dGhpcy5fcGFydFJlZmVyZW5jZU1hcCA9IFtdXG5cdFx0fVxuXHRcdGlmICh0aGlzLl9zdGF0dXNFdnRSZWZlcmVuY2VNYXAgPT0gbnVsbCkge1xuXHRcdFx0dGhpcy5fc3RhdHVzRXZ0UmVmZXJlbmNlTWFwID0gW11cblx0XHR9XG5cdFx0aWYodGhpcy5yb2JvdE1vZGVsID09IG51bGwpXG5cdFx0XHR0aGlzLnJvYm90TW9kZWwgPSBbXTtcblxuXHRcdGlmKHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSAhPSBudWxsKVxuXHRcdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdLnBhcnRzID0ge307IC8vIHJlc2V0IHBhcnRzXG5cblx0XHRpZih0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0gPT0gbnVsbClcblx0XHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSA9IHt9O1xuXG5cdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdID0ge1xuXHRcdFx0cm9ib3Q6IHtcblx0XHRcdFx0bmFtZTogcm9ib3ROYW1lXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKiBleHRyYWN0IHBhcnRzIGluZm8gKiovXG5cdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdLnBhcnRzID0ge307XG5cdFx0bGV0IHJQYXJ0cyA9IHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXS5wYXJ0cztcblxuXHRcdGRhdGEuZm9yRWFjaChkID0+IHtcblx0XHRcdGxldCBwYXJ0SWQgPSBkWzBdO1xuXHRcdFx0bGV0IHRpbWUgPSBkWzFdO1xuXHRcdFx0bGV0IGNvZGUgPSBkWzJdO1xuXG5cdFx0XHQvLyBtYXAgdGhlIGhhc2ggdmFsdWUgdG8gdGhlIHN0YXR1cyBldmVudCB2YWx1ZXNcblx0XHRcdGxldCBoYXNoID0gZFszXTtcblx0XHRcdGxldCBzdGF0dXNFdnRSZWZlcmVuY2UgPSB0aGlzLl9zdGF0dXNFdnRSZWZlcmVuY2VNYXBbaGFzaF1cblx0XHRcdGlmIChzdGF0dXNFdnRSZWZlcmVuY2UgPT0gbnVsbCkge1xuXHRcdFx0XHRMb2dnZXIud2FybihgU3RhdHVzRXZ0UmVmZXJlbmNlIGZpbmRzIG5vIG1hcCBmb3IgaGFzaCBrZXkgJHtoYXNofWApXG5cdFx0XHR9XG5cdFx0XHRsZXQgY29kZVJlZiA9IHN0YXR1c0V2dFJlZmVyZW5jZSA9PSBudWxsID8gbnVsbCA6IHN0YXR1c0V2dFJlZmVyZW5jZVswXTtcblx0XHRcdGxldCBtc2cgPSBzdGF0dXNFdnRSZWZlcmVuY2UgPT0gbnVsbCA/IG51bGwgOiBzdGF0dXNFdnRSZWZlcmVuY2VbMV07XG5cdFx0XHRsZXQgY3JpdExldmVsID0gc3RhdHVzRXZ0UmVmZXJlbmNlID09IG51bGwgPyBudWxsIDogc3RhdHVzRXZ0UmVmZXJlbmNlWzJdO1xuXG5cdFx0XHQvLyBtYXAgdGhlIHBhcnRJZCB0byB0aGUgcGFydCByZWZlcmVuY2UgdmFsdWVzXG5cdFx0XHRsZXQgcGFydFJlZmVyZW5jZSA9IHRoaXMuX3BhcnRSZWZlcmVuY2VNYXBbcGFydElkXTtcblx0XHRcdGlmIChwYXJ0UmVmZXJlbmNlID09IG51bGwpIHtcblx0XHRcdFx0TG9nZ2VyLndhcm4oYFBhcnRSZWZlcmVuY2UgZmluZHMgbm8gbWFwIGZvciBwYXJ0SWQgJHtwYXJ0SWR9YClcblx0XHRcdH1cblx0XHRcdGxldCBwYXJ0TmFtZSA9IHBhcnRSZWZlcmVuY2UgPT0gbnVsbCA/IG51bGwgOiBwYXJ0UmVmZXJlbmNlWzBdO1xuXHRcdFx0bGV0IGxhYmVsID0gcGFydFJlZmVyZW5jZSA9PSBudWxsID8gbnVsbCA6IHBhcnRSZWZlcmVuY2VbMV07XG5cdFx0XHRsZXQgY2F0ZWdvcnkgPSBwYXJ0UmVmZXJlbmNlID09IG51bGwgPyBudWxsIDogcGFydFJlZmVyZW5jZVsyXTtcblxuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdID09IG51bGwpIHtcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0gPSB7fTtcblx0XHRcdH1cblx0XHRcdC8qIHVwZGF0ZSBwYXJ0IGNhdGVnb3J5ICovXG5cdFx0XHRyUGFydHNbcGFydElkXS5jYXRlZ29yeSA9IGNhdGVnb3J5O1xuXHRcdFx0LyogdXBkYXRlIHBhcnQgbmFtZSAqL1xuXHRcdFx0clBhcnRzW3BhcnRJZF0ubmFtZSA9IHBhcnROYW1lID09IG51bGwgPyBudWxsIDogcGFydE5hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdC8qIHVwZGF0ZSBwYXJ0IGxhYmVsICovXG5cdFx0XHRyUGFydHNbcGFydElkXS5sYWJlbCA9IGxhYmVsO1xuXG5cdFx0XHQvKiB1cGRhdGUgZXJyb3IgKi9cblx0XHRcdC8qKiB1cGRhdGUgZXJyb3JMaXN0ICoqL1xuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdCA9PSBudWxsKVxuXHRcdFx0XHRyUGFydHNbcGFydElkXS5lcnJvckxpc3QgPSB7fTtcblxuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdFtjb2RlUmVmXSA9PSBudWxsKVxuXHRcdFx0XHRyUGFydHNbcGFydElkXS5lcnJvckxpc3RbY29kZVJlZl0gPSB7XG5cdFx0XHRcdFx0bXNnOiBtc2csXG5cdFx0XHRcdFx0Y3JpdExldmVsOiBjcml0TGV2ZWwsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IG51bGxcblx0XHRcdFx0fTtcblx0XHRcdGxldCBldnRzX3RtcCA9IHtcblx0XHRcdFx0dGltZTogdGhpcy5fY29kZXIuZnJvbSh0aW1lKSxcblx0XHRcdFx0Y29kZTogdGhpcy5fY29kZXIuZnJvbShjb2RlKSxcblx0XHRcdFx0Y29kZVJlZjogdGhpcy5fY29kZXIuZnJvbShjb2RlUmVmKVxuXHRcdFx0fTtcblx0XHRcdC8qKiBpZiByZWNlaXZlZCBsaXN0IG9mIGV2ZW50cyAqKi9cblx0XHRcdGlmIChBcnJheS5pc0FycmF5KGV2dHNfdG1wLmNvZGUpIHx8IEFycmF5LmlzQXJyYXkoZXZ0c190bXAudGltZSlcblx0XHRcdFx0fHwgQXJyYXkuaXNBcnJheShldnRzX3RtcC5jb2RlUmVmKSkge1xuXHRcdFx0XHRpZiAoZXZ0c190bXAuY29kZS5sZW5ndGggPT09IGV2dHNfdG1wLmNvZGVSZWYubGVuZ3RoXG5cdFx0XHRcdFx0JiYgZXZ0c190bXAuY29kZS5sZW5ndGggPT09IGV2dHNfdG1wLnRpbWUubGVuZ3RoKSB7XG5cdFx0XHRcdFx0LyoqIGJ1aWxkIGxpc3Qgb2YgZXZlbnRzICoqL1xuXHRcdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmV2dHMgPSBbXTtcblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGV2dHNfdG1wLmNvZGUubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmV2dHMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdHRpbWU6IGV2dHNfdG1wLnRpbWVbaV0sXG5cdFx0XHRcdFx0XHRcdGNvZGU6IGV2dHNfdG1wLmNvZGVbaV0sXG5cdFx0XHRcdFx0XHRcdGNvZGVSZWY6IGV2dHNfdG1wLmNvZGVSZWZbaV1cblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIExvZ2dlci5lcnJvcihcIlN0YXR1czpJbmNvbnNpc3RhbnQgbGVuZ3RocyBvZiBidWZmZXJzICh0aW1lL2NvZGUvY29kZVJlZilcIik7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHsgLyoqIGp1c3QgaW4gY2FzZSwgdG8gcHJvdmlkZSBiYWNrd2FyZCBjb21wYXRpYmlsaXR5ICoqL1xuXHRcdFx0XHQvKiogc2V0IHJlY2VpdmVkIGV2ZW50ICoqL1xuXHRcdFx0XHRyUGFydHNbcGFydElkXS5ldnRzID0gW3tcblx0XHRcdFx0XHR0aW1lOiBldnRzX3RtcC50aW1lLFxuXHRcdFx0XHRcdGNvZGU6IGV2dHNfdG1wLmNvZGUsXG5cdFx0XHRcdFx0Y29kZVJlZjogZXZ0c190bXAuY29kZVJlZlxuXHRcdFx0XHR9XTtcblx0XHRcdH1cblx0XHR9KVxuXHR9O1xuXG5cdC8qKiBjcmVhdGUgU3RhdHVzIHNlcnZpY2UgKiovXG5cdERpeWFTZWxlY3Rvci5wcm90b3R5cGUuU3RhdHVzID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gbmV3IFN0YXR1cyh0aGlzKTtcblx0fTtcblxuXHQvKipcblx0ICogU2V0IG9uIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGZpbmQgc3RhdHVzIHRvIG1vZGlmeVxuXHQgKiBAcGFyYW0gcGFydE5hbWUgXHR0byBmaW5kIHN0YXR1cyB0byBtb2RpZnlcblx0ICogQHBhcmFtIGNvZGVcdFx0bmV3Q29kZVxuXHQgKiBAcGFyYW0gc291cmNlXHRcdHNvdXJjZVxuXHQgKiBAcGFyYW0gY2FsbGJhY2tcdFx0cmV0dXJuIGNhbGxiYWNrICg8Ym9vbD5zdWNjZXNzKVxuXHQgKi9cblx0RGl5YVNlbGVjdG9yLnByb3RvdHlwZS5zZXRTdGF0dXMgPSBmdW5jdGlvbiAocm9ib3ROYW1lLCBwYXJ0TmFtZSwgY29kZSwgc291cmNlLCBjYWxsYmFjaykge1xuXHRcdHJldHVybiBQcm9taXNlLnRyeShfID0+IHtcblx0XHRcdHZhciBvYmplY3RQYXRoID0gXCIvZnIvcGFydG5lcmluZy9TdGF0dXMvUm9ib3RzL1wiICsgdGhpcy5zcGxpdEFuZENhbWVsQ2FzZShyb2JvdE5hbWUsIFwiLVwiKSArIFwiL1BhcnRzL1wiICsgcGFydE5hbWU7XG5cdFx0XHR0aGlzLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiBcInN0YXR1c1wiLFxuXHRcdFx0XHRmdW5jOiBcIlNldFBhcnRcIixcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCcsXG5cdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0Ly9yb2JvdE5hbWU6IHJvYm90TmFtZSxcblx0XHRcdFx0XHRjb2RlOiBjb2RlLFxuXHRcdFx0XHRcdC8vcGFydE5hbWU6IHBhcnROYW1lLFxuXHRcdFx0XHRcdHNvdXJjZTogc291cmNlIHwgMVxuXHRcdFx0XHR9XG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soZmFsc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKHRydWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KS5jYXRjaChlcnIgPT4ge1xuXHRcdFx0TG9nZ2VyLmVycm9yKGVycilcblx0XHR9KVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQgb25lIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGdldCBzdGF0dXNcblx0ICogQHBhcmFtIHBhcnROYW1lIFx0dG8gZ2V0IHN0YXR1c1xuXHQgKiBAcGFyYW0gY2FsbGJhY2tcdFx0cmV0dXJuIGNhbGxiYWNrKC0xIGlmIG5vdCBmb3VuZC9kYXRhIG90aGVyd2lzZSlcblx0ICogQHBhcmFtIF9mdWxsIFx0bW9yZSBkYXRhIGFib3V0IHN0YXR1c1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5nZXRTdGF0dXMgPSBmdW5jdGlvbiAocm9ib3ROYW1lLCBwYXJ0TmFtZSwgY2FsbGJhY2svKiwgX2Z1bGwqLykge1xuXHRcdGxldCBzZW5kRGF0YSA9IFtdXG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KF8gPT4ge1xuXHRcdFx0bGV0IHJlcSA9IHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdvcmcuZnJlZWRlc2t0b3AuREJ1cy5PYmplY3RNYW5hZ2VyJyxcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBvYmpEYXRhKSA9PiB7XG5cblx0XHRcdFx0bGV0IG9iamVjdFBhdGhSb2JvdCA9IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9cIiArIHRoaXMuc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIik7XG5cdFx0XHRcdGxldCBvYmplY3RQYXRoUGFydCA9IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9cIiArIHRoaXMuc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIikgKyBcIi9QYXJ0cy9cIiArIHBhcnROYW1lO1xuXHRcdFx0XHRsZXQgcm9ib3RJZCA9IG9iakRhdGFbb2JqZWN0UGF0aFJvYm90XVsnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXS5Sb2JvdElkXG5cdFx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdFx0XHRmdW5jOiBcIkdldFBhcnRcIixcblx0XHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnLFxuXHRcdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFBhcnRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdHNlbmREYXRhLnB1c2goZGF0YSlcblx0XHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soLTEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKHRoaXMucm9ib3RNb2RlbCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0fSkuY2F0Y2goZXJyID0+IHtcblx0XHRcdExvZ2dlci5lcnJvcihlcnIpXG5cdFx0fSlcblx0fTtcblxuXHRTdGF0dXMucHJvdG90eXBlLnNwbGl0QW5kQ2FtZWxDYXNlID0gZnVuY3Rpb24gKGluU3RyaW5nLCBkZWxpbWl0ZXIpIHtcblx0XHRsZXQgYXJyYXlTcGxpdFN0cmluZyA9IGluU3RyaW5nLnNwbGl0KGRlbGltaXRlcik7XG5cdFx0bGV0IG91dENhbWVsU3RyaW5nID0gJyc7XG5cdFx0YXJyYXlTcGxpdFN0cmluZy5mb3JFYWNoKHN0ciA9PiB7XG5cdFx0XHRvdXRDYW1lbFN0cmluZyArPSBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc3Vic3RyaW5nKDEpO1xuXHRcdH0pXG5cdFx0cmV0dXJuIG91dENhbWVsU3RyaW5nO1xuXHR9XG5cbn0pKClcbiJdfQ==
