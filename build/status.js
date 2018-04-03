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

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

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

	var DEBUG = false;
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
			if (err != null) {
				Logger.error("Multiday status subscription: error", err);
				return;
			}
			if (!Array.isArray(data)) {
				Logger.warn("Multiday status subscription: malformed data", data);
				return;
			}
			var robotToStatusMap = _this._unpackRobotModels(data[0]);
			Logger.debug('Multiday status subscription data after unpacking:', robotToStatusMap);
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = robotToStatusMap.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var _step$value = _slicedToArray(_step.value, 2),
					    key = _step$value[0],
					    value = _step$value[1];

					var robotIds = key.split(':');
					var robotId = robotIds[0];
					var robotName = robotIds[1];
					_this._getRobotModelFromRecv2(value, robotId, robotName); // update this.robotModel
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			Logger.debug('RobotModel after unpacking:', _this.robotModel);
			if (typeof callback === 'function') {
				callback(_this.robotModel);
			}
		});
		this.subscriptions.push(subs);

		Logger.debug('Triggering MultidayStatusUpdate for robots', robotNames);
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
				Logger.warn('Multiday status trigger: error', err);
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
					Logger.debug('PartReferenceMap response', data, err);
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
					Logger.debug('StatusEvtReferenceMap response', data, err);
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

		parts.forEach(function (part) {
			if (part.objectPath == null) {
				Logger.warn('Subscribe to StatusChanged: input error', part);
				return;
			}
			Logger.debug('Subscribing to ' + part.objectPath);
			var subs = _this4.selector.subscribe({
				service: 'status',
				func: 'StatusChanged',
				obj: {
					interface: 'fr.partnering.Status.Part',
					path: part.objectPath
				}
			}, function (peerId, err, data) {
				if (err != null) {
					Logger.error("StatusSubscribe:" + err);
					return;
				}
				Logger.debug('Part\'s StatusChanged is called, data:', data);
				if (data[9] == null) data[9] = ''; // empty description
				// Update robotModel variable
				// Since data is one-dimensional array, make it two-dimensional
				_this4._getRobotModelFromRecv2([data], part.RobotId, part.RobotName);
				if (typeof callback === 'function') {
					callback(_this4.robotModel);
				}
			});
			_this4.subscriptions.push(subs);
		});
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
			for (var objectPath in ret) {
				// the object obtained from the object path
				var object = ret[objectPath];

				// if the return object is of a robot in the list of neighbors, or of the diya-server, retrieve all ofits relevant statuses
				if (object.hasOwnProperty(robotIface)) {
					// this is robot object
					robots.push(object[robotIface]);
				}

				// if the return object is of a part, listen to signal StatusChanged of the part
				if (object.hasOwnProperty(partIface)) {
					// this is a part object
					var part = object[partIface];
					part.objectPath = objectPath;
					part.RobotName = objectPath.split('/')[5]; /* /fr/partnering/Status/Robots/B1R00037/Parts/voct */
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

			Logger.debug('meshed robots to be displayed', robots);
			Logger.debug('meshed parts to be subscribed to', parts);
		}).then(function (_) {
			return _this5._subscribeToMultidayStatusUpdate(robots, callback);
		}) // Retrieve initial statuses from the filtered robots
		.then(function (_) {
			return _this5._subscribeToStatusChanged(parts, callback);
		}); // Listen to StatusChange from the parts belonging to the filtered robots
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
  * @return {object} extracted data in form of map of 'robotId:robotName' to array of [PartId, Category, PartName, Label, Time, Code, CodeRef, Msg, CritLevel, Description]
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
		var robotToStatusMap = new Map();

		var _loop = function _loop(robot) {
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
					var status = [partId, category, partName, label, time, code, codeRef, msg, critLevel, ''];
					if (!robotToStatusMap.has(robot)) {
						robotToStatusMap.set(robot, []);
					}
					robotToStatusMap.get(robot).push(status);
				});
			};

			// i.e. 4:D1R00035
			for (var partId in data[robot]) {
				var _ret2 = _loop2(partId);

				if (_ret2 === 'continue') continue;
			}
		};

		for (var robot in data) {
			_loop(robot);
		}
		return robotToStatusMap;
	};

	/**
  * Update internal robot model with received data (version 2)
  * @param  {Object} data - two dimensional array received from DiyaNode by websocket
  * @param {int} robotId
  * @param {string} robotName
  */
	Status.prototype._getRobotModelFromRecv2 = function (data, robotId, robotName) {
		var _this8 = this;

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
				} else Logger.error("Status:Inconsistant lengths of buffers (time/code/codeRef)");
			} else {
				/** just in case, to provide backward compatibility **/
				/** set received events **/
				if (rParts[partId].evts == null) {
					rParts[partId].evts = [];
				}
				rParts[partId].evts.push({
					time: evts_tmp.time,
					code: evts_tmp.code,
					codeRef: evts_tmp.codeRef
				});
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwic3JjL3N0YXR1cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7OztBQzFrQkE7O0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JBOzs7Ozs7Ozs7Ozs7QUFZQSxDQUFDLFlBQVU7O0FBRVYsS0FBSSxZQUFZLEVBQUUsT0FBTyxNQUFQLEtBQWtCLFdBQXBCLENBQWhCO0FBQ0EsS0FBRyxDQUFDLFNBQUosRUFBZTtBQUFFLE1BQUksVUFB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QUksbUJBQW1CLFNBQVMsS0FBVCxDQUFlLFNBQWYsQ0FBdkI7QUFDQSxNQUFJLGlCQUFpQixFQUFyQjtBQUNBLG1CQUFpQixPQUFqQixDQUF5QixlQUFPO0FBQy9CLHFCQUFrQixJQUFJLE1BQUosQ0FBVyxDQUFYLEVBQWMsV0FBZCxLQUE4QixJQUFJLFNBQUosQ0FBYyxDQUFkLENBQWhEO0FBQ0EsR0FGRDtBQUdBLFNBQU8sY0FBUDtBQUNBLEVBUEQ7QUFTQSxDQWp5QkQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfXJldHVybiBlfSkoKSIsIiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCJpbXBvcnQgeyBTdGF0cyB9IGZyb20gJ2ZzJztcblxuLypcbiAqIENvcHlyaWdodCA6IFBhcnRuZXJpbmcgMy4wICgyMDA3LTIwMTYpXG4gKiBBdXRob3IgOiBTeWx2YWluIE1haMOpIDxzeWx2YWluLm1haGVAcGFydG5lcmluZy5mcj5cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBkaXlhLXNkay5cbiAqXG4gKiBkaXlhLXNkayBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBkaXlhLXNkayBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCBkaXlhLXNkay4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG5cblxuXG5cbi8qIG1heWEtY2xpZW50XG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQsIFBhcnRuZXJpbmcgUm9ib3RpY3MsIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBUaGlzIGxpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yXG4gKiBtb2RpZnkgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieSB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyB2ZXJzaW9uXG4gKlx0My4wIG9mIHRoZSBMaWNlbnNlLiBUaGlzIGxpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGVcbiAqIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuXG4gKiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSXG4gKiBQVVJQT1NFLiBTZWUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuICogTGljZW5zZSBhbG9uZyB3aXRoIHRoaXMgbGlicmFyeS5cbiAqL1xuKGZ1bmN0aW9uKCl7XG5cblx0dmFyIGlzQnJvd3NlciA9ICEodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpO1xuXHRpZighaXNCcm93c2VyKSB7IHZhciBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTsgfVxuXHRlbHNlIHsgdmFyIFByb21pc2UgPSB3aW5kb3cuUHJvbWlzZTsgfVxuXHR2YXIgRGl5YVNlbGVjdG9yID0gZDEuRGl5YVNlbGVjdG9yO1xuXHR2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8gTG9nZ2luZyB1dGlsaXR5IG1ldGhvZHMgLy8vLy8vLy8vLy8vLy8vLy8vXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblx0dmFyIERFQlVHID0gZmFsc2U7XG5cdHZhciBMb2dnZXIgPSB7XG5cdFx0bG9nOiBmdW5jdGlvbihtZXNzYWdlKXtcblx0XHRcdGlmKERFQlVHKSBjb25zb2xlLmxvZyhtZXNzYWdlKTtcblx0XHR9LFxuXG5cdFx0ZGVidWc6IGZ1bmN0aW9uKG1lc3NhZ2UsIC4uLmFyZ3Mpe1xuXHRcdFx0aWYoREVCVUcpIGNvbnNvbGUubG9nKG1lc3NhZ2UsIC4uLmFyZ3MpO1xuXHRcdH0sXG5cblx0XHR3YXJuOiBmdW5jdGlvbihtZXNzYWdlKXtcblx0XHRcdGlmKERFQlVHKSBjb25zb2xlLndhcm4obWVzc2FnZSk7XG5cdFx0fSxcblxuXHRcdGVycm9yOiBmdW5jdGlvbihtZXNzYWdlKXtcblx0XHRcdGlmKERFQlVHKSBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICpcdGNhbGxiYWNrIDogZnVuY3Rpb24gY2FsbGVkIGFmdGVyIG1vZGVsIHVwZGF0ZWRcblx0ICogKi9cblx0ZnVuY3Rpb24gU3RhdHVzKHNlbGVjdG9yKXtcblx0XHR0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3I7XG5cdFx0dGhpcy5fY29kZXIgPSBzZWxlY3Rvci5lbmNvZGUoKTtcblx0XHR0aGlzLnN1YnNjcmlwdGlvbnMgPSBbXTtcblxuXHRcdC8qKiBtb2RlbCBvZiByb2JvdCA6IGF2YWlsYWJsZSBwYXJ0cyBhbmQgc3RhdHVzICoqL1xuXHRcdHRoaXMucm9ib3RNb2RlbCA9IFtdO1xuXHRcdHRoaXMuX3JvYm90TW9kZWxJbml0ID0gZmFsc2U7XG5cdFx0dGhpcy5fcGFydFJlZmVyZW5jZU1hcCA9IFtdO1xuXG5cdFx0LyoqKiBzdHJ1Y3R1cmUgb2YgZGF0YSBjb25maWcgKioqXG5cdFx0XHQgY3JpdGVyaWEgOlxuXHRcdFx0ICAgdGltZTogYWxsIDMgdGltZSBjcml0ZXJpYSBzaG91bGQgbm90IGJlIGRlZmluZWQgYXQgdGhlIHNhbWUgdGltZS4gKHJhbmdlIHdvdWxkIGJlIGdpdmVuIHVwKVxuXHRcdFx0ICAgICBiZWc6IHtbbnVsbF0sdGltZX0gKG51bGwgbWVhbnMgbW9zdCByZWNlbnQpIC8vIHN0b3JlZCBhIFVUQyBpbiBtcyAobnVtKVxuXHRcdFx0ICAgICBlbmQ6IHtbbnVsbF0sIHRpbWV9IChudWxsIG1lYW5zIG1vc3Qgb2xkZXN0KSAvLyBzdG9yZWQgYXMgVVRDIGluIG1zIChudW0pXG5cdFx0XHQgICAgIHJhbmdlOiB7W251bGxdLCB0aW1lfSAocmFuZ2Ugb2YgdGltZShwb3NpdGl2ZSkgKSAvLyBpbiBzIChudW0pXG5cdFx0XHQgICByb2JvdDoge0FycmF5T2YgSUQgb3IgW1wiYWxsXCJdfVxuXHRcdFx0ICAgcGxhY2U6IHtBcnJheU9mIElEIG9yIFtcImFsbFwiXX1cblx0XHRcdCBvcGVyYXRvcjoge1tsYXN0XSwgbWF4LCBtb3ksIHNkfSAtKCBtYXliZSBtb3kgc2hvdWxkIGJlIGRlZmF1bHRcblx0XHRcdCAuLi5cblxuXHRcdFx0IHBhcnRzIDoge1tudWxsXSBvciBBcnJheU9mIFBhcnRzSWR9IHRvIGdldCBlcnJvcnNcblx0XHRcdCBzdGF0dXMgOiB7W251bGxdIG9yIEFycmF5T2YgU3RhdHVzTmFtZX0gdG8gZ2V0IHN0YXR1c1xuXG5cdFx0XHQgc2FtcGxpbmc6IHtbbnVsbF0gb3IgaW50fVxuXHRcdCovXG5cdFx0dGhpcy5kYXRhQ29uZmlnID0ge1xuXHRcdFx0Y3JpdGVyaWE6IHtcblx0XHRcdFx0dGltZToge1xuXHRcdFx0XHRcdGJlZzogbnVsbCxcblx0XHRcdFx0XHRlbmQ6IG51bGwsXG5cdFx0XHRcdFx0cmFuZ2U6IG51bGwgLy8gaW4gc1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRyb2JvdDogbnVsbFxuXHRcdFx0fSxcblx0XHRcdG9wZXJhdG9yOiAnbGFzdCcsXG5cdFx0XHRwYXJ0czogbnVsbCxcblx0XHRcdHN0YXR1czogbnVsbFxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblx0LyoqXG5cdCAqIEdldCByb2JvdE1vZGVsIDpcblx0ICoge1xuXHQgKiAgcGFydHM6IHtcblx0ICpcdFx0XCJwYXJ0WFhcIjoge1xuXHQgKiBcdFx0XHQgZXJyb3JzRGVzY3I6IHsgZW5jb3VudGVyZWQgZXJyb3JzIGluZGV4ZWQgYnkgZXJyb3JJZHM+MCB9XG5cdCAqXHRcdFx0XHQ+IENvbmZpZyBvZiBlcnJvcnMgOlxuXHQgKlx0XHRcdFx0XHRjcml0TGV2ZWw6IEZMT0FULCAvLyBjb3VsZCBiZSBpbnQuLi5cblx0ICogXHRcdFx0XHRcdG1zZzogU1RSSU5HLFxuXHQgKlx0XHRcdFx0XHRzdG9wU2VydmljZUlkOiBTVFJJTkcsXG5cdCAqXHRcdFx0XHRcdHJ1blNjcmlwdDogU2VxdWVsaXplLlNUUklORyxcblx0ICpcdFx0XHRcdFx0bWlzc2lvbk1hc2s6IFNlcXVlbGl6ZS5JTlRFR0VSLFxuXHQgKlx0XHRcdFx0XHRydW5MZXZlbDogU2VxdWVsaXplLklOVEVHRVJcblx0ICpcdFx0XHRlcnJvcjpbRkxPQVQsIC4uLl0sIC8vIGNvdWxkIGJlIGludC4uLlxuXHQgKlx0XHRcdHRpbWU6W0ZMT0FULCAuLi5dLFxuXHQgKlx0XHRcdHJvYm90OltGTE9BVCwgLi4uXSxcblx0ICpcdFx0XHQvLy8gcGxhY2U6W0ZMT0FULCAuLi5dLCBub3QgaW1wbGVtZW50ZWQgeWV0XG5cdCAqXHRcdH0sXG5cdCAqXHQgXHQuLi4gKFwiUGFydFlZXCIpXG5cdCAqICB9LFxuXHQgKiAgc3RhdHVzOiB7XG5cdCAqXHRcdFwic3RhdHVzWFhcIjoge1xuXHQgKlx0XHRcdFx0ZGF0YTpbRkxPQVQsIC4uLl0sIC8vIGNvdWxkIGJlIGludC4uLlxuXHQgKlx0XHRcdFx0dGltZTpbRkxPQVQsIC4uLl0sXG5cdCAqXHRcdFx0XHRyb2JvdDpbRkxPQVQsIC4uLl0sXG5cdCAqXHRcdFx0XHQvLy8gcGxhY2U6W0ZMT0FULCAuLi5dLCBub3QgaW1wbGVtZW50ZWQgeWV0XG5cdCAqXHRcdFx0XHRyYW5nZTogW0ZMT0FULCBGTE9BVF0sXG5cdCAqXHRcdFx0XHRsYWJlbDogc3RyaW5nXG5cdCAqXHRcdFx0fSxcblx0ICpcdCBcdC4uLiAoXCJTdGF0dXNZWVwiKVxuXHQgKiAgfVxuXHQgKiB9XG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmdldFJvYm90TW9kZWwgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLnJvYm90TW9kZWw7XG5cdH07XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhQ29uZmlnIGNvbmZpZyBmb3IgZGF0YSByZXF1ZXN0XG5cdCAqIGlmIGRhdGFDb25maWcgaXMgZGVmaW5lIDogc2V0IGFuZCByZXR1cm4gdGhpc1xuXHQgKlx0IEByZXR1cm4ge1N0YXR1c30gdGhpc1xuXHQgKiBlbHNlXG5cdCAqXHQgQHJldHVybiB7T2JqZWN0fSBjdXJyZW50IGRhdGFDb25maWdcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YUNvbmZpZyA9IGZ1bmN0aW9uKG5ld0RhdGFDb25maWcpe1xuXHRcdGlmKG5ld0RhdGFDb25maWcpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZz1uZXdEYXRhQ29uZmlnO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB0aGlzLmRhdGFDb25maWc7XG5cdH07XG5cdC8qKlxuXHQgKiBUTyBCRSBJTVBMRU1FTlRFRCA6IG9wZXJhdG9yIG1hbmFnZW1lbnQgaW4gRE4tU3RhdHVzXG5cdCAqIEBwYXJhbSAge1N0cmluZ31cdCBuZXdPcGVyYXRvciA6IHtbbGFzdF0sIG1heCwgbW95LCBzZH1cblx0ICogQHJldHVybiB7U3RhdHVzfSB0aGlzIC0gY2hhaW5hYmxlXG5cdCAqIFNldCBvcGVyYXRvciBjcml0ZXJpYS5cblx0ICogRGVwZW5kcyBvbiBuZXdPcGVyYXRvclxuXHQgKlx0QHBhcmFtIHtTdHJpbmd9IG5ld09wZXJhdG9yXG5cdCAqXHRAcmV0dXJuIHRoaXNcblx0ICogR2V0IG9wZXJhdG9yIGNyaXRlcmlhLlxuXHQgKlx0QHJldHVybiB7U3RyaW5nfSBvcGVyYXRvclxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5EYXRhT3BlcmF0b3IgPSBmdW5jdGlvbihuZXdPcGVyYXRvcil7XG5cdFx0aWYobmV3T3BlcmF0b3IpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5vcGVyYXRvciA9IG5ld09wZXJhdG9yO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB0aGlzLmRhdGFDb25maWcub3BlcmF0b3I7XG5cdH07XG5cdC8qKlxuXHQgKiBEZXBlbmRzIG9uIG51bVNhbXBsZXNcblx0ICogQHBhcmFtIHtpbnR9IG51bWJlciBvZiBzYW1wbGVzIGluIGRhdGFNb2RlbFxuXHQgKiBpZiBkZWZpbmVkIDogc2V0IG51bWJlciBvZiBzYW1wbGVzXG5cdCAqXHRAcmV0dXJuIHtTdGF0dXN9IHRoaXNcblx0ICogZWxzZVxuXHQgKlx0QHJldHVybiB7aW50fSBudW1iZXIgb2Ygc2FtcGxlc1xuXHQgKiovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YVNhbXBsaW5nID0gZnVuY3Rpb24obnVtU2FtcGxlcyl7XG5cdFx0aWYobnVtU2FtcGxlcykge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLnNhbXBsaW5nID0gbnVtU2FtcGxlcztcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gdGhpcy5kYXRhQ29uZmlnLnNhbXBsaW5nO1xuXHR9O1xuXHQvKipcblx0ICogU2V0IG9yIGdldCBkYXRhIHRpbWUgY3JpdGVyaWEgYmVnIGFuZCBlbmQuXG5cdCAqIElmIHBhcmFtIGRlZmluZWRcblx0ICpcdEBwYXJhbSB7RGF0ZX0gbmV3VGltZUJlZyAvLyBtYXkgYmUgbnVsbFxuXHQgKlx0QHBhcmFtIHtEYXRlfSBuZXdUaW1lRW5kIC8vIG1heSBiZSBudWxsXG5cdCAqXHRAcmV0dXJuIHtTdGF0dXN9IHRoaXNcblx0ICogSWYgbm8gcGFyYW0gZGVmaW5lZDpcblx0ICpcdEByZXR1cm4ge09iamVjdH0gVGltZSBvYmplY3Q6IGZpZWxkcyBiZWcgYW5kIGVuZC5cblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YVRpbWUgPSBmdW5jdGlvbihuZXdUaW1lQmVnLG5ld1RpbWVFbmQsIG5ld1JhbmdlKXtcblx0XHRpZihuZXdUaW1lQmVnIHx8IG5ld1RpbWVFbmQgfHwgbmV3UmFuZ2UpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS50aW1lLmJlZyA9IG5ld1RpbWVCZWcuZ2V0VGltZSgpO1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUuZW5kID0gbmV3VGltZUVuZC5nZXRUaW1lKCk7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5yYW5nZSA9IG5ld1JhbmdlO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGJlZzogbmV3IERhdGUodGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUuYmVnKSxcblx0XHRcdFx0ZW5kOiBuZXcgRGF0ZSh0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5lbmQpLFxuXHRcdFx0XHRyYW5nZTogbmV3IERhdGUodGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUucmFuZ2UpXG5cdFx0XHR9O1xuXHR9O1xuXHQvKipcblx0ICogRGVwZW5kcyBvbiByb2JvdElkc1xuXHQgKiBTZXQgcm9ib3QgY3JpdGVyaWEuXG5cdCAqXHRAcGFyYW0ge0FycmF5W0ludF19IHJvYm90SWRzIGxpc3Qgb2Ygcm9ib3QgSWRzXG5cdCAqIEdldCByb2JvdCBjcml0ZXJpYS5cblx0ICpcdEByZXR1cm4ge0FycmF5W0ludF19IGxpc3Qgb2Ygcm9ib3QgSWRzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFSb2JvdElkcyA9IGZ1bmN0aW9uKHJvYm90SWRzKXtcblx0XHRpZihyb2JvdElkcykge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnJvYm90ID0gcm9ib3RJZHM7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS5yb2JvdDtcblx0fTtcblx0LyoqXG5cdCAqIERlcGVuZHMgb24gcGxhY2VJZHMgLy8gbm90IHJlbGV2YW50Pywgbm90IGltcGxlbWVudGVkIHlldFxuXHQgKiBTZXQgcGxhY2UgY3JpdGVyaWEuXG5cdCAqXHRAcGFyYW0ge0FycmF5W0ludF19IHBsYWNlSWRzIGxpc3Qgb2YgcGxhY2UgSWRzXG5cdCAqIEdldCBwbGFjZSBjcml0ZXJpYS5cblx0ICpcdEByZXR1cm4ge0FycmF5W0ludF19IGxpc3Qgb2YgcGxhY2UgSWRzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFQbGFjZUlkcyA9IGZ1bmN0aW9uKHBsYWNlSWRzKXtcblx0XHRpZihwbGFjZUlkcykge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnBsYWNlSWQgPSBwbGFjZUlkcztcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gdGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnBsYWNlO1xuXHR9O1xuXHQvKipcblx0ICogR2V0IGRhdGEgYnkgc2Vuc29yIG5hbWUuXG5cdCAqXHRAcGFyYW0ge0FycmF5W1N0cmluZ119IHNlbnNvck5hbWUgbGlzdCBvZiBzZW5zb3JzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmdldERhdGFCeU5hbWUgPSBmdW5jdGlvbihzZW5zb3JOYW1lcyl7XG5cdFx0dmFyIGRhdGE9W107XG5cdFx0Zm9yKHZhciBuIGluIHNlbnNvck5hbWVzKSB7XG5cdFx0XHRkYXRhLnB1c2godGhpcy5kYXRhTW9kZWxbc2Vuc29yTmFtZXNbbl1dKTtcblx0XHR9XG5cdFx0cmV0dXJuIGRhdGE7XG5cdH07XG5cblx0U3RhdHVzLnByb3RvdHlwZS5fc3Vic2NyaWJlVG9NdWx0aWRheVN0YXR1c1VwZGF0ZSA9IGZ1bmN0aW9uIChyb2JvdF9vYmplY3RzLCBjYWxsYmFjaykge1xuXHRcdExvZ2dlci5kZWJ1ZyhgU3Vic2NyaWJlIHRvIE11bHRpZGF5U3RhdHVzVXBkYXRlYClcblx0XHRsZXQgc3VicyA9IHRoaXMuc2VsZWN0b3Iuc3Vic2NyaWJlKHtcblx0XHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0XHRcdGZ1bmM6ICdNdWx0aWRheVN0YXR1c1VwZGF0ZWQnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cycsXG5cdFx0XHRcdFx0cGF0aDogXCIvZnIvcGFydG5lcmluZy9TdGF0dXNcIlxuXHRcdFx0XHR9XG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiTXVsdGlkYXkgc3RhdHVzIHN1YnNjcmlwdGlvbjogZXJyb3JcIiwgZXJyKVxuXHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghQXJyYXkuaXNBcnJheShkYXRhKSkge1xuXHRcdFx0XHRcdExvZ2dlci53YXJuKFwiTXVsdGlkYXkgc3RhdHVzIHN1YnNjcmlwdGlvbjogbWFsZm9ybWVkIGRhdGFcIiwgZGF0YSlcblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0fVxuXHRcdFx0XHRsZXQgcm9ib3RUb1N0YXR1c01hcCA9IHRoaXMuX3VucGFja1JvYm90TW9kZWxzKGRhdGFbMF0pXG5cdFx0XHRcdExvZ2dlci5kZWJ1ZyhgTXVsdGlkYXkgc3RhdHVzIHN1YnNjcmlwdGlvbiBkYXRhIGFmdGVyIHVucGFja2luZzpgLCByb2JvdFRvU3RhdHVzTWFwKVxuXHRcdFx0XHRmb3IgKHZhciBba2V5LCB2YWx1ZV0gb2Ygcm9ib3RUb1N0YXR1c01hcC5lbnRyaWVzKCkpIHtcblx0XHRcdFx0XHRsZXQgcm9ib3RJZHMgPSBrZXkuc3BsaXQoJzonKVxuXHRcdFx0XHRcdGxldCByb2JvdElkID0gcm9ib3RJZHNbMF1cblx0XHRcdFx0XHRsZXQgcm9ib3ROYW1lID0gcm9ib3RJZHNbMV1cblx0XHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHZhbHVlLCByb2JvdElkLCByb2JvdE5hbWUpIC8vIHVwZGF0ZSB0aGlzLnJvYm90TW9kZWxcblx0XHRcdFx0ICB9XG5cdFx0XHRcdExvZ2dlci5kZWJ1ZyhgUm9ib3RNb2RlbCBhZnRlciB1bnBhY2tpbmc6YCwgdGhpcy5yb2JvdE1vZGVsKVxuXHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2sodGhpcy5yb2JvdE1vZGVsKTtcblx0XHRcdFx0fVxuXHRcdH0pXG5cdFx0dGhpcy5zdWJzY3JpcHRpb25zLnB1c2goc3VicylcblxuXHRcdExvZ2dlci5kZWJ1ZyhgVHJpZ2dlcmluZyBNdWx0aWRheVN0YXR1c1VwZGF0ZSBmb3Igcm9ib3RzYCwgcm9ib3ROYW1lcylcblx0XHRsZXQgcm9ib3ROYW1lcyA9IHJvYm90X29iamVjdHMubWFwKHJvYm90ID0+IHJvYm90LlJvYm90TmFtZSlcblx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiBcInN0YXR1c1wiLFxuXHRcdFx0XHRmdW5jOiBcIlRyaWdnZXJNdWx0aWRheVN0YXR1c2VzXCIsXG5cdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzJyxcblx0XHRcdFx0XHRwYXRoOiBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1c1wiXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRyb2JvdF9uYW1lczogcm9ib3ROYW1lc1xuXHRcdFx0XHR9XG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0Ly8gRG8gbm90aGluZyBzaW5jZSB0aGUgc2VydmVyIHNob3VsZCByZXBvbnNlIGJhY2sgdmlhIHNpZ25hbHNcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0TG9nZ2VyLndhcm4oYE11bHRpZGF5IHN0YXR1cyB0cmlnZ2VyOiBlcnJvcmAsIGVycilcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjaygtMSk7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGVycilcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgJ1BhcnRzJyByZWZlcmVuY2UgbWFwIHRvIHJlZHVjZSBzdGF0dXMgcGF5bG9hZC4gRHVwbGljYXRlZCBjb250ZW50cyBpbiBzdGF0dXMgYXJlIHN0b3JlZCBpbiB0aGUgbWFwLlxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5fZ2V0UGFydFJlZmVyZW5jZU1hcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAodGhpcy5fcGFydFJlZmVyZW5jZU1hcCA9PSBudWxsIHx8IHRoaXMuX3BhcnRSZWZlcmVuY2VNYXAubGVuZ3RoID09IDApIHtcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdFx0c2VydmljZTogJ1N0YXR1cycsXG5cdFx0XHRcdFx0ZnVuYzogJ0dldFBhcnRSZWZlcmVuY2VNYXAnLFxuXHRcdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMnLFxuXHRcdFx0XHRcdFx0cGF0aDogJy9mci9wYXJ0bmVyaW5nL1N0YXR1cydcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdExvZ2dlci5kZWJ1ZyhgUGFydFJlZmVyZW5jZU1hcCByZXNwb25zZWAsIGRhdGEsIGVycilcblx0XHRcdFx0XHRpZiAoZGF0YSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRkYXRhID0gW11cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy5fcGFydFJlZmVyZW5jZU1hcCA9IGRhdGFcblx0XHRcdFx0XHRyZXNvbHZlKCkgLy8gcmV0dXJucyBhIG1hcCBvZiBwYXJ0aWQgdG8gaXRzIHByb3BlcnRpZXNcblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0fVxuXHRcdExvZ2dlci5kZWJ1ZygnUGFydFJlZmVyZW5jZU1hcCBhbHJlYWR5IGV4aXN0cywgbm8gbmVlZCB0byByZXF1ZXN0LiBOdW1iZXIgb2YgcGFydHM6JywgdGhpcy5fcGFydFJlZmVyZW5jZU1hcC5sZW5ndGgpXG5cdH07XG5cblx0LyoqXG5cdCAqIEdldCAnU3RhdHVzRXZ0cycgcmVmZXJlbmNlIG1hcCB0byByZWR1Y2Ugc3RhdHVzIHBheWxvYWQuIER1cGxpY2F0ZWQgY29udGVudHMgaW4gc3RhdHVzIGFyZSBzdG9yZWQgaW4gdGhlIG1hcC5cblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuX2dldFN0YXR1c0V2dFJlZmVyZW5jZU1hcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAodGhpcy5fc3RhdHVzRXZ0UmVmZXJlbmNlTWFwID09IG51bGwgfHwgdGhpcy5fc3RhdHVzRXZ0UmVmZXJlbmNlTWFwLmxlbmd0aCA9PSAwKSB7XG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRcdHNlcnZpY2U6ICdTdGF0dXMnLFxuXHRcdFx0XHRcdGZ1bmM6ICdHZXRTdGF0dXNFdnRSZWZlcmVuY2VNYXAnLFxuXHRcdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMnLFxuXHRcdFx0XHRcdFx0cGF0aDogJy9mci9wYXJ0bmVyaW5nL1N0YXR1cydcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdExvZ2dlci5kZWJ1ZyhgU3RhdHVzRXZ0UmVmZXJlbmNlTWFwIHJlc3BvbnNlYCwgZGF0YSwgZXJyKVxuXHRcdFx0XHRcdGlmIChkYXRhID09IG51bGwpIHtcblx0XHRcdFx0XHRcdGRhdGEgPSBbXVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLl9zdGF0dXNFdnRSZWZlcmVuY2VNYXAgPSBkYXRhXG5cdFx0XHRcdFx0cmVzb2x2ZSgpIC8vIHJldHVybnMgYSBtYXAgb2YgcGFydGlkIHRvIGl0cyBwcm9wZXJ0aWVzXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdH1cblx0XHRMb2dnZXIuZGVidWcoJ1N0YXR1c0V2dFJlZmVyZW5jZU1hcCBhbHJlYWR5IGV4aXN0cywgbm8gbmVlZCB0byByZXF1ZXN0LiBOdW1iZXIgb2YgcGFydHM6JywgdGhpcy5fc3RhdHVzRXZ0UmVmZXJlbmNlTWFwLmxlbmd0aClcblx0fTtcblxuXHQvKipcblx0ICogU3Vic2NyaWJlcyB0byBzdGF0dXMgY2hhbmdlcyBmb3IgYWxsIHBhcnRzXG5cdCAqIEBwYXJhbSB7Kn0gcGFydHMgXG5cdCAqIEBwYXJhbSB7Kn0gY2FsbGJhY2sgXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLl9zdWJzY3JpYmVUb1N0YXR1c0NoYW5nZWQgPSBmdW5jdGlvbiAocGFydHMsIGNhbGxiYWNrKSB7XG5cdFx0aWYgKHBhcnRzID09IG51bGwpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdHBhcnRzLmZvckVhY2gocGFydCA9PiB7XG5cdFx0XHRpZiAocGFydC5vYmplY3RQYXRoID09IG51bGwpIHtcblx0XHRcdFx0TG9nZ2VyLndhcm4oJ1N1YnNjcmliZSB0byBTdGF0dXNDaGFuZ2VkOiBpbnB1dCBlcnJvcicsIHBhcnQpXG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXHRcdFx0TG9nZ2VyLmRlYnVnKGBTdWJzY3JpYmluZyB0byAke3BhcnQub2JqZWN0UGF0aH1gKVxuXHRcdFx0bGV0IHN1YnMgPSB0aGlzLnNlbGVjdG9yLnN1YnNjcmliZSh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnU3RhdHVzQ2hhbmdlZCcsXG5cdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnLFxuXHRcdFx0XHRcdHBhdGg6IHBhcnQub2JqZWN0UGF0aFxuXHRcdFx0XHR9XG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiU3RhdHVzU3Vic2NyaWJlOlwiICsgZXJyKVxuXHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHR9XG5cdFx0XHRcdExvZ2dlci5kZWJ1ZyhgUGFydCdzIFN0YXR1c0NoYW5nZWQgaXMgY2FsbGVkLCBkYXRhOmAsIGRhdGEpXG5cdFx0XHRcdGlmIChkYXRhWzldID09IG51bGwpIGRhdGFbOV0gPSAnJyAvLyBlbXB0eSBkZXNjcmlwdGlvblxuXHRcdFx0XHQvLyBVcGRhdGUgcm9ib3RNb2RlbCB2YXJpYWJsZVxuXHRcdFx0XHQvLyBTaW5jZSBkYXRhIGlzIG9uZS1kaW1lbnNpb25hbCBhcnJheSwgbWFrZSBpdCB0d28tZGltZW5zaW9uYWxcblx0XHRcdFx0dGhpcy5fZ2V0Um9ib3RNb2RlbEZyb21SZWN2MihbZGF0YV0sIHBhcnQuUm9ib3RJZCwgcGFydC5Sb2JvdE5hbWUpO1xuXHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2sodGhpcy5yb2JvdE1vZGVsKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdHRoaXMuc3Vic2NyaXB0aW9ucy5wdXNoKHN1YnMpO1xuXHRcdH0pXG5cdH1cblxuXHQvKipcblx0ICogUXVlcnkgZm9yIGluaXRpYWwgc3RhdHVzZXNcblx0ICogU3Vic2NyaWJlIHRvIGVycm9yL3N0YXR1cyB1cGRhdGVzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLndhdGNoID0gZnVuY3Rpb24gKHJvYm90TmFtZXMsIGNhbGxiYWNrKSB7XG5cdFx0TG9nZ2VyLmRlYnVnKGBTdGF0dXMud2F0Y2g6IHJvYm90TmFtZXNgLCByb2JvdE5hbWVzKVxuXG5cdFx0dGhpcy5zZWxlY3Rvci5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cdFx0dGhpcy5zZWxlY3Rvci5fY29ubmVjdGlvbi5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cblx0XHQvLyBQcm9taXNlIHRvIHJldHJpZXZlIGxpc3Qgb2YgcGFpcmVkIG5laWdoYm9ycywgaS5lLiBhbGwgbmVpZ2hib3Igcm9ib3RzIGluIHRoZSBzYW1lIG1lc2ggbmV0d29ya1xuXHRcdGxldCBnZXROZWlnaGJvcnMgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnTWVzaE5ldHdvcmsnLFxuXHRcdFx0XHRmdW5jOiAnTGlzdE5laWdoYm9ycycsXG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIG5laWdoYm9ycykgPT4ge1xuXHRcdFx0XHRMb2dnZXIuZGVidWcoYG5laWdoYm9ycywgZXJyYCwgbmVpZ2hib3JzLCBlcnIpXG5cdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdHJlamVjdChlcnIpXG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gVGhpcyBvbmx5IHJldHVybnMgdGhlIGxpc3Qgb2YgcGh5c2ljYWwgZGV2aWNlcyBwYWlyZWQgaW50byB0aGUgbWVzaCBuZXR3b3JrLCB0aGUgZGl5YS1zZXJ2ZXIgaW5zdGFuY2UgaXMgbm90IGFscmVhZHkgaW5jbHVkZWQgaW4gdGhlIGxpc3Rcblx0XHRcdFx0aWYgKG5laWdoYm9ycyA9PSBudWxsKSB7XG5cdFx0XHRcdFx0bmVpZ2hib3JzID0gW11cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXNvbHZlKG5laWdoYm9ycykgLy8gcmV0dXJucyBhIGFycmF5IG9mIG5laWdoYm9yIG9iamVjdCwgZWFjaCBvYmplY3QgaXMgYW4gYXJyYXkgb2YgW3JvYm90LW5hbWUsIGFkZHJlc3MsIGJvb2xdXG5cdFx0XHR9KVxuXHRcdH0pXG5cblx0XHQvLyBQcm9taXNlIHRvIHJldHJpZXZlIGFsbCBvYmplY3RzIChyb2JvdHMsIHBhcnRzKSBleHBvc2VkIGluIERCdXMgYnkgZGl5YS1ub2RlLXN0YXR1c1xuXHRcdGxldCBnZXRSb2JvdHNBbmRQYXJ0cyA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdvcmcuZnJlZWRlc2t0b3AuREJ1cy5PYmplY3RNYW5hZ2VyJyxcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBvYmpEYXRhKSA9PiB7IC8vIGdldCBhbGwgb2JqZWN0IHBhdGhzLCBpbnRlcmZhY2VzIGFuZCBwcm9wZXJ0aWVzIGNoaWxkcmVuIG9mIFN0YXR1c1xuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwgfHwgb2JqRGF0YSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0cmVqZWN0KGVycilcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXNvbHZlKG9iakRhdGEpIC8vIHJldHVybnMgYSBtYXAgdGhhdCBsaW5rcyB0aGUgb2JqZWN0IHBhdGggdG8gaXRzIGNvcnJlc3BvbmRpbmcgaW50ZXJmYWNlXG5cdFx0XHR9KVxuXHRcdH0pXG5cblx0XHRsZXQgcm9ib3RJZmFjZSA9ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCdcblx0XHRsZXQgcGFydElmYWNlID0gJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnXG5cblx0XHQvLyBqcyBvYmplY3RzIG9mIHJvYm90cyBhbmQgcGFydHNcblx0XHRsZXQgcm9ib3RNYXAgPSBuZXcgTWFwKCkgLy8gbWFwIHJvYm90IG5hbWUgdG8gaWRcblx0XHRsZXQgcm9ib3RzID0gW10gLy8gbGlzdCBvZiByb2JvdCBvYmplY3RzXG5cdFx0bGV0IHBhcnRzID0gW10gLy8gbGlzdCBvZiBwYXJ0IG9iamVjdFxuXHRcdGxldCBtZXNoZWRSb2JvdE5hbWVzID0gW10gLy8gbGlzdCBvZiBuYW1lcyBvZiByb2JvdHMgYW5kIGRpeWEtc2VydmVyIGluIHRoZSBtZXNoIG5ldHdvcmtcblxuXHRcdC8vIFJldHJpZXZlIHJlZmVyZW5jZSBtYXAgb2Yga2V5cyBhbmQgdmFsdWVzIGluIG9yZGVyIHRvIHJlZHVjZSBwYXlsb2FkIGZvciBzdGF0dXMgcmVxdWVzdHNcblx0XHRyZXR1cm4gUHJvbWlzZS50cnkoXyA9PiB0aGlzLl9nZXRQYXJ0UmVmZXJlbmNlTWFwKCkpXG5cdFx0XHQudGhlbihfID0+IHRoaXMuX2dldFN0YXR1c0V2dFJlZmVyZW5jZU1hcCgpKVxuXHRcdFx0LnRoZW4oXyA9PiBnZXROZWlnaGJvcnMpXG5cdFx0XHQudGhlbihyZXQgPT4ge1xuXHRcdFx0XHRpZiAocmV0ID09IG51bGwgfHwgIUFycmF5LmlzQXJyYXkocmV0KSkge1xuXHRcdFx0XHRcdG1lc2hlZFJvYm90TmFtZXMgPSBbXVxuXHRcdFx0XHR9XG5cdFx0XHRcdGxldCBob3N0bmFtZSA9IHRoaXMuc2VsZWN0b3IuX2Nvbm5lY3Rpb24uX3NlbGZcblx0XHRcdFx0bWVzaGVkUm9ib3ROYW1lcyA9IHJldC5tYXAociA9PiByWzBdKSAvLyB3ZSBvbmx5IGtlZXAgdGhlIHJvYm90IG5hbWVzXG5cdFx0XHRcdGlmICghbWVzaGVkUm9ib3ROYW1lcy5pbmNsdWRlcyhob3N0bmFtZSkpIHtcblx0XHRcdFx0XHRtZXNoZWRSb2JvdE5hbWVzLnB1c2goaG9zdG5hbWUpIC8vIGFkZCBob3N0bmFtZSwgaS5lLiB0aGUgZGl5YS1zZXJ2ZXIsIHdoaWNoIGlzIG5vdCBpbiB0aGUgbGlzdCBvZiBuZWlnaGJvcnNcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC50aGVuKF8gPT4gZ2V0Um9ib3RzQW5kUGFydHMpXG5cdFx0XHQudGhlbihyZXQgPT4ge1xuXHRcdFx0XHRmb3IgKGxldCBvYmplY3RQYXRoIGluIHJldCkge1xuXHRcdFx0XHRcdC8vIHRoZSBvYmplY3Qgb2J0YWluZWQgZnJvbSB0aGUgb2JqZWN0IHBhdGhcblx0XHRcdFx0XHRsZXQgb2JqZWN0ID0gcmV0W29iamVjdFBhdGhdXG5cblx0XHRcdFx0XHQvLyBpZiB0aGUgcmV0dXJuIG9iamVjdCBpcyBvZiBhIHJvYm90IGluIHRoZSBsaXN0IG9mIG5laWdoYm9ycywgb3Igb2YgdGhlIGRpeWEtc2VydmVyLCByZXRyaWV2ZSBhbGwgb2ZpdHMgcmVsZXZhbnQgc3RhdHVzZXNcblx0XHRcdFx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KHJvYm90SWZhY2UpKSB7IC8vIHRoaXMgaXMgcm9ib3Qgb2JqZWN0XG5cdFx0XHRcdFx0XHRyb2JvdHMucHVzaChvYmplY3Rbcm9ib3RJZmFjZV0pXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gaWYgdGhlIHJldHVybiBvYmplY3QgaXMgb2YgYSBwYXJ0LCBsaXN0ZW4gdG8gc2lnbmFsIFN0YXR1c0NoYW5nZWQgb2YgdGhlIHBhcnRcblx0XHRcdFx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KHBhcnRJZmFjZSkpIHsgLy8gdGhpcyBpcyBhIHBhcnQgb2JqZWN0XG5cdFx0XHRcdFx0XHRsZXQgcGFydCA9IG9iamVjdFtwYXJ0SWZhY2VdXG5cdFx0XHRcdFx0XHRwYXJ0Lm9iamVjdFBhdGggPSBvYmplY3RQYXRoXG5cdFx0XHRcdFx0XHRwYXJ0LlJvYm90TmFtZSA9IG9iamVjdFBhdGguc3BsaXQoJy8nKVs1XSAvKiAvZnIvcGFydG5lcmluZy9TdGF0dXMvUm9ib3RzL0IxUjAwMDM3L1BhcnRzL3ZvY3QgKi9cblx0XHRcdFx0XHRcdHBhcnRzLnB1c2gocGFydClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRMb2dnZXIuZGVidWcoJ3JvYm90cycsIHJvYm90cylcblx0XHRcdFx0TG9nZ2VyLmRlYnVnKCdwYXJ0cycsIHBhcnRzKVxuXG5cdFx0XHRcdC8vIGZpbGVyIGFuZCBrZWVwIHRoZSBkaXlhLXNlcnZlciBhbmQgdGhlIHJvYm90cyB0aGF0IGFyZSBvbmx5IGluIHRoZSBzYW1lIG1lc2ggbmV0d29ya3Ncblx0XHRcdFx0cm9ib3RzID0gcm9ib3RzLmZpbHRlcihyb2JvdCA9PiBtZXNoZWRSb2JvdE5hbWVzLmluY2x1ZGVzKHJvYm90LlJvYm90TmFtZSkpIC8vIG9ubHkga2VlcHMgcm9ib3RzIHRoYXQgYXJlIG5laWdoYm9ycyAoaS5lLiBpbiB0aGUgc2FtZSBtZXNoIG5ldHdvcmspXG5cblx0XHRcdFx0Ly8gZmlsdGVyIHBhcnRzIHRoYXQgYmVsb25ncyB0byB0aGUgcm9ib3QgaW4gdGhlIG1lc2ggbmV0d29yayAoaW5jbHVkaW5nIHRoZSBkaXlhLXNlcnZlcilcblx0XHRcdFx0cGFydHMgPSBwYXJ0cy5maWx0ZXIocGFydCA9PiBtZXNoZWRSb2JvdE5hbWVzLmluY2x1ZGVzKHBhcnQuUm9ib3ROYW1lKSkgLy8gb25seSBrZWVwcyBwYXJ0cyBiZWxvbmdpbmcgdG8gbmVpZ2hib3JzIChpLmUuIGluIHRoZSBzYW1lIG1lc2ggbmV0d29yaylcblxuXHRcdFx0XHQvLyBjcmVhdGUgbWFwIG9mIHJvYm90IG5hbWUgdG8gaWQgZm9yIHNldHRpbmcgUm9ib3RJZCB0byBwYXRoc1xuXHRcdFx0XHRyb2JvdHMuZm9yRWFjaChyb2JvdCA9PiB7XG5cdFx0XHRcdFx0aWYgKHJvYm90TWFwLmhhcyhyb2JvdC5Sb2JvdE5hbWUpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cm9ib3RNYXAuc2V0KHJvYm90LlJvYm90TmFtZSwgcm9ib3QuUm9ib3RJZClcblx0XHRcdFx0fSlcblxuXHRcdFx0XHQvLyBzZXQgUm9ib3RJZCB0byBlYWNoIHBhcnRcblx0XHRcdFx0cGFydHMuZm9yRWFjaChwYXJ0ID0+IHtcblx0XHRcdFx0XHRwYXJ0LlJvYm90SWQgPSByb2JvdE1hcC5nZXQocGFydC5Sb2JvdE5hbWUpXG5cdFx0XHRcdH0pXG5cdFx0XHRcdFxuXHRcdFx0XHRMb2dnZXIuZGVidWcoJ21lc2hlZCByb2JvdHMgdG8gYmUgZGlzcGxheWVkJywgcm9ib3RzKVxuXHRcdFx0XHRMb2dnZXIuZGVidWcoJ21lc2hlZCBwYXJ0cyB0byBiZSBzdWJzY3JpYmVkIHRvJywgcGFydHMpXG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oXyA9PiB0aGlzLl9zdWJzY3JpYmVUb011bHRpZGF5U3RhdHVzVXBkYXRlKHJvYm90cywgY2FsbGJhY2spKSAvLyBSZXRyaWV2ZSBpbml0aWFsIHN0YXR1c2VzIGZyb20gdGhlIGZpbHRlcmVkIHJvYm90c1xuXHRcdFx0LnRoZW4oXyA9PiB0aGlzLl9zdWJzY3JpYmVUb1N0YXR1c0NoYW5nZWQocGFydHMsIGNhbGxiYWNrKSkgLy8gTGlzdGVuIHRvIFN0YXR1c0NoYW5nZSBmcm9tIHRoZSBwYXJ0cyBiZWxvbmdpbmcgdG8gdGhlIGZpbHRlcmVkIHJvYm90c1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBDbG9zZSBhbGwgc3Vic2NyaXB0aW9uc1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5jbG9zZVN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbigpe1xuXHRcdGZvcih2YXIgaSBpbiB0aGlzLnN1YnNjcmlwdGlvbnMpIHtcblx0XHRcdHRoaXMuc3Vic2NyaXB0aW9uc1tpXS5jbG9zZSgpO1xuXHRcdH1cblx0XHR0aGlzLnN1YnNjcmlwdGlvbnMgPVtdO1xuXHRcdHRoaXMucm9ib3RNb2RlbCA9IFtdO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQgZGF0YSBnaXZlbiBkYXRhQ29uZmlnLlxuXHQgKiBAcGFyYW0ge2Z1bmN9IGNhbGxiYWNrIDogY2FsbGVkIGFmdGVyIHVwZGF0ZVxuXHQgKiBUT0RPIFVTRSBQUk9NSVNFXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmdldERhdGEgPSBmdW5jdGlvbihjYWxsYmFjaywgZGF0YUNvbmZpZyl7XG5cdFx0dmFyIGRhdGFNb2RlbCA9IHt9O1xuXHRcdHJldHVybiBQcm9taXNlLnRyeShfID0+IHtcblx0XHRcdGlmKGRhdGFDb25maWcgIT0gbnVsbClcblx0XHRcdFx0dGhpcy5EYXRhQ29uZmlnKGRhdGFDb25maWcpO1xuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJSZXF1ZXN0OiBcIitKU09OLnN0cmluZ2lmeShkYXRhQ29uZmlnKSk7XG5cdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiBcInN0YXR1c1wiLFxuXHRcdFx0XHRmdW5jOiBcIkRhdGFSZXF1ZXN0XCIsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHR0eXBlOlwic3BsUmVxXCIsXG5cdFx0XHRcdFx0ZGF0YUNvbmZpZzogdGhpcy5kYXRhQ29uZmlnXG5cdFx0XHRcdH1cblx0XHRcdH0sIChkbklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiW1wiICsgdGhpcy5kYXRhQ29uZmlnLnNlbnNvcnMgKyBcIl0gUmVjdiBlcnI6IFwiICsgSlNPTi5zdHJpbmdpZnkoZXJyKSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKGRhdGEuaGVhZGVyLmVycm9yICE9IG51bGwpIHtcblx0XHRcdFx0XHQvLyBUT0RPIDogY2hlY2svdXNlIGVyciBzdGF0dXMgYW5kIGFkYXB0IGJlaGF2aW9yIGFjY29yZGluZ2x5XG5cdFx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiVXBkYXRlRGF0YTpcXG5cIitKU09OLnN0cmluZ2lmeShkYXRhLmhlYWRlci5yZXFDb25maWcpKTtcblx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJEYXRhIHJlcXVlc3QgZmFpbGVkIChcIitkYXRhLmhlYWRlci5lcnJvci5zdCtcIik6IFwiK2RhdGEuaGVhZGVyLmVycm9yLm1zZyk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vTG9nZ2VyLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmRhdGFNb2RlbCkpO1xuXHRcdFx0XHRkYXRhTW9kZWwgPSB0aGlzLl9nZXREYXRhTW9kZWxGcm9tUmVjdihkYXRhKTtcblxuXHRcdFx0XHRMb2dnZXIubG9nKHRoaXMuZ2V0RGF0YU1vZGVsKCkpO1xuXHRcdFx0XHRjYWxsYmFjayA9IGNhbGxiYWNrLmJpbmQodGhpcyk7IC8vIGJpbmQgY2FsbGJhY2sgd2l0aCBTdGF0dXNcblx0XHRcdFx0Y2FsbGJhY2soZGF0YU1vZGVsKTsgLy8gY2FsbGJhY2sgZnVuY1xuXHRcdFx0fSk7XG5cdFx0fSkuY2F0Y2goZXJyID0+IHtcblx0XHRcdExvZ2dlci5lcnJvcihlcnIpXG5cdFx0fSlcblx0fTtcblxuXHQvKipcblx0ICogUmVzdG9yZSB6aXBwZWQgZGF0YSBmcm9tIHNpZ25hbCBNdWx0aWRheVN0YXR1c1VwZGF0ZWQgdG8gYSBjb21wbGlhbnQgc3RhdGUgZm9yIHVzZSBpbiBmdW5jdGlvbiB7QGxpbmsgX2dldFJvYm90TW9kZWxGcm9tUmVjdjJ9XG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gemlwcGVkIGRhdGEgcmVjZWl2ZWQgZnJvbSBzaWduYWwgTXVsdGlkYXlTdGF0dXNVcGRhdGVkLCB0aGlzIGRhdGEgaXMgY29tcHJlc3NlZCB0byByZWR1Y2UgbWVtb3J5IGZvb3RwcmludFxuXHQgKiB0LkRCVVNfRElDVCAoXG5cdCAqXHRcdHQuREJVU19TVFJJTkcsICAgICAvLyByb2JvdCBpbmZvIGkuZS4gNDpEMVIwMDAzNVxuXHQgKlx0XHR0LkRCVVNfRElDVCAoXG5cdCAqXHRcdFx0dC5EQlVTX1NUUklORywgLy8gcGFydElkXG5cdCAqXHRcdFx0dC5EQlVTX0FSUkFZICh0LkRCVVNfU1RSVUNUKHQuREJVU19VSU5UNjQsIHQuREJVU19VSU5UMTYsIHQuREJVU19VSU5UMzIpKVxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aW1lLCBjb2RlLCBoYXNoXG5cdCAqXHRcdClcblx0ICogQHJldHVybiB7b2JqZWN0fSBleHRyYWN0ZWQgZGF0YSBpbiBmb3JtIG9mIG1hcCBvZiAncm9ib3RJZDpyb2JvdE5hbWUnIHRvIGFycmF5IG9mIFtQYXJ0SWQsIENhdGVnb3J5LCBQYXJ0TmFtZSwgTGFiZWwsIFRpbWUsIENvZGUsIENvZGVSZWYsIE1zZywgQ3JpdExldmVsLCBEZXNjcmlwdGlvbl1cblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuX3VucGFja1JvYm90TW9kZWxzID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdGlmIChkYXRhID09IG51bGwpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHQvLyBUaGVzZSB0d28gcmVmZXJlbmNlIG1hcCBzaG91bGQgaGF2ZSBiZWVuIHJldHJpZXZlZCBhdCBpbml0aWFsIGNvbm5lY3Rpb25cblx0XHRpZiAodGhpcy5fcGFydFJlZmVyZW5jZU1hcCA9PSBudWxsKSB7XG5cdFx0XHR0aGlzLl9wYXJ0UmVmZXJlbmNlTWFwID0gW11cblx0XHR9XG5cdFx0aWYgKHRoaXMuX3N0YXR1c0V2dFJlZmVyZW5jZU1hcCA9PSBudWxsKSB7XG5cdFx0XHR0aGlzLl9zdGF0dXNFdnRSZWZlcmVuY2VNYXAgPSBbXVxuXHRcdH1cblx0XHQvLyBCZWdpbiB0byB1bnBhY2sgZGF0YVxuXHRcdGxldCByb2JvdFRvU3RhdHVzTWFwID0gbmV3IE1hcCgpXG5cdFx0Zm9yIChsZXQgcm9ib3QgaW4gZGF0YSkgeyAvLyBpLmUuIDQ6RDFSMDAwMzVcblx0XHRcdGZvciAobGV0IHBhcnRJZCBpbiBkYXRhW3JvYm90XSkge1xuXHRcdFx0XHRsZXQgc3ViU3RhdHVzZXMgPSBkYXRhW3JvYm90XVtwYXJ0SWRdIC8vIGFuIGFycmF5IG9mIFt0aW1lLCBjb2RlLCBoYXNoXVxuXHRcdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkoc3ViU3RhdHVzZXMpKSB7IC8vIGVycm9uZW91cyBkYXRhXG5cdFx0XHRcdFx0Y29udGludWVcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBleHRyYWN0IHBhcnQtcmVsYXRlZCBpbmZvcm1hdGlvbiBmcm9tIHByZS1yZXRyaWV2ZWQgbWFwXG5cdFx0XHRcdGxldCBwYXJ0UmVmZXJlbmNlID0gdGhpcy5fcGFydFJlZmVyZW5jZU1hcFtwYXJ0SWRdO1xuXHRcdFx0XHRpZiAocGFydFJlZmVyZW5jZSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0TG9nZ2VyLndhcm4oYFBhcnRSZWZlcmVuY2UgZmluZHMgbm8gbWFwIGZvciBwYXJ0SWQgJHtwYXJ0SWR9YClcblx0XHRcdFx0fVxuXHRcdFx0XHRsZXQgcGFydE5hbWUgPSBwYXJ0UmVmZXJlbmNlID09IG51bGwgPyBudWxsIDogcGFydFJlZmVyZW5jZVswXTtcblx0XHRcdFx0bGV0IGxhYmVsID0gcGFydFJlZmVyZW5jZSA9PSBudWxsID8gbnVsbCA6IHBhcnRSZWZlcmVuY2VbMV07XG5cdFx0XHRcdGxldCBjYXRlZ29yeSA9IHBhcnRSZWZlcmVuY2UgPT0gbnVsbCA/IG51bGwgOiBwYXJ0UmVmZXJlbmNlWzJdO1xuXG5cdFx0XHRcdHN1YlN0YXR1c2VzLmZvckVhY2goc3ViU3RhdHVzID0+IHtcblx0XHRcdFx0XHRsZXQgdGltZSA9IHN1YlN0YXR1c1swXVxuXHRcdFx0XHRcdGxldCBjb2RlID0gc3ViU3RhdHVzWzFdXG5cblx0XHRcdFx0XHQvLyBtYXAgdGhlIGhhc2ggdmFsdWUgdG8gdGhlIHN0YXR1cyBldmVudCB2YWx1ZXNcblx0XHRcdFx0XHRsZXQgaGFzaCA9IHN1YlN0YXR1c1syXVxuXHRcdFx0XHRcdGxldCBzdGF0dXNFdnRSZWZlcmVuY2UgPSB0aGlzLl9zdGF0dXNFdnRSZWZlcmVuY2VNYXBbaGFzaF1cblx0XHRcdFx0XHRpZiAoc3RhdHVzRXZ0UmVmZXJlbmNlID09IG51bGwpIHtcblx0XHRcdFx0XHRcdExvZ2dlci53YXJuKGBTdGF0dXNFdnRSZWZlcmVuY2UgZmluZHMgbm8gbWFwIGZvciBoYXNoIGtleSAke2hhc2h9YClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0bGV0IGNvZGVSZWYgPSBzdGF0dXNFdnRSZWZlcmVuY2UgPT0gbnVsbCA/IG51bGwgOiBzdGF0dXNFdnRSZWZlcmVuY2VbMF07XG5cdFx0XHRcdFx0bGV0IG1zZyA9IHN0YXR1c0V2dFJlZmVyZW5jZSA9PSBudWxsID8gbnVsbCA6IHN0YXR1c0V2dFJlZmVyZW5jZVsxXTtcblx0XHRcdFx0XHRsZXQgY3JpdExldmVsID0gc3RhdHVzRXZ0UmVmZXJlbmNlID09IG51bGwgPyBudWxsIDogc3RhdHVzRXZ0UmVmZXJlbmNlWzJdO1xuXG5cdFx0XHRcdFx0Ly8gY29uc3RydWN0IGZ1bGwgaW5mb3JtYXRpb24gZm9yIGVhY2ggc3RhdHVzXG5cdFx0XHRcdFx0bGV0IHN0YXR1cyA9IFtwYXJ0SWQsIGNhdGVnb3J5LCBwYXJ0TmFtZSwgbGFiZWwsIHRpbWUsIGNvZGUsIGNvZGVSZWYsIG1zZywgY3JpdExldmVsLCAnJ11cblx0XHRcdFx0XHRpZiAoIXJvYm90VG9TdGF0dXNNYXAuaGFzKHJvYm90KSkge1xuXHRcdFx0XHRcdFx0cm9ib3RUb1N0YXR1c01hcC5zZXQocm9ib3QsIFtdKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyb2JvdFRvU3RhdHVzTWFwLmdldChyb2JvdCkucHVzaChzdGF0dXMpO1xuXHRcdFx0XHR9KVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gcm9ib3RUb1N0YXR1c01hcFxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZSBpbnRlcm5hbCByb2JvdCBtb2RlbCB3aXRoIHJlY2VpdmVkIGRhdGEgKHZlcnNpb24gMilcblx0ICogQHBhcmFtICB7T2JqZWN0fSBkYXRhIC0gdHdvIGRpbWVuc2lvbmFsIGFycmF5IHJlY2VpdmVkIGZyb20gRGl5YU5vZGUgYnkgd2Vic29ja2V0XG5cdCAqIEBwYXJhbSB7aW50fSByb2JvdElkXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSByb2JvdE5hbWVcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuX2dldFJvYm90TW9kZWxGcm9tUmVjdjIgPSBmdW5jdGlvbihkYXRhLCByb2JvdElkLCByb2JvdE5hbWUpIHtcblx0XHRpZih0aGlzLnJvYm90TW9kZWwgPT0gbnVsbClcblx0XHRcdHRoaXMucm9ib3RNb2RlbCA9IFtdO1xuXG5cdFx0aWYodGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdICE9IG51bGwpXG5cdFx0XHR0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0ucGFydHMgPSB7fTsgLy8gcmVzZXQgcGFydHNcblxuXHRcdGlmKHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSA9PSBudWxsKVxuXHRcdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdID0ge307XG5cblx0XHR0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0gPSB7XG5cdFx0XHRyb2JvdDoge1xuXHRcdFx0XHRuYW1lOiByb2JvdE5hbWVcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqIGV4dHJhY3QgcGFydHMgaW5mbyAqKi9cblx0XHR0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0ucGFydHMgPSB7fTtcblx0XHRsZXQgclBhcnRzID0gdGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdLnBhcnRzO1xuXG5cdFx0ZGF0YS5mb3JFYWNoKGQgPT4ge1xuXHRcdFx0bGV0IHBhcnRJZCA9IGRbMF07XG5cdFx0XHRsZXQgY2F0ZWdvcnkgPSBkWzFdO1xuXHRcdFx0bGV0IHBhcnROYW1lID0gZFsyXTtcblx0XHRcdGxldCBsYWJlbCA9IGRbM107XG5cdFx0XHRsZXQgdGltZSA9IGRbNF07XG5cdFx0XHRsZXQgY29kZSA9IGRbNV07XG5cdFx0XHRsZXQgY29kZVJlZiA9IGRbNl07XG5cdFx0XHRsZXQgbXNnID0gZFs3XTtcblx0XHRcdGxldCBjcml0TGV2ZWwgPSBkWzhdO1xuXHRcdFx0bGV0IGRlc2NyaXB0aW9uID0gZFs5XTtcblxuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdID09IG51bGwpIHtcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0gPSB7fTtcblx0XHRcdH1cblx0XHRcdC8qIHVwZGF0ZSBwYXJ0IGNhdGVnb3J5ICovXG5cdFx0XHRyUGFydHNbcGFydElkXS5jYXRlZ29yeSA9IGNhdGVnb3J5O1xuXHRcdFx0LyogdXBkYXRlIHBhcnQgbmFtZSAqL1xuXHRcdFx0clBhcnRzW3BhcnRJZF0ubmFtZSA9IHBhcnROYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHQvKiB1cGRhdGUgcGFydCBsYWJlbCAqL1xuXHRcdFx0clBhcnRzW3BhcnRJZF0ubGFiZWwgPSBsYWJlbDtcblxuXHRcdFx0LyogdXBkYXRlIGVycm9yICovXG5cdFx0XHQvKiogdXBkYXRlIGVycm9yTGlzdCAqKi9cblx0XHRcdGlmIChyUGFydHNbcGFydElkXS5lcnJvckxpc3QgPT0gbnVsbClcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0ID0ge307XG5cblx0XHRcdGlmIChyUGFydHNbcGFydElkXS5lcnJvckxpc3RbY29kZVJlZl0gPT0gbnVsbClcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0W2NvZGVSZWZdID0ge1xuXHRcdFx0XHRcdG1zZzogbXNnLFxuXHRcdFx0XHRcdGNyaXRMZXZlbDogY3JpdExldmVsLFxuXHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuXHRcdFx0XHR9O1xuXHRcdFx0bGV0IGV2dHNfdG1wID0ge1xuXHRcdFx0XHR0aW1lOiB0aGlzLl9jb2Rlci5mcm9tKHRpbWUpLFxuXHRcdFx0XHRjb2RlOiB0aGlzLl9jb2Rlci5mcm9tKGNvZGUpLFxuXHRcdFx0XHRjb2RlUmVmOiB0aGlzLl9jb2Rlci5mcm9tKGNvZGVSZWYpXG5cdFx0XHR9O1xuXHRcdFx0LyoqIGlmIHJlY2VpdmVkIGxpc3Qgb2YgZXZlbnRzICoqL1xuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoZXZ0c190bXAuY29kZSkgfHwgQXJyYXkuaXNBcnJheShldnRzX3RtcC50aW1lKVxuXHRcdFx0XHR8fCBBcnJheS5pc0FycmF5KGV2dHNfdG1wLmNvZGVSZWYpKSB7XG5cdFx0XHRcdGlmIChldnRzX3RtcC5jb2RlLmxlbmd0aCA9PT0gZXZ0c190bXAuY29kZVJlZi5sZW5ndGhcblx0XHRcdFx0XHQmJiBldnRzX3RtcC5jb2RlLmxlbmd0aCA9PT0gZXZ0c190bXAudGltZS5sZW5ndGgpIHtcblx0XHRcdFx0XHQvKiogYnVpbGQgbGlzdCBvZiBldmVudHMgKiovXG5cdFx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXZ0cyA9IFtdO1xuXHRcdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZXZ0c190bXAuY29kZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXZ0cy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0dGltZTogZXZ0c190bXAudGltZVtpXSxcblx0XHRcdFx0XHRcdFx0Y29kZTogZXZ0c190bXAuY29kZVtpXSxcblx0XHRcdFx0XHRcdFx0Y29kZVJlZjogZXZ0c190bXAuY29kZVJlZltpXVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgTG9nZ2VyLmVycm9yKFwiU3RhdHVzOkluY29uc2lzdGFudCBsZW5ndGhzIG9mIGJ1ZmZlcnMgKHRpbWUvY29kZS9jb2RlUmVmKVwiKTtcblx0XHRcdH1cblx0XHRcdGVsc2UgeyAvKioganVzdCBpbiBjYXNlLCB0byBwcm92aWRlIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgKiovXG5cdFx0XHRcdC8qKiBzZXQgcmVjZWl2ZWQgZXZlbnRzICoqL1xuXHRcdFx0XHRpZiAoclBhcnRzW3BhcnRJZF0uZXZ0cyA9PSBudWxsKSB7XG5cdFx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXZ0cyA9IFtdXG5cdFx0XHRcdH1cblx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXZ0cy5wdXNoKHtcblx0XHRcdFx0XHR0aW1lOiBldnRzX3RtcC50aW1lLFxuXHRcdFx0XHRcdGNvZGU6IGV2dHNfdG1wLmNvZGUsXG5cdFx0XHRcdFx0Y29kZVJlZjogZXZ0c190bXAuY29kZVJlZlxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KVxuXHR9O1xuXG5cdC8qKiBjcmVhdGUgU3RhdHVzIHNlcnZpY2UgKiovXG5cdERpeWFTZWxlY3Rvci5wcm90b3R5cGUuU3RhdHVzID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gbmV3IFN0YXR1cyh0aGlzKTtcblx0fTtcblxuXHQvKipcblx0ICogU2V0IG9uIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGZpbmQgc3RhdHVzIHRvIG1vZGlmeVxuXHQgKiBAcGFyYW0gcGFydE5hbWUgXHR0byBmaW5kIHN0YXR1cyB0byBtb2RpZnlcblx0ICogQHBhcmFtIGNvZGVcdFx0bmV3Q29kZVxuXHQgKiBAcGFyYW0gc291cmNlXHRcdHNvdXJjZVxuXHQgKiBAcGFyYW0gY2FsbGJhY2tcdFx0cmV0dXJuIGNhbGxiYWNrICg8Ym9vbD5zdWNjZXNzKVxuXHQgKi9cblx0RGl5YVNlbGVjdG9yLnByb3RvdHlwZS5zZXRTdGF0dXMgPSBmdW5jdGlvbiAocm9ib3ROYW1lLCBwYXJ0TmFtZSwgY29kZSwgc291cmNlLCBjYWxsYmFjaykge1xuXHRcdHJldHVybiBQcm9taXNlLnRyeShfID0+IHtcblx0XHRcdHZhciBvYmplY3RQYXRoID0gXCIvZnIvcGFydG5lcmluZy9TdGF0dXMvUm9ib3RzL1wiICsgdGhpcy5zcGxpdEFuZENhbWVsQ2FzZShyb2JvdE5hbWUsIFwiLVwiKSArIFwiL1BhcnRzL1wiICsgcGFydE5hbWU7XG5cdFx0XHR0aGlzLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiBcInN0YXR1c1wiLFxuXHRcdFx0XHRmdW5jOiBcIlNldFBhcnRcIixcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCcsXG5cdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0Ly9yb2JvdE5hbWU6IHJvYm90TmFtZSxcblx0XHRcdFx0XHRjb2RlOiBjb2RlLFxuXHRcdFx0XHRcdC8vcGFydE5hbWU6IHBhcnROYW1lLFxuXHRcdFx0XHRcdHNvdXJjZTogc291cmNlIHwgMVxuXHRcdFx0XHR9XG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soZmFsc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKHRydWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KS5jYXRjaChlcnIgPT4ge1xuXHRcdFx0TG9nZ2VyLmVycm9yKGVycilcblx0XHR9KVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQgb25lIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGdldCBzdGF0dXNcblx0ICogQHBhcmFtIHBhcnROYW1lIFx0dG8gZ2V0IHN0YXR1c1xuXHQgKiBAcGFyYW0gY2FsbGJhY2tcdFx0cmV0dXJuIGNhbGxiYWNrKC0xIGlmIG5vdCBmb3VuZC9kYXRhIG90aGVyd2lzZSlcblx0ICogQHBhcmFtIF9mdWxsIFx0bW9yZSBkYXRhIGFib3V0IHN0YXR1c1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5nZXRTdGF0dXMgPSBmdW5jdGlvbiAocm9ib3ROYW1lLCBwYXJ0TmFtZSwgY2FsbGJhY2svKiwgX2Z1bGwqLykge1xuXHRcdGxldCBzZW5kRGF0YSA9IFtdXG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KF8gPT4ge1xuXHRcdFx0bGV0IHJlcSA9IHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdvcmcuZnJlZWRlc2t0b3AuREJ1cy5PYmplY3RNYW5hZ2VyJyxcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBvYmpEYXRhKSA9PiB7XG5cblx0XHRcdFx0bGV0IG9iamVjdFBhdGhSb2JvdCA9IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9cIiArIHRoaXMuc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIik7XG5cdFx0XHRcdGxldCBvYmplY3RQYXRoUGFydCA9IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9cIiArIHRoaXMuc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIikgKyBcIi9QYXJ0cy9cIiArIHBhcnROYW1lO1xuXHRcdFx0XHRsZXQgcm9ib3RJZCA9IG9iakRhdGFbb2JqZWN0UGF0aFJvYm90XVsnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXS5Sb2JvdElkXG5cdFx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdFx0XHRmdW5jOiBcIkdldFBhcnRcIixcblx0XHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnLFxuXHRcdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFBhcnRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdHNlbmREYXRhLnB1c2goZGF0YSlcblx0XHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soLTEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKHRoaXMucm9ib3RNb2RlbCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0fSkuY2F0Y2goZXJyID0+IHtcblx0XHRcdExvZ2dlci5lcnJvcihlcnIpXG5cdFx0fSlcblx0fTtcblxuXHRTdGF0dXMucHJvdG90eXBlLnNwbGl0QW5kQ2FtZWxDYXNlID0gZnVuY3Rpb24gKGluU3RyaW5nLCBkZWxpbWl0ZXIpIHtcblx0XHRsZXQgYXJyYXlTcGxpdFN0cmluZyA9IGluU3RyaW5nLnNwbGl0KGRlbGltaXRlcik7XG5cdFx0bGV0IG91dENhbWVsU3RyaW5nID0gJyc7XG5cdFx0YXJyYXlTcGxpdFN0cmluZy5mb3JFYWNoKHN0ciA9PiB7XG5cdFx0XHRvdXRDYW1lbFN0cmluZyArPSBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc3Vic3RyaW5nKDEpO1xuXHRcdH0pXG5cdFx0cmV0dXJuIG91dENhbWVsU3RyaW5nO1xuXHR9XG5cbn0pKClcbiJdfQ==
