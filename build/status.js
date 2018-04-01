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
			var robotToStatusMap = _this._unpackRobotModels(data[0]);
			Logger.debug('MultidayStatusUpdated is called, data:', robotToStatusMap);
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

		parts.forEach(function (part) {
			var subs = _this4.selector.subscribe({
				service: 'status',
				func: 'StatusChanged',
				obj: {
					interface: 'fr.partnering.Status.Part',
					path: objectPath
				}
			}, function (peerId, err, data) {
				if (err != null) {
					Logger.error("StatusSubscribe:" + err);
					return;
				}
				Logger.debug('StatusChanged is called, data:', data);
				if (data[9] == null) data[9] = ''; // empt description
				// Update robotModel variable
				_this4._getRobotModelFromRecv2(data, part.RobotId, part.RobotName);
				if (typeof callback === 'function') {
					callback(_this4.robotModel);
				}
			});
			_this4.subscriptions.push(subs);
		});

		if (true) {
			return;
		}

		var subs = this.selector.subscribe({
			service: 'status',
			func: 'StatusChanged',
			obj: {
				interface: 'fr.partnering.Status',
				path: objectPath
			}
		}, function (peerId, err, data) {
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
		});
		this.subscriptions.push(subs);

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
					var _part = object[partIface];
					_part.objectPath = _objectPath;
					_part.RobotName = _objectPath.split('/')[5]; /* /fr/partnering/Status/Robots/B1R00037/Parts/voct */
					parts.push(_part);
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
		}) // Retrieve initial statuses from the filtered robots
		.then(function (_) {
			return _this5._subscribeToStatusChanged(parts, callback);
		}); // Listen to StatusChange from the parts belonging to the filtered robots

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
		Logger.debug('Extracted ' + robotToStatusMap.length + ' statuses');
		return robotToStatusMap;
	};

	/**
  * Update internal robot model with received data (version 2)
  * @param  {Object} data data received from DiyaNode by websocket
  * @return {[type]}		[description]
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwic3JjL3N0YXR1cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7OztBQzFrQkE7O0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JBOzs7Ozs7Ozs7Ozs7QUFZQSxDQUFDLFlBQVU7O0FBRVYsS0FBSSxZQUFZLEVBQUUsT0FBTyxNQUFQLEtBQWtCLFdBQXBCLENBQWhCO0FBQ0EsS0FBRyxDQUFDLFNBQUosRUFBZTtBQUFFLE1BQUksVUFB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TyxjQUFQO0FBQ0EsRUFQRDtBQVNBLENBMzRCRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9cmV0dXJuIGV9KSgpIiwiIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsImltcG9ydCB7IFN0YXRzIH0gZnJvbSAnZnMnO1xuXG4vKlxuICogQ29weXJpZ2h0IDogUGFydG5lcmluZyAzLjAgKDIwMDctMjAxNilcbiAqIEF1dGhvciA6IFN5bHZhaW4gTWFow6kgPHN5bHZhaW4ubWFoZUBwYXJ0bmVyaW5nLmZyPlxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIGRpeWEtc2RrLlxuICpcbiAqIGRpeWEtc2RrIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIGRpeWEtc2RrIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIGRpeWEtc2RrLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cblxuXG5cblxuLyogbWF5YS1jbGllbnRcbiAqIENvcHlyaWdodCAoYykgMjAxNCwgUGFydG5lcmluZyBSb2JvdGljcywgQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgbGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3JcbiAqIG1vZGlmeSBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5IHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IHZlcnNpb25cbiAqXHQzLjAgb2YgdGhlIExpY2Vuc2UuIFRoaXMgbGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZVxuICogdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW5cbiAqIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVJcbiAqIFBVUlBPU0UuIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBsaWJyYXJ5LlxuICovXG4oZnVuY3Rpb24oKXtcblxuXHR2YXIgaXNCcm93c2VyID0gISh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyk7XG5cdGlmKCFpc0Jyb3dzZXIpIHsgdmFyIFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpOyB9XG5cdGVsc2UgeyB2YXIgUHJvbWlzZSA9IHdpbmRvdy5Qcm9taXNlOyB9XG5cdHZhciBEaXlhU2VsZWN0b3IgPSBkMS5EaXlhU2VsZWN0b3I7XG5cdHZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLyBMb2dnaW5nIHV0aWxpdHkgbWV0aG9kcyAvLy8vLy8vLy8vLy8vLy8vLy9cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXHR2YXIgREVCVUcgPSB0cnVlO1xuXHR2YXIgTG9nZ2VyID0ge1xuXHRcdGxvZzogZnVuY3Rpb24obWVzc2FnZSl7XG5cdFx0XHRpZihERUJVRykgY29uc29sZS5sb2cobWVzc2FnZSk7XG5cdFx0fSxcblxuXHRcdGRlYnVnOiBmdW5jdGlvbihtZXNzYWdlLCAuLi5hcmdzKXtcblx0XHRcdGlmKERFQlVHKSBjb25zb2xlLmxvZyhtZXNzYWdlLCAuLi5hcmdzKTtcblx0XHR9LFxuXG5cdFx0d2FybjogZnVuY3Rpb24obWVzc2FnZSl7XG5cdFx0XHRpZihERUJVRykgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuXHRcdH0sXG5cblx0XHRlcnJvcjogZnVuY3Rpb24obWVzc2FnZSl7XG5cdFx0XHRpZihERUJVRykgY29uc29sZS5lcnJvcihtZXNzYWdlKTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqXHRjYWxsYmFjayA6IGZ1bmN0aW9uIGNhbGxlZCBhZnRlciBtb2RlbCB1cGRhdGVkXG5cdCAqICovXG5cdGZ1bmN0aW9uIFN0YXR1cyhzZWxlY3Rvcil7XG5cdFx0dGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yO1xuXHRcdHRoaXMuX2NvZGVyID0gc2VsZWN0b3IuZW5jb2RlKCk7XG5cdFx0dGhpcy5zdWJzY3JpcHRpb25zID0gW107XG5cblx0XHQvKiogbW9kZWwgb2Ygcm9ib3QgOiBhdmFpbGFibGUgcGFydHMgYW5kIHN0YXR1cyAqKi9cblx0XHR0aGlzLnJvYm90TW9kZWwgPSBbXTtcblx0XHR0aGlzLl9yb2JvdE1vZGVsSW5pdCA9IGZhbHNlO1xuXHRcdHRoaXMuX3BhcnRSZWZlcmVuY2VNYXAgPSBbXTtcblxuXHRcdC8qKiogc3RydWN0dXJlIG9mIGRhdGEgY29uZmlnICoqKlxuXHRcdFx0IGNyaXRlcmlhIDpcblx0XHRcdCAgIHRpbWU6IGFsbCAzIHRpbWUgY3JpdGVyaWEgc2hvdWxkIG5vdCBiZSBkZWZpbmVkIGF0IHRoZSBzYW1lIHRpbWUuIChyYW5nZSB3b3VsZCBiZSBnaXZlbiB1cClcblx0XHRcdCAgICAgYmVnOiB7W251bGxdLHRpbWV9IChudWxsIG1lYW5zIG1vc3QgcmVjZW50KSAvLyBzdG9yZWQgYSBVVEMgaW4gbXMgKG51bSlcblx0XHRcdCAgICAgZW5kOiB7W251bGxdLCB0aW1lfSAobnVsbCBtZWFucyBtb3N0IG9sZGVzdCkgLy8gc3RvcmVkIGFzIFVUQyBpbiBtcyAobnVtKVxuXHRcdFx0ICAgICByYW5nZToge1tudWxsXSwgdGltZX0gKHJhbmdlIG9mIHRpbWUocG9zaXRpdmUpICkgLy8gaW4gcyAobnVtKVxuXHRcdFx0ICAgcm9ib3Q6IHtBcnJheU9mIElEIG9yIFtcImFsbFwiXX1cblx0XHRcdCAgIHBsYWNlOiB7QXJyYXlPZiBJRCBvciBbXCJhbGxcIl19XG5cdFx0XHQgb3BlcmF0b3I6IHtbbGFzdF0sIG1heCwgbW95LCBzZH0gLSggbWF5YmUgbW95IHNob3VsZCBiZSBkZWZhdWx0XG5cdFx0XHQgLi4uXG5cblx0XHRcdCBwYXJ0cyA6IHtbbnVsbF0gb3IgQXJyYXlPZiBQYXJ0c0lkfSB0byBnZXQgZXJyb3JzXG5cdFx0XHQgc3RhdHVzIDoge1tudWxsXSBvciBBcnJheU9mIFN0YXR1c05hbWV9IHRvIGdldCBzdGF0dXNcblxuXHRcdFx0IHNhbXBsaW5nOiB7W251bGxdIG9yIGludH1cblx0XHQqL1xuXHRcdHRoaXMuZGF0YUNvbmZpZyA9IHtcblx0XHRcdGNyaXRlcmlhOiB7XG5cdFx0XHRcdHRpbWU6IHtcblx0XHRcdFx0XHRiZWc6IG51bGwsXG5cdFx0XHRcdFx0ZW5kOiBudWxsLFxuXHRcdFx0XHRcdHJhbmdlOiBudWxsIC8vIGluIHNcblx0XHRcdFx0fSxcblx0XHRcdFx0cm9ib3Q6IG51bGxcblx0XHRcdH0sXG5cdFx0XHRvcGVyYXRvcjogJ2xhc3QnLFxuXHRcdFx0cGFydHM6IG51bGwsXG5cdFx0XHRzdGF0dXM6IG51bGxcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cdC8qKlxuXHQgKiBHZXQgcm9ib3RNb2RlbCA6XG5cdCAqIHtcblx0ICogIHBhcnRzOiB7XG5cdCAqXHRcdFwicGFydFhYXCI6IHtcblx0ICogXHRcdFx0IGVycm9yc0Rlc2NyOiB7IGVuY291bnRlcmVkIGVycm9ycyBpbmRleGVkIGJ5IGVycm9ySWRzPjAgfVxuXHQgKlx0XHRcdFx0PiBDb25maWcgb2YgZXJyb3JzIDpcblx0ICpcdFx0XHRcdFx0Y3JpdExldmVsOiBGTE9BVCwgLy8gY291bGQgYmUgaW50Li4uXG5cdCAqIFx0XHRcdFx0XHRtc2c6IFNUUklORyxcblx0ICpcdFx0XHRcdFx0c3RvcFNlcnZpY2VJZDogU1RSSU5HLFxuXHQgKlx0XHRcdFx0XHRydW5TY3JpcHQ6IFNlcXVlbGl6ZS5TVFJJTkcsXG5cdCAqXHRcdFx0XHRcdG1pc3Npb25NYXNrOiBTZXF1ZWxpemUuSU5URUdFUixcblx0ICpcdFx0XHRcdFx0cnVuTGV2ZWw6IFNlcXVlbGl6ZS5JTlRFR0VSXG5cdCAqXHRcdFx0ZXJyb3I6W0ZMT0FULCAuLi5dLCAvLyBjb3VsZCBiZSBpbnQuLi5cblx0ICpcdFx0XHR0aW1lOltGTE9BVCwgLi4uXSxcblx0ICpcdFx0XHRyb2JvdDpbRkxPQVQsIC4uLl0sXG5cdCAqXHRcdFx0Ly8vIHBsYWNlOltGTE9BVCwgLi4uXSwgbm90IGltcGxlbWVudGVkIHlldFxuXHQgKlx0XHR9LFxuXHQgKlx0IFx0Li4uIChcIlBhcnRZWVwiKVxuXHQgKiAgfSxcblx0ICogIHN0YXR1czoge1xuXHQgKlx0XHRcInN0YXR1c1hYXCI6IHtcblx0ICpcdFx0XHRcdGRhdGE6W0ZMT0FULCAuLi5dLCAvLyBjb3VsZCBiZSBpbnQuLi5cblx0ICpcdFx0XHRcdHRpbWU6W0ZMT0FULCAuLi5dLFxuXHQgKlx0XHRcdFx0cm9ib3Q6W0ZMT0FULCAuLi5dLFxuXHQgKlx0XHRcdFx0Ly8vIHBsYWNlOltGTE9BVCwgLi4uXSwgbm90IGltcGxlbWVudGVkIHlldFxuXHQgKlx0XHRcdFx0cmFuZ2U6IFtGTE9BVCwgRkxPQVRdLFxuXHQgKlx0XHRcdFx0bGFiZWw6IHN0cmluZ1xuXHQgKlx0XHRcdH0sXG5cdCAqXHQgXHQuLi4gKFwiU3RhdHVzWVlcIilcblx0ICogIH1cblx0ICogfVxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5nZXRSb2JvdE1vZGVsID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5yb2JvdE1vZGVsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YUNvbmZpZyBjb25maWcgZm9yIGRhdGEgcmVxdWVzdFxuXHQgKiBpZiBkYXRhQ29uZmlnIGlzIGRlZmluZSA6IHNldCBhbmQgcmV0dXJuIHRoaXNcblx0ICpcdCBAcmV0dXJuIHtTdGF0dXN9IHRoaXNcblx0ICogZWxzZVxuXHQgKlx0IEByZXR1cm4ge09iamVjdH0gY3VycmVudCBkYXRhQ29uZmlnXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFDb25maWcgPSBmdW5jdGlvbihuZXdEYXRhQ29uZmlnKXtcblx0XHRpZihuZXdEYXRhQ29uZmlnKSB7XG5cdFx0XHR0aGlzLmRhdGFDb25maWc9bmV3RGF0YUNvbmZpZztcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gdGhpcy5kYXRhQ29uZmlnO1xuXHR9O1xuXHQvKipcblx0ICogVE8gQkUgSU1QTEVNRU5URUQgOiBvcGVyYXRvciBtYW5hZ2VtZW50IGluIEROLVN0YXR1c1xuXHQgKiBAcGFyYW0gIHtTdHJpbmd9XHQgbmV3T3BlcmF0b3IgOiB7W2xhc3RdLCBtYXgsIG1veSwgc2R9XG5cdCAqIEByZXR1cm4ge1N0YXR1c30gdGhpcyAtIGNoYWluYWJsZVxuXHQgKiBTZXQgb3BlcmF0b3IgY3JpdGVyaWEuXG5cdCAqIERlcGVuZHMgb24gbmV3T3BlcmF0b3Jcblx0ICpcdEBwYXJhbSB7U3RyaW5nfSBuZXdPcGVyYXRvclxuXHQgKlx0QHJldHVybiB0aGlzXG5cdCAqIEdldCBvcGVyYXRvciBjcml0ZXJpYS5cblx0ICpcdEByZXR1cm4ge1N0cmluZ30gb3BlcmF0b3Jcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YU9wZXJhdG9yID0gZnVuY3Rpb24obmV3T3BlcmF0b3Ipe1xuXHRcdGlmKG5ld09wZXJhdG9yKSB7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcub3BlcmF0b3IgPSBuZXdPcGVyYXRvcjtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gdGhpcy5kYXRhQ29uZmlnLm9wZXJhdG9yO1xuXHR9O1xuXHQvKipcblx0ICogRGVwZW5kcyBvbiBudW1TYW1wbGVzXG5cdCAqIEBwYXJhbSB7aW50fSBudW1iZXIgb2Ygc2FtcGxlcyBpbiBkYXRhTW9kZWxcblx0ICogaWYgZGVmaW5lZCA6IHNldCBudW1iZXIgb2Ygc2FtcGxlc1xuXHQgKlx0QHJldHVybiB7U3RhdHVzfSB0aGlzXG5cdCAqIGVsc2Vcblx0ICpcdEByZXR1cm4ge2ludH0gbnVtYmVyIG9mIHNhbXBsZXNcblx0ICoqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFTYW1wbGluZyA9IGZ1bmN0aW9uKG51bVNhbXBsZXMpe1xuXHRcdGlmKG51bVNhbXBsZXMpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5zYW1wbGluZyA9IG51bVNhbXBsZXM7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHRoaXMuZGF0YUNvbmZpZy5zYW1wbGluZztcblx0fTtcblx0LyoqXG5cdCAqIFNldCBvciBnZXQgZGF0YSB0aW1lIGNyaXRlcmlhIGJlZyBhbmQgZW5kLlxuXHQgKiBJZiBwYXJhbSBkZWZpbmVkXG5cdCAqXHRAcGFyYW0ge0RhdGV9IG5ld1RpbWVCZWcgLy8gbWF5IGJlIG51bGxcblx0ICpcdEBwYXJhbSB7RGF0ZX0gbmV3VGltZUVuZCAvLyBtYXkgYmUgbnVsbFxuXHQgKlx0QHJldHVybiB7U3RhdHVzfSB0aGlzXG5cdCAqIElmIG5vIHBhcmFtIGRlZmluZWQ6XG5cdCAqXHRAcmV0dXJuIHtPYmplY3R9IFRpbWUgb2JqZWN0OiBmaWVsZHMgYmVnIGFuZCBlbmQuXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFUaW1lID0gZnVuY3Rpb24obmV3VGltZUJlZyxuZXdUaW1lRW5kLCBuZXdSYW5nZSl7XG5cdFx0aWYobmV3VGltZUJlZyB8fCBuZXdUaW1lRW5kIHx8IG5ld1JhbmdlKSB7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5iZWcgPSBuZXdUaW1lQmVnLmdldFRpbWUoKTtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS50aW1lLmVuZCA9IG5ld1RpbWVFbmQuZ2V0VGltZSgpO1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUucmFuZ2UgPSBuZXdSYW5nZTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRiZWc6IG5ldyBEYXRlKHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS50aW1lLmJlZyksXG5cdFx0XHRcdGVuZDogbmV3IERhdGUodGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUuZW5kKSxcblx0XHRcdFx0cmFuZ2U6IG5ldyBEYXRlKHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS50aW1lLnJhbmdlKVxuXHRcdFx0fTtcblx0fTtcblx0LyoqXG5cdCAqIERlcGVuZHMgb24gcm9ib3RJZHNcblx0ICogU2V0IHJvYm90IGNyaXRlcmlhLlxuXHQgKlx0QHBhcmFtIHtBcnJheVtJbnRdfSByb2JvdElkcyBsaXN0IG9mIHJvYm90IElkc1xuXHQgKiBHZXQgcm9ib3QgY3JpdGVyaWEuXG5cdCAqXHRAcmV0dXJuIHtBcnJheVtJbnRdfSBsaXN0IG9mIHJvYm90IElkc1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5EYXRhUm9ib3RJZHMgPSBmdW5jdGlvbihyb2JvdElkcyl7XG5cdFx0aWYocm9ib3RJZHMpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS5yb2JvdCA9IHJvYm90SWRzO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEucm9ib3Q7XG5cdH07XG5cdC8qKlxuXHQgKiBEZXBlbmRzIG9uIHBsYWNlSWRzIC8vIG5vdCByZWxldmFudD8sIG5vdCBpbXBsZW1lbnRlZCB5ZXRcblx0ICogU2V0IHBsYWNlIGNyaXRlcmlhLlxuXHQgKlx0QHBhcmFtIHtBcnJheVtJbnRdfSBwbGFjZUlkcyBsaXN0IG9mIHBsYWNlIElkc1xuXHQgKiBHZXQgcGxhY2UgY3JpdGVyaWEuXG5cdCAqXHRAcmV0dXJuIHtBcnJheVtJbnRdfSBsaXN0IG9mIHBsYWNlIElkc1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5EYXRhUGxhY2VJZHMgPSBmdW5jdGlvbihwbGFjZUlkcyl7XG5cdFx0aWYocGxhY2VJZHMpIHtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS5wbGFjZUlkID0gcGxhY2VJZHM7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS5wbGFjZTtcblx0fTtcblx0LyoqXG5cdCAqIEdldCBkYXRhIGJ5IHNlbnNvciBuYW1lLlxuXHQgKlx0QHBhcmFtIHtBcnJheVtTdHJpbmddfSBzZW5zb3JOYW1lIGxpc3Qgb2Ygc2Vuc29yc1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5nZXREYXRhQnlOYW1lID0gZnVuY3Rpb24oc2Vuc29yTmFtZXMpe1xuXHRcdHZhciBkYXRhPVtdO1xuXHRcdGZvcih2YXIgbiBpbiBzZW5zb3JOYW1lcykge1xuXHRcdFx0ZGF0YS5wdXNoKHRoaXMuZGF0YU1vZGVsW3NlbnNvck5hbWVzW25dXSk7XG5cdFx0fVxuXHRcdHJldHVybiBkYXRhO1xuXHR9O1xuXG5cdFN0YXR1cy5wcm90b3R5cGUuX3N1YnNjcmliZVRvTXVsdGlkYXlTdGF0dXNVcGRhdGUgPSBmdW5jdGlvbiAocm9ib3Rfb2JqZWN0cywgY2FsbGJhY2spIHtcblx0XHRMb2dnZXIuZGVidWcoYFN1YnNjcmliZSB0byBNdWx0aWRheVN0YXR1c1VwZGF0ZWApXG5cdFx0bGV0IHN1YnMgPSB0aGlzLnNlbGVjdG9yLnN1YnNjcmliZSh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnTXVsdGlkYXlTdGF0dXNVcGRhdGVkJyxcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMnLFxuXHRcdFx0XHRcdHBhdGg6IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzXCJcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdExvZ2dlci5kZWJ1ZyhgUkVDRUlWRUQgU1VCU0NSSVBUSU9OYCwgZGF0YSlcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiU3RhdHVzU3Vic2NyaWJlOlwiICsgZXJyKVxuXHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghQXJyYXkuaXNBcnJheShkYXRhKSkge1xuXHRcdFx0XHRcdExvZ2dlci53YXJuKFwiTWFsZm9ybWVkIGRhdGEgZnJvbSBzaWduYWwgTXVsdGlkYXlTdGF0dXNVcGRhdGVkOlwiICsgZGF0YSlcblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0fVxuXHRcdFx0XHRsZXQgcm9ib3RUb1N0YXR1c01hcCA9IHRoaXMuX3VucGFja1JvYm90TW9kZWxzKGRhdGFbMF0pXG5cdFx0XHRcdExvZ2dlci5kZWJ1ZyhgTXVsdGlkYXlTdGF0dXNVcGRhdGVkIGlzIGNhbGxlZCwgZGF0YTpgLCByb2JvdFRvU3RhdHVzTWFwKVxuXHRcdFx0XHRmb3IgKHZhciBba2V5LCB2YWx1ZV0gb2Ygcm9ib3RUb1N0YXR1c01hcC5lbnRyaWVzKCkpIHtcblx0XHRcdFx0XHRsZXQgcm9ib3RJZHMgPSBrZXkuc3BsaXQoJzonKVxuXHRcdFx0XHRcdGxldCByb2JvdElkID0gcm9ib3RJZHNbMF1cblx0XHRcdFx0XHRsZXQgcm9ib3ROYW1lID0gcm9ib3RJZHNbMV1cblx0XHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHZhbHVlLCByb2JvdElkLCByb2JvdE5hbWUpIC8vIHVwZGF0ZSB0aGlzLnJvYm90TW9kZWxcblx0XHRcdFx0ICB9XG5cdFx0XHRcdExvZ2dlci5kZWJ1ZyhgUm9ib3RNb2RlbCBhZnRlciB1bnBhY2tlZDpgLCB0aGlzLnJvYm90TW9kZWwpXG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwpO1xuXHRcdFx0XHR9XG5cdFx0fSlcblx0XHR0aGlzLnN1YnNjcmlwdGlvbnMucHVzaChzdWJzKVxuXG5cdFx0TG9nZ2VyLmRlYnVnKGBTZW5kIHJlcXVlc3QgZm9yIE11bHRpZGF5U3RhdHVzVXBkYXRlYCwgcm9ib3ROYW1lcylcblx0XHRsZXQgcm9ib3ROYW1lcyA9IHJvYm90X29iamVjdHMubWFwKHJvYm90ID0+IHJvYm90LlJvYm90TmFtZSlcblx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiBcInN0YXR1c1wiLFxuXHRcdFx0XHRmdW5jOiBcIlRyaWdnZXJNdWx0aWRheVN0YXR1c2VzXCIsXG5cdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzJyxcblx0XHRcdFx0XHRwYXRoOiBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1c1wiXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRyb2JvdF9uYW1lczogcm9ib3ROYW1lc1xuXHRcdFx0XHR9XG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0Ly8gRG8gbm90aGluZyBzaW5jZSB0aGUgc2VydmVyIHNob3VsZCByZXBvbnNlIGJhY2sgdmlhIHNpZ25hbHNcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0TG9nZ2VyLndhcm4oYENhbm5vdCBjb25uZWN0IHRvIHN0YXR1cyBzZXJ2aWNlOiAke2Vycn1gKVxuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKC0xKTtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKVxuXHRcdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgJ1BhcnRzJyByZWZlcmVuY2UgbWFwIHRvIHJlZHVjZSBzdGF0dXMgcGF5bG9hZC4gRHVwbGljYXRlZCBjb250ZW50cyBpbiBzdGF0dXMgYXJlIHN0b3JlZCBpbiB0aGUgbWFwLlxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5fZ2V0UGFydFJlZmVyZW5jZU1hcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAodGhpcy5fcGFydFJlZmVyZW5jZU1hcCA9PSBudWxsIHx8IHRoaXMuX3BhcnRSZWZlcmVuY2VNYXAubGVuZ3RoID09IDApIHtcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdFx0c2VydmljZTogJ1N0YXR1cycsXG5cdFx0XHRcdFx0ZnVuYzogJ0dldFBhcnRSZWZlcmVuY2VNYXAnLFxuXHRcdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMnLFxuXHRcdFx0XHRcdFx0cGF0aDogJy9mci9wYXJ0bmVyaW5nL1N0YXR1cydcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdExvZ2dlci5kZWJ1ZyhgUGFydFJlZmVyZW5jZU1hcCwgZXJyYCwgZGF0YSwgZXJyKVxuXHRcdFx0XHRcdGlmIChkYXRhID09IG51bGwpIHtcblx0XHRcdFx0XHRcdGRhdGEgPSBbXVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLl9wYXJ0UmVmZXJlbmNlTWFwID0gZGF0YVxuXHRcdFx0XHRcdHJlc29sdmUoKSAvLyByZXR1cm5zIGEgbWFwIG9mIHBhcnRpZCB0byBpdHMgcHJvcGVydGllc1xuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHR9XG5cdFx0TG9nZ2VyLmRlYnVnKCdQYXJ0UmVmZXJlbmNlTWFwIGFscmVhZHkgZXhpc3RzLCBubyBuZWVkIHRvIHJlcXVlc3QuIE51bWJlciBvZiBwYXJ0czonLCB0aGlzLl9wYXJ0UmVmZXJlbmNlTWFwLmxlbmd0aClcblx0fTtcblxuXHQvKipcblx0ICogR2V0ICdTdGF0dXNFdnRzJyByZWZlcmVuY2UgbWFwIHRvIHJlZHVjZSBzdGF0dXMgcGF5bG9hZC4gRHVwbGljYXRlZCBjb250ZW50cyBpbiBzdGF0dXMgYXJlIHN0b3JlZCBpbiB0aGUgbWFwLlxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5fZ2V0U3RhdHVzRXZ0UmVmZXJlbmNlTWFwID0gZnVuY3Rpb24gKCkge1xuXHRcdGlmICh0aGlzLl9zdGF0dXNFdnRSZWZlcmVuY2VNYXAgPT0gbnVsbCB8fCB0aGlzLl9zdGF0dXNFdnRSZWZlcmVuY2VNYXAubGVuZ3RoID09IDApIHtcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdFx0c2VydmljZTogJ1N0YXR1cycsXG5cdFx0XHRcdFx0ZnVuYzogJ0dldFN0YXR1c0V2dFJlZmVyZW5jZU1hcCcsXG5cdFx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cycsXG5cdFx0XHRcdFx0XHRwYXRoOiAnL2ZyL3BhcnRuZXJpbmcvU3RhdHVzJ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdFx0TG9nZ2VyLmRlYnVnKGBTdGF0dXNFdnRSZWZlcmVuY2VNYXAsIGVycmAsIGRhdGEsIGVycilcblx0XHRcdFx0XHRpZiAoZGF0YSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRkYXRhID0gW11cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy5fc3RhdHVzRXZ0UmVmZXJlbmNlTWFwID0gZGF0YVxuXHRcdFx0XHRcdHJlc29sdmUoKSAvLyByZXR1cm5zIGEgbWFwIG9mIHBhcnRpZCB0byBpdHMgcHJvcGVydGllc1xuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHR9XG5cdFx0TG9nZ2VyLmRlYnVnKCdTdGF0dXNFdnRSZWZlcmVuY2VNYXAgYWxyZWFkeSBleGlzdHMsIG5vIG5lZWQgdG8gcmVxdWVzdC4gTnVtYmVyIG9mIHBhcnRzOicsIHRoaXMuX3N0YXR1c0V2dFJlZmVyZW5jZU1hcC5sZW5ndGgpXG5cdH07XG5cblx0LyoqXG5cdCAqIFN1YnNjcmliZXMgdG8gc3RhdHVzIGNoYW5nZXMgZm9yIGFsbCBwYXJ0c1xuXHQgKiBAcGFyYW0geyp9IHBhcnRzIFxuXHQgKiBAcGFyYW0geyp9IGNhbGxiYWNrIFxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5fc3Vic2NyaWJlVG9TdGF0dXNDaGFuZ2VkID0gZnVuY3Rpb24gKHBhcnRzLCBjYWxsYmFjaykge1xuXHRcdGlmIChwYXJ0cyA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHRwYXJ0cy5mb3JFYWNoKHBhcnQgPT4ge1xuXHRcdFx0bGV0IHN1YnMgPSB0aGlzLnNlbGVjdG9yLnN1YnNjcmliZSh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnU3RhdHVzQ2hhbmdlZCcsXG5cdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnLFxuXHRcdFx0XHRcdHBhdGg6IG9iamVjdFBhdGhcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdExvZ2dlci5lcnJvcihcIlN0YXR1c1N1YnNjcmliZTpcIiArIGVycilcblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0fVxuXHRcdFx0XHRMb2dnZXIuZGVidWcoYFN0YXR1c0NoYW5nZWQgaXMgY2FsbGVkLCBkYXRhOmAsIGRhdGEpXG5cdFx0XHRcdGlmIChkYXRhWzldID09IG51bGwpIGRhdGFbOV0gPSAnJyAvLyBlbXB0IGRlc2NyaXB0aW9uXG5cdFx0XHRcdC8vIFVwZGF0ZSByb2JvdE1vZGVsIHZhcmlhYmxlXG5cdFx0XHRcdHRoaXMuX2dldFJvYm90TW9kZWxGcm9tUmVjdjIoZGF0YSwgcGFydC5Sb2JvdElkLCBwYXJ0LlJvYm90TmFtZSk7XG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zLnB1c2goc3Vicyk7XG5cdFx0fSlcblxuXHRcdGlmICh0cnVlKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblxuXHRcdGxldCBzdWJzID0gdGhpcy5zZWxlY3Rvci5zdWJzY3JpYmUoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHRcdFx0ZnVuYzogJ1N0YXR1c0NoYW5nZWQnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cycsXG5cdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFxuXHRcdFx0XHR9XG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiU3RhdHVzU3Vic2NyaWJlOlwiICsgZXJyKVxuXHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHR9XG5cdFx0XHRcdExvZ2dlci5kZWJ1ZyhgU3RhdHVzQ2hhbmdlZCBpcyBjYWxsZWQsIGRhdGE6YCwgZGF0YSlcblx0XHRcdFx0Ly8gVXBkYXRlIHJvYm90TW9kZWwgdmFyaWFibGVcblx0XHRcdFx0dGhpcy5fZ2V0Um9ib3RNb2RlbEZyb21SZWN2MihkYXRhLCBwYXJ0LlJvYm90SWQsIHBhcnQuUm9ib3ROYW1lKTtcblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNhbGxiYWNrKHRoaXMucm9ib3RNb2RlbCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdHRoaXMuc3Vic2NyaXB0aW9ucy5wdXNoKHN1YnMpO1xuXG5cblxuXHQvLyBcdGxldCBzdWJzID0gdGhpcy5zZWxlY3Rvci5zdWJzY3JpYmUoey8vIHN1YnNjcmliZXMgdG8gc3RhdHVzIGNoYW5nZXMgZm9yIGFsbCBwYXJ0c1xuXHQvLyBcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdC8vIFx0XHRmdW5jOiAnU3RhdHVzQ2hhbmdlZCcsXG5cdC8vIFx0XHRvYmo6IHtcblx0Ly8gXHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0Ly8gXHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoXG5cdC8vIFx0XHR9LFxuXHQvLyBcdFx0ZGF0YTogcm9ib3ROYW1lc1xuXHQvLyB9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0Ly8gXHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHQvLyBcdFx0XHRcdExvZ2dlci5lcnJvcihcIlN0YXR1c1N1YnNjcmliZTpcIiArIGVycik7XG5cdC8vIFx0XHR9IGVsc2Uge1xuXHQvLyBcdFx0XHRcdHNlbmREYXRhWzBdID0gZGF0YTtcblx0Ly8gXHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHQvLyBcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0Ly8gXHRcdFx0XHRcdFx0Y2FsbGJhY2sodGhpcy5yb2JvdE1vZGVsLCBwZWVySWQpO1xuXHQvLyBcdFx0XHRcdH1cblx0Ly8gXHRcdH1cblx0Ly8gfSk7XG5cdC8vIHRoaXMuc3Vic2NyaXB0aW9ucy5wdXNoKHN1YnMpO1xuXG5cdH1cblxuXHQvKipcblx0ICogUXVlcnkgZm9yIGluaXRpYWwgc3RhdHVzZXNcblx0ICogU3Vic2NyaWJlIHRvIGVycm9yL3N0YXR1cyB1cGRhdGVzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLndhdGNoID0gZnVuY3Rpb24gKHJvYm90TmFtZXMsIGNhbGxiYWNrKSB7XG5cdFx0TG9nZ2VyLmRlYnVnKGBTdGF0dXMud2F0Y2g6IHJvYm90TmFtZXNgLCByb2JvdE5hbWVzKVxuXG5cdFx0dGhpcy5zZWxlY3Rvci5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cdFx0dGhpcy5zZWxlY3Rvci5fY29ubmVjdGlvbi5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cblx0XHQvLyBQcm9taXNlIHRvIHJldHJpZXZlIGxpc3Qgb2YgcGFpcmVkIG5laWdoYm9ycywgaS5lLiBhbGwgbmVpZ2hib3Igcm9ib3RzIGluIHRoZSBzYW1lIG1lc2ggbmV0d29ya1xuXHRcdGxldCBnZXROZWlnaGJvcnMgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnTWVzaE5ldHdvcmsnLFxuXHRcdFx0XHRmdW5jOiAnTGlzdE5laWdoYm9ycycsXG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIG5laWdoYm9ycykgPT4ge1xuXHRcdFx0XHRMb2dnZXIuZGVidWcoYG5laWdoYm9ycywgZXJyYCwgbmVpZ2hib3JzLCBlcnIpXG5cdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdHJlamVjdChlcnIpXG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gVGhpcyBvbmx5IHJldHVybnMgdGhlIGxpc3Qgb2YgcGh5c2ljYWwgZGV2aWNlcyBwYWlyZWQgaW50byB0aGUgbWVzaCBuZXR3b3JrLCB0aGUgZGl5YS1zZXJ2ZXIgaW5zdGFuY2UgaXMgbm90IGFscmVhZHkgaW5jbHVkZWQgaW4gdGhlIGxpc3Rcblx0XHRcdFx0aWYgKG5laWdoYm9ycyA9PSBudWxsKSB7XG5cdFx0XHRcdFx0bmVpZ2hib3JzID0gW11cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXNvbHZlKG5laWdoYm9ycykgLy8gcmV0dXJucyBhIGFycmF5IG9mIG5laWdoYm9yIG9iamVjdCwgZWFjaCBvYmplY3QgaXMgYW4gYXJyYXkgb2YgW3JvYm90LW5hbWUsIGFkZHJlc3MsIGJvb2xdXG5cdFx0XHR9KVxuXHRcdH0pXG5cblx0XHQvLyBQcm9taXNlIHRvIHJldHJpZXZlIGFsbCBvYmplY3RzIChyb2JvdHMsIHBhcnRzKSBleHBvc2VkIGluIERCdXMgYnkgZGl5YS1ub2RlLXN0YXR1c1xuXHRcdGxldCBnZXRSb2JvdHNBbmRQYXJ0cyA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdvcmcuZnJlZWRlc2t0b3AuREJ1cy5PYmplY3RNYW5hZ2VyJyxcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBvYmpEYXRhKSA9PiB7IC8vIGdldCBhbGwgb2JqZWN0IHBhdGhzLCBpbnRlcmZhY2VzIGFuZCBwcm9wZXJ0aWVzIGNoaWxkcmVuIG9mIFN0YXR1c1xuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwgfHwgb2JqRGF0YSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0cmVqZWN0KGVycilcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXNvbHZlKG9iakRhdGEpIC8vIHJldHVybnMgYSBtYXAgdGhhdCBsaW5rcyB0aGUgb2JqZWN0IHBhdGggdG8gaXRzIGNvcnJlc3BvbmRpbmcgaW50ZXJmYWNlXG5cdFx0XHR9KVxuXHRcdH0pXG5cblx0XHRsZXQgcm9ib3RJZmFjZSA9ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCdcblx0XHRsZXQgcGFydElmYWNlID0gJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnXG5cblx0XHQvLyBqcyBvYmplY3RzIG9mIHJvYm90cyBhbmQgcGFydHNcblx0XHRsZXQgcm9ib3RNYXAgPSBuZXcgTWFwKCkgLy8gbWFwIHJvYm90IG5hbWUgdG8gaWRcblx0XHRsZXQgcm9ib3RzID0gW10gLy8gbGlzdCBvZiByb2JvdCBvYmplY3RzXG5cdFx0bGV0IHBhcnRzID0gW10gLy8gbGlzdCBvZiBwYXJ0IG9iamVjdFxuXHRcdGxldCBtZXNoZWRSb2JvdE5hbWVzID0gW10gLy8gbGlzdCBvZiBuYW1lcyBvZiByb2JvdHMgYW5kIGRpeWEtc2VydmVyIGluIHRoZSBtZXNoIG5ldHdvcmtcblxuXHRcdC8vIFJldHJpZXZlIHJlZmVyZW5jZSBtYXAgb2Yga2V5cyBhbmQgdmFsdWVzIGluIG9yZGVyIHRvIHJlZHVjZSBwYXlsb2FkIGZvciBzdGF0dXMgcmVxdWVzdHNcblx0XHRyZXR1cm4gUHJvbWlzZS50cnkoXyA9PiB0aGlzLl9nZXRQYXJ0UmVmZXJlbmNlTWFwKCkpXG5cdFx0XHQudGhlbihfID0+IHRoaXMuX2dldFN0YXR1c0V2dFJlZmVyZW5jZU1hcCgpKVxuXHRcdFx0LnRoZW4oXyA9PiBnZXROZWlnaGJvcnMpXG5cdFx0XHQudGhlbihyZXQgPT4ge1xuXHRcdFx0XHRpZiAocmV0ID09IG51bGwgfHwgIUFycmF5LmlzQXJyYXkocmV0KSkge1xuXHRcdFx0XHRcdG1lc2hlZFJvYm90TmFtZXMgPSBbXVxuXHRcdFx0XHR9XG5cdFx0XHRcdGxldCBob3N0bmFtZSA9IHRoaXMuc2VsZWN0b3IuX2Nvbm5lY3Rpb24uX3NlbGZcblx0XHRcdFx0bWVzaGVkUm9ib3ROYW1lcyA9IHJldC5tYXAociA9PiByWzBdKSAvLyB3ZSBvbmx5IGtlZXAgdGhlIHJvYm90IG5hbWVzXG5cdFx0XHRcdGlmICghbWVzaGVkUm9ib3ROYW1lcy5pbmNsdWRlcyhob3N0bmFtZSkpIHtcblx0XHRcdFx0XHRtZXNoZWRSb2JvdE5hbWVzLnB1c2goaG9zdG5hbWUpIC8vIGFkZCBob3N0bmFtZSwgaS5lLiB0aGUgZGl5YS1zZXJ2ZXIsIHdoaWNoIGlzIG5vdCBpbiB0aGUgbGlzdCBvZiBuZWlnaGJvcnNcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC50aGVuKF8gPT4gZ2V0Um9ib3RzQW5kUGFydHMpXG5cdFx0XHQudGhlbihyZXQgPT4ge1xuXHRcdFx0XHRmb3IgKGxldCBvYmplY3RQYXRoIGluIHJldCkge1xuXHRcdFx0XHRcdC8vIHRoZSBvYmplY3Qgb2J0YWluZWQgZnJvbSB0aGUgb2JqZWN0IHBhdGhcblx0XHRcdFx0XHRsZXQgb2JqZWN0ID0gcmV0W29iamVjdFBhdGhdXG5cblx0XHRcdFx0XHQvLyBpZiB0aGUgcmV0dXJuIG9iamVjdCBpcyBvZiBhIHJvYm90IGluIHRoZSBsaXN0IG9mIG5laWdoYm9ycywgb3Igb2YgdGhlIGRpeWEtc2VydmVyLCByZXRyaWV2ZSBhbGwgb2ZpdHMgcmVsZXZhbnQgc3RhdHVzZXNcblx0XHRcdFx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KHJvYm90SWZhY2UpKSB7IC8vIHRoaXMgaXMgcm9ib3Qgb2JqZWN0XG5cdFx0XHRcdFx0XHRyb2JvdHMucHVzaChvYmplY3Rbcm9ib3RJZmFjZV0pXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gaWYgdGhlIHJldHVybiBvYmplY3QgaXMgb2YgYSBwYXJ0LCBsaXN0ZW4gdG8gc2lnbmFsIFN0YXR1c0NoYW5nZWQgb2YgdGhlIHBhcnRcblx0XHRcdFx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KHBhcnRJZmFjZSkpIHsgLy8gdGhpcyBpcyBhIHBhcnQgb2JqZWN0XG5cdFx0XHRcdFx0XHRsZXQgcGFydCA9IG9iamVjdFtwYXJ0SWZhY2VdXG5cdFx0XHRcdFx0XHRwYXJ0Lm9iamVjdFBhdGggPSBvYmplY3RQYXRoXG5cdFx0XHRcdFx0XHRwYXJ0LlJvYm90TmFtZSA9IG9iamVjdFBhdGguc3BsaXQoJy8nKVs1XSAvKiAvZnIvcGFydG5lcmluZy9TdGF0dXMvUm9ib3RzL0IxUjAwMDM3L1BhcnRzL3ZvY3QgKi9cblx0XHRcdFx0XHRcdHBhcnRzLnB1c2gocGFydClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRMb2dnZXIuZGVidWcoJ3JvYm90cycsIHJvYm90cylcblx0XHRcdFx0TG9nZ2VyLmRlYnVnKCdwYXJ0cycsIHBhcnRzKVxuXG5cdFx0XHRcdC8vIGZpbGVyIGFuZCBrZWVwIHRoZSBkaXlhLXNlcnZlciBhbmQgdGhlIHJvYm90cyB0aGF0IGFyZSBvbmx5IGluIHRoZSBzYW1lIG1lc2ggbmV0d29ya3Ncblx0XHRcdFx0cm9ib3RzID0gcm9ib3RzLmZpbHRlcihyb2JvdCA9PiBtZXNoZWRSb2JvdE5hbWVzLmluY2x1ZGVzKHJvYm90LlJvYm90TmFtZSkpIC8vIG9ubHkga2VlcHMgcm9ib3RzIHRoYXQgYXJlIG5laWdoYm9ycyAoaS5lLiBpbiB0aGUgc2FtZSBtZXNoIG5ldHdvcmspXG5cblx0XHRcdFx0Ly8gZmlsdGVyIHBhcnRzIHRoYXQgYmVsb25ncyB0byB0aGUgcm9ib3QgaW4gdGhlIG1lc2ggbmV0d29yayAoaW5jbHVkaW5nIHRoZSBkaXlhLXNlcnZlcilcblx0XHRcdFx0cGFydHMgPSBwYXJ0cy5maWx0ZXIocGFydCA9PiBtZXNoZWRSb2JvdE5hbWVzLmluY2x1ZGVzKHBhcnQuUm9ib3ROYW1lKSkgLy8gb25seSBrZWVwcyBwYXJ0cyBiZWxvbmdpbmcgdG8gbmVpZ2hib3JzIChpLmUuIGluIHRoZSBzYW1lIG1lc2ggbmV0d29yaylcblxuXHRcdFx0XHQvLyBjcmVhdGUgbWFwIG9mIHJvYm90IG5hbWUgdG8gaWQgZm9yIHNldHRpbmcgUm9ib3RJZCB0byBwYXRoc1xuXHRcdFx0XHRyb2JvdHMuZm9yRWFjaChyb2JvdCA9PiB7XG5cdFx0XHRcdFx0aWYgKHJvYm90TWFwLmhhcyhyb2JvdC5Sb2JvdE5hbWUpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cm9ib3RNYXAuc2V0KHJvYm90LlJvYm90TmFtZSwgcm9ib3QuUm9ib3RJZClcblx0XHRcdFx0fSlcblxuXHRcdFx0XHQvLyBzZXQgUm9ib3RJZCB0byBlYWNoIHBhcnRcblx0XHRcdFx0cGFydHMuZm9yRWFjaChwYXJ0ID0+IHtcblx0XHRcdFx0XHRwYXJ0LlJvYm90SWQgPSByb2JvdE1hcC5nZXQocGFydC5Sb2JvdE5hbWUpXG5cdFx0XHRcdH0pXG5cdFx0XHRcdFxuXHRcdFx0XHRMb2dnZXIuZGVidWcoJ21lc2hlZCByb2JvdHMnLCByb2JvdHMpXG5cdFx0XHRcdExvZ2dlci5kZWJ1ZygnbWVzaGVkIHBhcnRzJywgcGFydHMpXG5cdFx0XHR9KVxuXHRcdFx0Ly8gU2VuZGluZyBmaXhlZCBjaHVua3MgdG8gbGltaXQgcGF5bG9hZFxuXHRcdFx0LnRoZW4oXyA9PiB0aGlzLl9zdWJzY3JpYmVUb011bHRpZGF5U3RhdHVzVXBkYXRlKHJvYm90cywgY2FsbGJhY2spKSAvLyBSZXRyaWV2ZSBpbml0aWFsIHN0YXR1c2VzIGZyb20gdGhlIGZpbHRlcmVkIHJvYm90c1xuXHRcdFx0LnRoZW4oXyA9PiB0aGlzLl9zdWJzY3JpYmVUb1N0YXR1c0NoYW5nZWQocGFydHMsIGNhbGxiYWNrKSkgLy8gTGlzdGVuIHRvIFN0YXR1c0NoYW5nZSBmcm9tIHRoZSBwYXJ0cyBiZWxvbmdpbmcgdG8gdGhlIGZpbHRlcmVkIHJvYm90c1xuXHRcdFx0XG5cdFx0XHQvLyBPSyAtIGluIGNhc2Ugc2VuZGluZyBhIGxhcmdlIGNodW5rIGZvciBlYWNoIHJvYm90LCBwYXlsb2FkIGNhbiBiZSBsYXJnZVxuXHRcdFx0Ly8gLnRoZW4oXyA9PiB0aGlzLl9nZXRBbmRVcGRhdGVNdWx0aWRheVN0YXR1c2VzKHJvYm90cywgY2FsbGJhY2spKSAvLyBSZXRyaWV2ZSBpbml0aWFsIHN0YXR1c2VzIGZyb20gdGhlIGZpbHRlcmVkIHJvYm90c1xuXHRcdFx0Ly8gLnRoZW4oXyA9PiB0aGlzLl9zdWJzY3JpYmVUb1N0YXR1c0NoYW5nZWQocGFydHMsIGNhbGxiYWNrKSkgLy8gTGlzdGVuIHRvIFN0YXR1c0NoYW5nZSBmcm9tIHRoZSBwYXJ0cyBiZWxvbmdpbmcgdG8gdGhlIGZpbHRlcmVkIHJvYm90c1xuXG5cdFx0aWYgKHRydWUpIHJldHVyblxuXG5cdFx0Ly8gLy8gU3Vic2NyaWJlIHRvIHNpZ25hbHNcblxuXHRcdC8vIGxldCBzZW5kRGF0YSA9IFtdO1xuXHRcdC8vIGxldCByb2JvdElkcyA9IFtdO1xuXHRcdC8vIHJldHVybiBQcm9taXNlLnRyeShfID0+IHtcblx0XHQvLyBcdGxldCByZXEgPSB0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdC8vIFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHQvLyBcdFx0ZnVuYzogJ0dldE1hbmFnZWRPYmplY3RzJyxcblx0XHQvLyBcdFx0b2JqOiB7XG5cdFx0Ly8gXHRcdFx0aW50ZXJmYWNlOiAnb3JnLmZyZWVkZXNrdG9wLkRCdXMuT2JqZWN0TWFuYWdlcicsXG5cdFx0Ly8gXHRcdH1cblx0XHQvLyBcdH0sIChwZWVySWQsIGVyciwgb2JqRGF0YSkgPT4geyAvLyBnZXQgYWxsIG9iamVjdCBwYXRocywgaW50ZXJmYWNlcyBhbmQgcHJvcGVydGllcyBjaGlsZHJlbiBvZiBTdGF0dXNcblx0XHQvLyBcdFx0bGV0IHJvYm90TmFtZSA9ICcnO1xuXHRcdC8vIFx0XHRsZXQgcm9ib3RJZCA9IDE7XG5cblx0XHQvLyBcdFx0TG9nZ2VyLmRlYnVnKGBTdGF0dXMuR2V0TWFuYWdlZE9iamVjdHM6IG9iakRhdGEgPSBgKVxuXHRcdC8vIFx0XHRMb2dnZXIuZGVidWcob2JqRGF0YSlcblxuXHRcdC8vIFx0XHRmb3IgKGxldCBvYmplY3RQYXRoIGluIG9iakRhdGEpIHtcblx0XHQvLyBcdFx0XHRpZiAob2JqRGF0YVtvYmplY3RQYXRoXVsnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXSAhPSBudWxsKSB7XG5cdFx0Ly8gXHRcdFx0XHRyb2JvdE5hbWUgPSBvYmpEYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90TmFtZTtcblx0XHQvLyBcdFx0XHRcdHJvYm90SWQgPSBvYmpEYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90SWQ7XG5cdFx0Ly8gXHRcdFx0XHRyb2JvdElkc1tyb2JvdE5hbWVdID0gcm9ib3RJZDtcblx0XHQvLyBcdFx0XHRcdHRoaXMuX2dldEluaXRpYWxTdGF0dXMocm9ib3RJZCwgcm9ib3ROYW1lLCBmdW5jdGlvbiAobW9kZWwpIHtcblx0XHQvLyBcdFx0XHRcdFx0Y2FsbGJhY2sobW9kZWwsIHBlZXJJZCk7XG5cdFx0Ly8gXHRcdFx0XHR9KVxuXHRcdC8vIFx0XHRcdH1cblx0XHQvLyBcdFx0XHRpZiAob2JqRGF0YVtvYmplY3RQYXRoXVsnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCddICE9IG51bGwpIHtcblx0XHQvLyBcdFx0XHRcdGxldCBzdWJzID0gdGhpcy5zZWxlY3Rvci5zdWJzY3JpYmUoey8vIHN1YnNjcmliZXMgdG8gc3RhdHVzIGNoYW5nZXMgZm9yIGFsbCBwYXJ0c1xuXHRcdC8vIFx0XHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHQvLyBcdFx0XHRcdFx0ZnVuYzogJ1N0YXR1c0NoYW5nZWQnLFxuXHRcdC8vIFx0XHRcdFx0XHRvYmo6IHtcblx0XHQvLyBcdFx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0XHQvLyBcdFx0XHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoXG5cdFx0Ly8gXHRcdFx0XHRcdH0sXG5cdFx0Ly8gXHRcdFx0XHRcdGRhdGE6IHJvYm90TmFtZXNcblx0XHQvLyBcdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdC8vIFx0XHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHQvLyBcdFx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJTdGF0dXNTdWJzY3JpYmU6XCIgKyBlcnIpO1xuXHRcdC8vIFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdC8vIFx0XHRcdFx0XHRcdExvZ2dlci5kZWJ1ZyhgU3RhdHVzQ2hhbmdlZCBpcyBjYWxsZWRgKVxuXHRcdC8vIFx0XHRcdFx0XHRcdHNlbmREYXRhWzBdID0gZGF0YTtcblx0XHQvLyBcdFx0XHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdC8vIFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHQvLyBcdFx0XHRcdFx0XHRcdGNhbGxiYWNrKHRoaXMucm9ib3RNb2RlbCwgcGVlcklkKTtcblx0XHQvLyBcdFx0XHRcdFx0XHR9XG5cdFx0Ly8gXHRcdFx0XHRcdH1cblx0XHQvLyBcdFx0XHRcdH0pO1xuXHRcdC8vIFx0XHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zLnB1c2goc3Vicyk7XG5cdFx0Ly8gXHRcdFx0fVxuXHRcdC8vIFx0XHR9XG5cdFx0Ly8gXHR9KVxuXHRcdC8vIH0pLmNhdGNoKGVyciA9PiB7XG5cdFx0Ly8gXHRMb2dnZXIuZXJyb3IoZXJyKTtcblx0XHQvLyB9KVxuXG5cdH07XG5cblx0LyoqXG5cdCAqIENsb3NlIGFsbCBzdWJzY3JpcHRpb25zXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmNsb3NlU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uKCl7XG5cdFx0Zm9yKHZhciBpIGluIHRoaXMuc3Vic2NyaXB0aW9ucykge1xuXHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zW2ldLmNsb3NlKCk7XG5cdFx0fVxuXHRcdHRoaXMuc3Vic2NyaXB0aW9ucyA9W107XG5cdFx0dGhpcy5yb2JvdE1vZGVsID0gW107XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldCBkYXRhIGdpdmVuIGRhdGFDb25maWcuXG5cdCAqIEBwYXJhbSB7ZnVuY30gY2FsbGJhY2sgOiBjYWxsZWQgYWZ0ZXIgdXBkYXRlXG5cdCAqIFRPRE8gVVNFIFBST01JU0Vcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuZ2V0RGF0YSA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBkYXRhQ29uZmlnKXtcblx0XHR2YXIgZGF0YU1vZGVsID0ge307XG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KF8gPT4ge1xuXHRcdFx0aWYoZGF0YUNvbmZpZyAhPSBudWxsKVxuXHRcdFx0XHR0aGlzLkRhdGFDb25maWcoZGF0YUNvbmZpZyk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcIlJlcXVlc3Q6IFwiK0pTT04uc3RyaW5naWZ5KGRhdGFDb25maWcpKTtcblx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRcdGZ1bmM6IFwiRGF0YVJlcXVlc3RcIixcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdHR5cGU6XCJzcGxSZXFcIixcblx0XHRcdFx0XHRkYXRhQ29uZmlnOiB0aGlzLmRhdGFDb25maWdcblx0XHRcdFx0fVxuXHRcdFx0fSwgKGRuSWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJbXCIgKyB0aGlzLmRhdGFDb25maWcuc2Vuc29ycyArIFwiXSBSZWN2IGVycjogXCIgKyBKU09OLnN0cmluZ2lmeShlcnIpKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoZGF0YS5oZWFkZXIuZXJyb3IgIT0gbnVsbCkge1xuXHRcdFx0XHRcdC8vIFRPRE8gOiBjaGVjay91c2UgZXJyIHN0YXR1cyBhbmQgYWRhcHQgYmVoYXZpb3IgYWNjb3JkaW5nbHlcblx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJVcGRhdGVEYXRhOlxcblwiK0pTT04uc3RyaW5naWZ5KGRhdGEuaGVhZGVyLnJlcUNvbmZpZykpO1xuXHRcdFx0XHRcdExvZ2dlci5lcnJvcihcIkRhdGEgcmVxdWVzdCBmYWlsZWQgKFwiK2RhdGEuaGVhZGVyLmVycm9yLnN0K1wiKTogXCIrZGF0YS5oZWFkZXIuZXJyb3IubXNnKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly9Mb2dnZXIubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuZGF0YU1vZGVsKSk7XG5cdFx0XHRcdGRhdGFNb2RlbCA9IHRoaXMuX2dldERhdGFNb2RlbEZyb21SZWN2KGRhdGEpO1xuXG5cdFx0XHRcdExvZ2dlci5sb2codGhpcy5nZXREYXRhTW9kZWwoKSk7XG5cdFx0XHRcdGNhbGxiYWNrID0gY2FsbGJhY2suYmluZCh0aGlzKTsgLy8gYmluZCBjYWxsYmFjayB3aXRoIFN0YXR1c1xuXHRcdFx0XHRjYWxsYmFjayhkYXRhTW9kZWwpOyAvLyBjYWxsYmFjayBmdW5jXG5cdFx0XHR9KTtcblx0XHR9KS5jYXRjaChlcnIgPT4ge1xuXHRcdFx0TG9nZ2VyLmVycm9yKGVycilcblx0XHR9KVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZXN0b3JlIHppcHBlZCBkYXRhIGZyb20gc2lnbmFsIE11bHRpZGF5U3RhdHVzVXBkYXRlZCB0byBhIGNvbXBsaWFudCBzdGF0ZSBmb3IgdXNlIGluIGZ1bmN0aW9uIHtAbGluayBfZ2V0Um9ib3RNb2RlbEZyb21SZWN2Mn1cblx0ICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSB6aXBwZWQgZGF0YSByZWNlaXZlZCBmcm9tIHNpZ25hbCBNdWx0aWRheVN0YXR1c1VwZGF0ZWQsIHRoaXMgZGF0YSBpcyBjb21wcmVzc2VkIHRvIHJlZHVjZSBtZW1vcnkgZm9vdHByaW50XG5cdCAqIHQuREJVU19ESUNUIChcblx0ICpcdFx0dC5EQlVTX1NUUklORywgICAgIC8vIHJvYm90IGluZm8gaS5lLiA0OkQxUjAwMDM1XG5cdCAqXHRcdHQuREJVU19ESUNUIChcblx0ICpcdFx0XHR0LkRCVVNfU1RSSU5HLCAvLyBwYXJ0SWRcblx0ICpcdFx0XHR0LkRCVVNfQVJSQVkgKHQuREJVU19TVFJVQ1QodC5EQlVTX1VJTlQ2NCwgdC5EQlVTX1VJTlQxNiwgdC5EQlVTX1VJTlQzMikpXG5cdCAqICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRpbWUsIGNvZGUsIGhhc2hcblx0ICpcdFx0KVxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IGV4dHJhY3RlZCBkYXRhIGluIGZvcm0gb2YgbWFwIG9mICdyb2JvdElkOnJvYm90TmFtZScgdG8gYXJyYXkgb2YgW1BhcnRJZCwgQ2F0ZWdvcnksIFBhcnROYW1lLCBMYWJlbCwgVGltZSwgQ29kZSwgQ29kZVJlZiwgTXNnLCBDcml0TGV2ZWwsIERlc2NyaXB0aW9uXVxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5fdW5wYWNrUm9ib3RNb2RlbHMgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0aWYgKGRhdGEgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdC8vIFRoZXNlIHR3byByZWZlcmVuY2UgbWFwIHNob3VsZCBoYXZlIGJlZW4gcmV0cmlldmVkIGF0IGluaXRpYWwgY29ubmVjdGlvblxuXHRcdGlmICh0aGlzLl9wYXJ0UmVmZXJlbmNlTWFwID09IG51bGwpIHtcblx0XHRcdHRoaXMuX3BhcnRSZWZlcmVuY2VNYXAgPSBbXVxuXHRcdH1cblx0XHRpZiAodGhpcy5fc3RhdHVzRXZ0UmVmZXJlbmNlTWFwID09IG51bGwpIHtcblx0XHRcdHRoaXMuX3N0YXR1c0V2dFJlZmVyZW5jZU1hcCA9IFtdXG5cdFx0fVxuXHRcdC8vIEJlZ2luIHRvIHVucGFjayBkYXRhXG5cdFx0bGV0IHJvYm90VG9TdGF0dXNNYXAgPSBuZXcgTWFwKClcblx0XHRmb3IgKGxldCByb2JvdCBpbiBkYXRhKSB7IC8vIGkuZS4gNDpEMVIwMDAzNVxuXHRcdFx0Zm9yIChsZXQgcGFydElkIGluIGRhdGFbcm9ib3RdKSB7XG5cdFx0XHRcdGxldCBzdWJTdGF0dXNlcyA9IGRhdGFbcm9ib3RdW3BhcnRJZF0gLy8gYW4gYXJyYXkgb2YgW3RpbWUsIGNvZGUsIGhhc2hdXG5cdFx0XHRcdGlmICghQXJyYXkuaXNBcnJheShzdWJTdGF0dXNlcykpIHsgLy8gZXJyb25lb3VzIGRhdGFcblx0XHRcdFx0XHRjb250aW51ZVxuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIGV4dHJhY3QgcGFydC1yZWxhdGVkIGluZm9ybWF0aW9uIGZyb20gcHJlLXJldHJpZXZlZCBtYXBcblx0XHRcdFx0bGV0IHBhcnRSZWZlcmVuY2UgPSB0aGlzLl9wYXJ0UmVmZXJlbmNlTWFwW3BhcnRJZF07XG5cdFx0XHRcdGlmIChwYXJ0UmVmZXJlbmNlID09IG51bGwpIHtcblx0XHRcdFx0XHRMb2dnZXIud2FybihgUGFydFJlZmVyZW5jZSBmaW5kcyBubyBtYXAgZm9yIHBhcnRJZCAke3BhcnRJZH1gKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGxldCBwYXJ0TmFtZSA9IHBhcnRSZWZlcmVuY2UgPT0gbnVsbCA/IG51bGwgOiBwYXJ0UmVmZXJlbmNlWzBdO1xuXHRcdFx0XHRsZXQgbGFiZWwgPSBwYXJ0UmVmZXJlbmNlID09IG51bGwgPyBudWxsIDogcGFydFJlZmVyZW5jZVsxXTtcblx0XHRcdFx0bGV0IGNhdGVnb3J5ID0gcGFydFJlZmVyZW5jZSA9PSBudWxsID8gbnVsbCA6IHBhcnRSZWZlcmVuY2VbMl07XG5cblx0XHRcdFx0c3ViU3RhdHVzZXMuZm9yRWFjaChzdWJTdGF0dXMgPT4ge1xuXHRcdFx0XHRcdGxldCB0aW1lID0gc3ViU3RhdHVzWzBdXG5cdFx0XHRcdFx0bGV0IGNvZGUgPSBzdWJTdGF0dXNbMV1cblxuXHRcdFx0XHRcdC8vIG1hcCB0aGUgaGFzaCB2YWx1ZSB0byB0aGUgc3RhdHVzIGV2ZW50IHZhbHVlc1xuXHRcdFx0XHRcdGxldCBoYXNoID0gc3ViU3RhdHVzWzJdXG5cdFx0XHRcdFx0bGV0IHN0YXR1c0V2dFJlZmVyZW5jZSA9IHRoaXMuX3N0YXR1c0V2dFJlZmVyZW5jZU1hcFtoYXNoXVxuXHRcdFx0XHRcdGlmIChzdGF0dXNFdnRSZWZlcmVuY2UgPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0TG9nZ2VyLndhcm4oYFN0YXR1c0V2dFJlZmVyZW5jZSBmaW5kcyBubyBtYXAgZm9yIGhhc2gga2V5ICR7aGFzaH1gKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRsZXQgY29kZVJlZiA9IHN0YXR1c0V2dFJlZmVyZW5jZSA9PSBudWxsID8gbnVsbCA6IHN0YXR1c0V2dFJlZmVyZW5jZVswXTtcblx0XHRcdFx0XHRsZXQgbXNnID0gc3RhdHVzRXZ0UmVmZXJlbmNlID09IG51bGwgPyBudWxsIDogc3RhdHVzRXZ0UmVmZXJlbmNlWzFdO1xuXHRcdFx0XHRcdGxldCBjcml0TGV2ZWwgPSBzdGF0dXNFdnRSZWZlcmVuY2UgPT0gbnVsbCA/IG51bGwgOiBzdGF0dXNFdnRSZWZlcmVuY2VbMl07XG5cblx0XHRcdFx0XHQvLyBjb25zdHJ1Y3QgZnVsbCBpbmZvcm1hdGlvbiBmb3IgZWFjaCBzdGF0dXNcblx0XHRcdFx0XHRsZXQgc3RhdHVzID0gW3BhcnRJZCwgY2F0ZWdvcnksIHBhcnROYW1lLCBsYWJlbCwgdGltZSwgY29kZSwgY29kZVJlZiwgbXNnLCBjcml0TGV2ZWwsICcnXVxuXHRcdFx0XHRcdGlmICghcm9ib3RUb1N0YXR1c01hcC5oYXMocm9ib3QpKSB7XG5cdFx0XHRcdFx0XHRyb2JvdFRvU3RhdHVzTWFwLnNldChyb2JvdCwgW10pXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJvYm90VG9TdGF0dXNNYXAuZ2V0KHJvYm90KS5wdXNoKHN0YXR1cyk7XG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0fVxuXHRcdExvZ2dlci5kZWJ1ZyhgRXh0cmFjdGVkICR7cm9ib3RUb1N0YXR1c01hcC5sZW5ndGh9IHN0YXR1c2VzYClcblx0XHRyZXR1cm4gcm9ib3RUb1N0YXR1c01hcFxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZSBpbnRlcm5hbCByb2JvdCBtb2RlbCB3aXRoIHJlY2VpdmVkIGRhdGEgKHZlcnNpb24gMilcblx0ICogQHBhcmFtICB7T2JqZWN0fSBkYXRhIGRhdGEgcmVjZWl2ZWQgZnJvbSBEaXlhTm9kZSBieSB3ZWJzb2NrZXRcblx0ICogQHJldHVybiB7W3R5cGVdfVx0XHRbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyID0gZnVuY3Rpb24oZGF0YSwgcm9ib3RJZCwgcm9ib3ROYW1lKSB7XG5cdFx0aWYodGhpcy5yb2JvdE1vZGVsID09IG51bGwpXG5cdFx0XHR0aGlzLnJvYm90TW9kZWwgPSBbXTtcblxuXHRcdGlmKHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSAhPSBudWxsKVxuXHRcdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdLnBhcnRzID0ge307IC8vIHJlc2V0IHBhcnRzXG5cblx0XHRpZih0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0gPT0gbnVsbClcblx0XHRcdHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSA9IHt9O1xuXG5cdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdID0ge1xuXHRcdFx0cm9ib3Q6IHtcblx0XHRcdFx0bmFtZTogcm9ib3ROYW1lXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKiBleHRyYWN0IHBhcnRzIGluZm8gKiovXG5cdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdLnBhcnRzID0ge307XG5cdFx0bGV0IHJQYXJ0cyA9IHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXS5wYXJ0cztcblxuXHRcdGRhdGEuZm9yRWFjaChkID0+IHtcblx0XHRcdGxldCBwYXJ0SWQgPSBkWzBdO1xuXHRcdFx0bGV0IGNhdGVnb3J5ID0gZFsxXTtcblx0XHRcdGxldCBwYXJ0TmFtZSA9IGRbMl07XG5cdFx0XHRsZXQgbGFiZWwgPSBkWzNdO1xuXHRcdFx0bGV0IHRpbWUgPSBkWzRdO1xuXHRcdFx0bGV0IGNvZGUgPSBkWzVdO1xuXHRcdFx0bGV0IGNvZGVSZWYgPSBkWzZdO1xuXHRcdFx0bGV0IG1zZyA9IGRbN107XG5cdFx0XHRsZXQgY3JpdExldmVsID0gZFs4XTtcblx0XHRcdGxldCBkZXNjcmlwdGlvbiA9IGRbOV07XG5cblx0XHRcdGlmIChyUGFydHNbcGFydElkXSA9PSBudWxsKSB7XG5cdFx0XHRcdHJQYXJ0c1twYXJ0SWRdID0ge307XG5cdFx0XHR9XG5cdFx0XHQvKiB1cGRhdGUgcGFydCBjYXRlZ29yeSAqL1xuXHRcdFx0clBhcnRzW3BhcnRJZF0uY2F0ZWdvcnkgPSBjYXRlZ29yeTtcblx0XHRcdC8qIHVwZGF0ZSBwYXJ0IG5hbWUgKi9cblx0XHRcdHJQYXJ0c1twYXJ0SWRdLm5hbWUgPSBwYXJ0TmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0LyogdXBkYXRlIHBhcnQgbGFiZWwgKi9cblx0XHRcdHJQYXJ0c1twYXJ0SWRdLmxhYmVsID0gbGFiZWw7XG5cblx0XHRcdC8qIHVwZGF0ZSBlcnJvciAqL1xuXHRcdFx0LyoqIHVwZGF0ZSBlcnJvckxpc3QgKiovXG5cdFx0XHRpZiAoclBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0ID09IG51bGwpXG5cdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdCA9IHt9O1xuXG5cdFx0XHRpZiAoclBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0W2NvZGVSZWZdID09IG51bGwpXG5cdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmVycm9yTGlzdFtjb2RlUmVmXSA9IHtcblx0XHRcdFx0XHRtc2c6IG1zZyxcblx0XHRcdFx0XHRjcml0TGV2ZWw6IGNyaXRMZXZlbCxcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cblx0XHRcdFx0fTtcblx0XHRcdGxldCBldnRzX3RtcCA9IHtcblx0XHRcdFx0dGltZTogdGhpcy5fY29kZXIuZnJvbSh0aW1lKSxcblx0XHRcdFx0Y29kZTogdGhpcy5fY29kZXIuZnJvbShjb2RlKSxcblx0XHRcdFx0Y29kZVJlZjogdGhpcy5fY29kZXIuZnJvbShjb2RlUmVmKVxuXHRcdFx0fTtcblx0XHRcdC8qKiBpZiByZWNlaXZlZCBsaXN0IG9mIGV2ZW50cyAqKi9cblx0XHRcdGlmIChBcnJheS5pc0FycmF5KGV2dHNfdG1wLmNvZGUpIHx8IEFycmF5LmlzQXJyYXkoZXZ0c190bXAudGltZSlcblx0XHRcdFx0fHwgQXJyYXkuaXNBcnJheShldnRzX3RtcC5jb2RlUmVmKSkge1xuXHRcdFx0XHRpZiAoZXZ0c190bXAuY29kZS5sZW5ndGggPT09IGV2dHNfdG1wLmNvZGVSZWYubGVuZ3RoXG5cdFx0XHRcdFx0JiYgZXZ0c190bXAuY29kZS5sZW5ndGggPT09IGV2dHNfdG1wLnRpbWUubGVuZ3RoKSB7XG5cdFx0XHRcdFx0LyoqIGJ1aWxkIGxpc3Qgb2YgZXZlbnRzICoqL1xuXHRcdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmV2dHMgPSBbXTtcblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGV2dHNfdG1wLmNvZGUubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmV2dHMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdHRpbWU6IGV2dHNfdG1wLnRpbWVbaV0sXG5cdFx0XHRcdFx0XHRcdGNvZGU6IGV2dHNfdG1wLmNvZGVbaV0sXG5cdFx0XHRcdFx0XHRcdGNvZGVSZWY6IGV2dHNfdG1wLmNvZGVSZWZbaV1cblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIExvZ2dlci5lcnJvcihcIlN0YXR1czpJbmNvbnNpc3RhbnQgbGVuZ3RocyBvZiBidWZmZXJzICh0aW1lL2NvZGUvY29kZVJlZilcIik7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHsgLyoqIGp1c3QgaW4gY2FzZSwgdG8gcHJvdmlkZSBiYWNrd2FyZCBjb21wYXRpYmlsaXR5ICoqL1xuXHRcdFx0XHQvKiogc2V0IHJlY2VpdmVkIGV2ZW50ICoqL1xuXHRcdFx0XHRyUGFydHNbcGFydElkXS5ldnRzID0gW3tcblx0XHRcdFx0XHR0aW1lOiBldnRzX3RtcC50aW1lLFxuXHRcdFx0XHRcdGNvZGU6IGV2dHNfdG1wLmNvZGUsXG5cdFx0XHRcdFx0Y29kZVJlZjogZXZ0c190bXAuY29kZVJlZlxuXHRcdFx0XHR9XTtcblx0XHRcdH1cblx0XHR9KVxuXHR9O1xuXG5cdC8qKiBjcmVhdGUgU3RhdHVzIHNlcnZpY2UgKiovXG5cdERpeWFTZWxlY3Rvci5wcm90b3R5cGUuU3RhdHVzID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gbmV3IFN0YXR1cyh0aGlzKTtcblx0fTtcblxuXHQvKipcblx0ICogU2V0IG9uIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGZpbmQgc3RhdHVzIHRvIG1vZGlmeVxuXHQgKiBAcGFyYW0gcGFydE5hbWUgXHR0byBmaW5kIHN0YXR1cyB0byBtb2RpZnlcblx0ICogQHBhcmFtIGNvZGVcdFx0bmV3Q29kZVxuXHQgKiBAcGFyYW0gc291cmNlXHRcdHNvdXJjZVxuXHQgKiBAcGFyYW0gY2FsbGJhY2tcdFx0cmV0dXJuIGNhbGxiYWNrICg8Ym9vbD5zdWNjZXNzKVxuXHQgKi9cblx0RGl5YVNlbGVjdG9yLnByb3RvdHlwZS5zZXRTdGF0dXMgPSBmdW5jdGlvbiAocm9ib3ROYW1lLCBwYXJ0TmFtZSwgY29kZSwgc291cmNlLCBjYWxsYmFjaykge1xuXHRcdHJldHVybiBQcm9taXNlLnRyeShfID0+IHtcblx0XHRcdHZhciBvYmplY3RQYXRoID0gXCIvZnIvcGFydG5lcmluZy9TdGF0dXMvUm9ib3RzL1wiICsgdGhpcy5zcGxpdEFuZENhbWVsQ2FzZShyb2JvdE5hbWUsIFwiLVwiKSArIFwiL1BhcnRzL1wiICsgcGFydE5hbWU7XG5cdFx0XHR0aGlzLnJlcXVlc3Qoe1xuXHRcdFx0XHRzZXJ2aWNlOiBcInN0YXR1c1wiLFxuXHRcdFx0XHRmdW5jOiBcIlNldFBhcnRcIixcblx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0aW50ZXJmYWNlOiAnZnIucGFydG5lcmluZy5TdGF0dXMuUGFydCcsXG5cdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0Ly9yb2JvdE5hbWU6IHJvYm90TmFtZSxcblx0XHRcdFx0XHRjb2RlOiBjb2RlLFxuXHRcdFx0XHRcdC8vcGFydE5hbWU6IHBhcnROYW1lLFxuXHRcdFx0XHRcdHNvdXJjZTogc291cmNlIHwgMVxuXHRcdFx0XHR9XG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soZmFsc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKHRydWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KS5jYXRjaChlcnIgPT4ge1xuXHRcdFx0TG9nZ2VyLmVycm9yKGVycilcblx0XHR9KVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXQgb25lIHN0YXR1c1xuXHQgKiBAcGFyYW0gcm9ib3ROYW1lIHRvIGdldCBzdGF0dXNcblx0ICogQHBhcmFtIHBhcnROYW1lIFx0dG8gZ2V0IHN0YXR1c1xuXHQgKiBAcGFyYW0gY2FsbGJhY2tcdFx0cmV0dXJuIGNhbGxiYWNrKC0xIGlmIG5vdCBmb3VuZC9kYXRhIG90aGVyd2lzZSlcblx0ICogQHBhcmFtIF9mdWxsIFx0bW9yZSBkYXRhIGFib3V0IHN0YXR1c1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5nZXRTdGF0dXMgPSBmdW5jdGlvbiAocm9ib3ROYW1lLCBwYXJ0TmFtZSwgY2FsbGJhY2svKiwgX2Z1bGwqLykge1xuXHRcdGxldCBzZW5kRGF0YSA9IFtdXG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KF8gPT4ge1xuXHRcdFx0bGV0IHJlcSA9IHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdvcmcuZnJlZWRlc2t0b3AuREJ1cy5PYmplY3RNYW5hZ2VyJyxcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBvYmpEYXRhKSA9PiB7XG5cblx0XHRcdFx0bGV0IG9iamVjdFBhdGhSb2JvdCA9IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9cIiArIHRoaXMuc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIik7XG5cdFx0XHRcdGxldCBvYmplY3RQYXRoUGFydCA9IFwiL2ZyL3BhcnRuZXJpbmcvU3RhdHVzL1JvYm90cy9cIiArIHRoaXMuc3BsaXRBbmRDYW1lbENhc2Uocm9ib3ROYW1lLCBcIi1cIikgKyBcIi9QYXJ0cy9cIiArIHBhcnROYW1lO1xuXHRcdFx0XHRsZXQgcm9ib3RJZCA9IG9iakRhdGFbb2JqZWN0UGF0aFJvYm90XVsnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXS5Sb2JvdElkXG5cdFx0XHRcdHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdFx0XHRmdW5jOiBcIkdldFBhcnRcIixcblx0XHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlBhcnQnLFxuXHRcdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFBhcnRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdHNlbmREYXRhLnB1c2goZGF0YSlcblx0XHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soLTEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKHRoaXMucm9ib3RNb2RlbCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0fSkuY2F0Y2goZXJyID0+IHtcblx0XHRcdExvZ2dlci5lcnJvcihlcnIpXG5cdFx0fSlcblx0fTtcblxuXHRTdGF0dXMucHJvdG90eXBlLnNwbGl0QW5kQ2FtZWxDYXNlID0gZnVuY3Rpb24gKGluU3RyaW5nLCBkZWxpbWl0ZXIpIHtcblx0XHRsZXQgYXJyYXlTcGxpdFN0cmluZyA9IGluU3RyaW5nLnNwbGl0KGRlbGltaXRlcik7XG5cdFx0bGV0IG91dENhbWVsU3RyaW5nID0gJyc7XG5cdFx0YXJyYXlTcGxpdFN0cmluZy5mb3JFYWNoKHN0ciA9PiB7XG5cdFx0XHRvdXRDYW1lbFN0cmluZyArPSBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc3Vic3RyaW5nKDEpO1xuXHRcdH0pXG5cdFx0cmV0dXJuIG91dENhbWVsU3RyaW5nO1xuXHR9XG5cbn0pKClcbiJdfQ==
