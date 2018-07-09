(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./support/isBuffer":3,"_process":2,"inherits":1}],5:[function(require,module,exports){
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

		this.selector.setMaxListeners(0);
		this.selector._connection.setMaxListeners(0);
		var sendData = [];
		var robotIds = [];
		return Promise.try(function (_) {
			var req = _this.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager'
				}
			}, function (peerId, err, objData) {
				// get all object paths, interfaces and properties children of Status
				if (err != null) {
					Logger.error(err);
				} else {
					(function () {
						var robotName = '';
						var robotId = 1;
						for (var objectPath in objData) {
							if (objData[objectPath]['fr.partnering.Status.Robot'] != null) {
								robotName = objData[objectPath]['fr.partnering.Status.Robot'].RobotName;
								robotId = objData[objectPath]['fr.partnering.Status.Robot'].RobotId;
								robotIds[robotName] = robotId;
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
										_this._getRobotModelFromRecv2(sendData, robotId, robotName);
										if (typeof callback === 'function') {
											callback(_this.robotModel, peerId);
										}
									}
								});
								_this.subscriptions.push(subs);
							}
						}
					})();
				}
			});
		}).catch(function (err) {
			Logger.error(err);
		});
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
		var _this2 = this;

		var dataModel = {};
		return Promise.try(function (_) {
			if (dataConfig != null) _this2.DataConfig(dataConfig);
			// console.log("Request: "+JSON.stringify(dataConfig));
			_this2.selector.request({
				service: "status",
				func: "DataRequest",
				data: {
					type: "splReq",
					dataConfig: _this2.dataConfig
				}
			}, function (dnId, err, data) {
				if (err != null) {
					Logger.error("[" + _this2.dataConfig.sensors + "] Recv err: " + JSON.stringify(err));
					return;
				}
				if (data.header.error != null) {
					// TODO : check/use err status and adapt behavior accordingly
					Logger.error("UpdateData:\n" + JSON.stringify(data.header.reqConfig));
					Logger.error("Data request failed (" + data.header.error.st + "): " + data.header.error.msg);
					return;
				}
				//Logger.log(JSON.stringify(this.dataModel));
				dataModel = _this2._getDataModelFromRecv(data);

				Logger.log(_this2.getDataModel());
				callback = callback.bind(_this2); // bind callback with Status
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
		var _this5 = this;

		var sendData = [];
		return Promise.try(function (_) {
			var req = _this5.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager'
				}
			}, function (peerId, err, objData) {
				if (err != null) {
					Logger.error(err);
				} else {

					var objectPathRobot = "/fr/partnering/Status/Robots/" + _this5.splitAndCamelCase(robotName, "-");
					var objectPathPart = "/fr/partnering/Status/Robots/" + _this5.splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
					var robotId = objData[objectPathRobot]['fr.partnering.Status.Robot'].RobotId;
					_this5.selector.request({
						service: "status",
						func: "GetPart",
						obj: {
							interface: 'fr.partnering.Status.Part',
							path: objectPathPart
						}
					}, function (peerId, err, data) {
						if (err != null) {
							Logger.error(err);
						} else {
							sendData.push(data);
							_this5._getRobotModelFromRecv2(sendData, robotId, robotName);
							if (err != null) {
								if (typeof callback === 'function') callback(-1);
							} else {
								if (typeof callback === 'function') callback(_this5.robotModel);
							}
						}
					});
				}
			});
		}).catch(function (err) {
			Logger.error(err);
		});
	};

	/**
  * Get all status
  * @param robotName to get status
  * @param partName 	to get status
  * @param callback		return callback(-1 if not found/data otherwise)
  * @param _full 	more data about status
  */
	Status.prototype.getAllStatuses = function (robotName, callback) {
		var _this6 = this;

		var req = this.selector.request({
			service: 'status',
			func: 'GetManagedObjects',
			obj: {
				interface: 'org.freedesktop.DBus.ObjectManager'
			}
		}, function (peerId, err, objData) {
			// get all object paths, interfaces and properties children of Status
			if (err != null || objData === null) {
				Logger.error(err);
			} else {
				var objectPath = "/fr/partnering/Status/Robots/" + _this6.splitAndCamelCase(robotName, "-");
				if (objData[objectPath] != null) {
					if (objData[objectPath]['fr.partnering.Status.Robot'] != null) {
						var robotId = objData[objectPath]['fr.partnering.Status.Robot'].RobotId;
						//var full = _full || false;
						_this6.selector.request({
							service: "status",
							func: "GetAllParts",
							obj: {
								interface: 'fr.partnering.Status.Robot',
								path: objectPath
							}
						}, function (peerId, err, data) {
							if (err != null) {
								if (typeof callback === 'function') callback(-1);
								Logger.error(err);
							} else {
								_this6._getRobotModelFromRecv2(data, robotId, robotName);
								if (typeof callback === 'function') callback(_this6.robotModel);
							}
						});
					} else {
						Logger.error("Interface fr.partnering.Status.Robot doesn't exist!");
					}
				} else {
					Logger.error("ObjectPath " + objectPath + " doesn't exist!");
				}
			}
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJzcmMvc3RhdHVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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LENBQXNCO0FBQ3JCLGdCQUFTLFFBRFk7QUFFckIsYUFBTSxhQUZlO0FBR3JCLFlBQUs7QUFDSixtQkFBVyw0QkFEUDtBQUVKLGNBQU07QUFGRjtBQUhnQixPQUF0QixFQU9HLFVBQUMsTUFBRCxFQUFTLEdBQVQsRUFBYyxJQUFkLEVBQXVCO0FBQ3pCLFdBQUksT0FBTyxJQUFYLEVBQWlCO0FBQ2hCLFlBQUksT0FBTyxRQUFQLEtBQW9CLFVBQXhCLEVBQW9DLFNBQVMsQ0FBQyxDQUFWO0FBQ3BDLGVBQU8sS0FBUCxDQUFhLEdBQWI7QUFDQSxRQUhELE1BSUs7QUFDSixlQUFLLHVCQUFMLENBQTZCLElBQTdCLEVBQW1DLE9BQW5DLEVBQTRDLFNBQTVDO0FBQ0EsWUFBSSxPQUFPLFFBQVAsS0FBb0IsVUFBeEIsRUFBb0MsU0FBUyxPQUFLLFVBQWQ7QUFDcEM7QUFDRCxPQWhCRDtBQWlCQSxNQXBCRCxNQW9CTztBQUNOLGFBQU8sS0FBUCxDQUFhLHFEQUFiO0FBQ0E7QUFDRCxLQXhCRCxNQXdCTztBQUNOLFlBQU8sS0FBUCxDQUFhLGdCQUFnQixVQUFoQixHQUE2QixpQkFBMUM7QUFDQTtBQUNEO0FBQ0QsR0F4Q1MsQ0FBVjtBQXlDQSxFQTFDRDs7QUE0Q0EsUUFBTyxTQUFQLENBQWlCLGlCQUFqQixHQUFxQyxVQUFVLFFBQVYsRUFBb0IsU0FBcEIsRUFBK0I7QUFDbkUsTUFBSSxtQkFBbUIsU0FBUyxLQUFULENBQWUsU0FBZixDQUF2QjtBQUNBLE1BQUksaUJBQWlCLEVBQXJCO0FBQ0EsbUJBQWlCLE9BQWpCLENBQXlCLGVBQU87QUFDL0IscUJBQWtCLElBQUksTUFBSixDQUFXLENBQVgsRUFBYyxXQUFkLEtBQThCLElBQUksU0FBSixDQUFjLENBQWQsQ0FBaEQ7QUFDQSxHQUZEO0FBR0EsU0FBTyxjQUFQO0FBQ0EsRUFQRDtBQVNBLENBdmtCRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDogUGFydG5lcmluZyAzLjAgKDIwMDctMjAxNilcbiAqIEF1dGhvciA6IFN5bHZhaW4gTWFow6kgPHN5bHZhaW4ubWFoZUBwYXJ0bmVyaW5nLmZyPlxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIGRpeWEtc2RrLlxuICpcbiAqIGRpeWEtc2RrIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIGRpeWEtc2RrIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIGRpeWEtc2RrLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cblxuXG5cblxuLyogbWF5YS1jbGllbnRcbiAqIENvcHlyaWdodCAoYykgMjAxNCwgUGFydG5lcmluZyBSb2JvdGljcywgQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgbGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3JcbiAqIG1vZGlmeSBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbiAqIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5IHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IHZlcnNpb25cbiAqXHQzLjAgb2YgdGhlIExpY2Vuc2UuIFRoaXMgbGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZVxuICogdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW5cbiAqIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVJcbiAqIFBVUlBPU0UuIFNlZSB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG4gKiBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBsaWJyYXJ5LlxuICovXG4oZnVuY3Rpb24oKXtcblxuXHR2YXIgaXNCcm93c2VyID0gISh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyk7XG5cdGlmKCFpc0Jyb3dzZXIpIHsgdmFyIFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpOyB9XG5cdGVsc2UgeyB2YXIgUHJvbWlzZSA9IHdpbmRvdy5Qcm9taXNlOyB9XG5cdHZhciBEaXlhU2VsZWN0b3IgPSBkMS5EaXlhU2VsZWN0b3I7XG5cdHZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLyBMb2dnaW5nIHV0aWxpdHkgbWV0aG9kcyAvLy8vLy8vLy8vLy8vLy8vLy9cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXHR2YXIgREVCVUcgPSB0cnVlO1xuXHR2YXIgTG9nZ2VyID0ge1xuXHRcdGxvZzogZnVuY3Rpb24obWVzc2FnZSl7XG5cdFx0XHRpZihERUJVRykgY29uc29sZS5sb2cobWVzc2FnZSk7XG5cdFx0fSxcblxuXHRcdGVycm9yOiBmdW5jdGlvbihtZXNzYWdlKXtcblx0XHRcdGlmKERFQlVHKSBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICpcdGNhbGxiYWNrIDogZnVuY3Rpb24gY2FsbGVkIGFmdGVyIG1vZGVsIHVwZGF0ZWRcblx0ICogKi9cblx0ZnVuY3Rpb24gU3RhdHVzKHNlbGVjdG9yKXtcblx0XHR0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3I7XG5cdFx0dGhpcy5fY29kZXIgPSBzZWxlY3Rvci5lbmNvZGUoKTtcblx0XHR0aGlzLnN1YnNjcmlwdGlvbnMgPSBbXTtcblxuXHRcdC8qKiBtb2RlbCBvZiByb2JvdCA6IGF2YWlsYWJsZSBwYXJ0cyBhbmQgc3RhdHVzICoqL1xuXHRcdHRoaXMucm9ib3RNb2RlbCA9IFtdO1xuXHRcdHRoaXMuX3JvYm90TW9kZWxJbml0ID0gZmFsc2U7XG5cblx0XHQvKioqIHN0cnVjdHVyZSBvZiBkYXRhIGNvbmZpZyAqKipcblx0XHRcdCBjcml0ZXJpYSA6XG5cdFx0XHQgICB0aW1lOiBhbGwgMyB0aW1lIGNyaXRlcmlhIHNob3VsZCBub3QgYmUgZGVmaW5lZCBhdCB0aGUgc2FtZSB0aW1lLiAocmFuZ2Ugd291bGQgYmUgZ2l2ZW4gdXApXG5cdFx0XHQgICAgIGJlZzoge1tudWxsXSx0aW1lfSAobnVsbCBtZWFucyBtb3N0IHJlY2VudCkgLy8gc3RvcmVkIGEgVVRDIGluIG1zIChudW0pXG5cdFx0XHQgICAgIGVuZDoge1tudWxsXSwgdGltZX0gKG51bGwgbWVhbnMgbW9zdCBvbGRlc3QpIC8vIHN0b3JlZCBhcyBVVEMgaW4gbXMgKG51bSlcblx0XHRcdCAgICAgcmFuZ2U6IHtbbnVsbF0sIHRpbWV9IChyYW5nZSBvZiB0aW1lKHBvc2l0aXZlKSApIC8vIGluIHMgKG51bSlcblx0XHRcdCAgIHJvYm90OiB7QXJyYXlPZiBJRCBvciBbXCJhbGxcIl19XG5cdFx0XHQgICBwbGFjZToge0FycmF5T2YgSUQgb3IgW1wiYWxsXCJdfVxuXHRcdFx0IG9wZXJhdG9yOiB7W2xhc3RdLCBtYXgsIG1veSwgc2R9IC0oIG1heWJlIG1veSBzaG91bGQgYmUgZGVmYXVsdFxuXHRcdFx0IC4uLlxuXG5cdFx0XHQgcGFydHMgOiB7W251bGxdIG9yIEFycmF5T2YgUGFydHNJZH0gdG8gZ2V0IGVycm9yc1xuXHRcdFx0IHN0YXR1cyA6IHtbbnVsbF0gb3IgQXJyYXlPZiBTdGF0dXNOYW1lfSB0byBnZXQgc3RhdHVzXG5cblx0XHRcdCBzYW1wbGluZzoge1tudWxsXSBvciBpbnR9XG5cdFx0Ki9cblx0XHR0aGlzLmRhdGFDb25maWcgPSB7XG5cdFx0XHRjcml0ZXJpYToge1xuXHRcdFx0XHR0aW1lOiB7XG5cdFx0XHRcdFx0YmVnOiBudWxsLFxuXHRcdFx0XHRcdGVuZDogbnVsbCxcblx0XHRcdFx0XHRyYW5nZTogbnVsbCAvLyBpbiBzXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHJvYm90OiBudWxsXG5cdFx0XHR9LFxuXHRcdFx0b3BlcmF0b3I6ICdsYXN0Jyxcblx0XHRcdHBhcnRzOiBudWxsLFxuXHRcdFx0c3RhdHVzOiBudWxsXG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXHQvKipcblx0ICogR2V0IHJvYm90TW9kZWwgOlxuXHQgKiB7XG5cdCAqICBwYXJ0czoge1xuXHQgKlx0XHRcInBhcnRYWFwiOiB7XG5cdCAqIFx0XHRcdCBlcnJvcnNEZXNjcjogeyBlbmNvdW50ZXJlZCBlcnJvcnMgaW5kZXhlZCBieSBlcnJvcklkcz4wIH1cblx0ICpcdFx0XHRcdD4gQ29uZmlnIG9mIGVycm9ycyA6XG5cdCAqXHRcdFx0XHRcdGNyaXRMZXZlbDogRkxPQVQsIC8vIGNvdWxkIGJlIGludC4uLlxuXHQgKiBcdFx0XHRcdFx0bXNnOiBTVFJJTkcsXG5cdCAqXHRcdFx0XHRcdHN0b3BTZXJ2aWNlSWQ6IFNUUklORyxcblx0ICpcdFx0XHRcdFx0cnVuU2NyaXB0OiBTZXF1ZWxpemUuU1RSSU5HLFxuXHQgKlx0XHRcdFx0XHRtaXNzaW9uTWFzazogU2VxdWVsaXplLklOVEVHRVIsXG5cdCAqXHRcdFx0XHRcdHJ1bkxldmVsOiBTZXF1ZWxpemUuSU5URUdFUlxuXHQgKlx0XHRcdGVycm9yOltGTE9BVCwgLi4uXSwgLy8gY291bGQgYmUgaW50Li4uXG5cdCAqXHRcdFx0dGltZTpbRkxPQVQsIC4uLl0sXG5cdCAqXHRcdFx0cm9ib3Q6W0ZMT0FULCAuLi5dLFxuXHQgKlx0XHRcdC8vLyBwbGFjZTpbRkxPQVQsIC4uLl0sIG5vdCBpbXBsZW1lbnRlZCB5ZXRcblx0ICpcdFx0fSxcblx0ICpcdCBcdC4uLiAoXCJQYXJ0WVlcIilcblx0ICogIH0sXG5cdCAqICBzdGF0dXM6IHtcblx0ICpcdFx0XCJzdGF0dXNYWFwiOiB7XG5cdCAqXHRcdFx0XHRkYXRhOltGTE9BVCwgLi4uXSwgLy8gY291bGQgYmUgaW50Li4uXG5cdCAqXHRcdFx0XHR0aW1lOltGTE9BVCwgLi4uXSxcblx0ICpcdFx0XHRcdHJvYm90OltGTE9BVCwgLi4uXSxcblx0ICpcdFx0XHRcdC8vLyBwbGFjZTpbRkxPQVQsIC4uLl0sIG5vdCBpbXBsZW1lbnRlZCB5ZXRcblx0ICpcdFx0XHRcdHJhbmdlOiBbRkxPQVQsIEZMT0FUXSxcblx0ICpcdFx0XHRcdGxhYmVsOiBzdHJpbmdcblx0ICpcdFx0XHR9LFxuXHQgKlx0IFx0Li4uIChcIlN0YXR1c1lZXCIpXG5cdCAqICB9XG5cdCAqIH1cblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuZ2V0Um9ib3RNb2RlbCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMucm9ib3RNb2RlbDtcblx0fTtcblxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IGRhdGFDb25maWcgY29uZmlnIGZvciBkYXRhIHJlcXVlc3Rcblx0ICogaWYgZGF0YUNvbmZpZyBpcyBkZWZpbmUgOiBzZXQgYW5kIHJldHVybiB0aGlzXG5cdCAqXHQgQHJldHVybiB7U3RhdHVzfSB0aGlzXG5cdCAqIGVsc2Vcblx0ICpcdCBAcmV0dXJuIHtPYmplY3R9IGN1cnJlbnQgZGF0YUNvbmZpZ1xuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5EYXRhQ29uZmlnID0gZnVuY3Rpb24obmV3RGF0YUNvbmZpZyl7XG5cdFx0aWYobmV3RGF0YUNvbmZpZykge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnPW5ld0RhdGFDb25maWc7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHRoaXMuZGF0YUNvbmZpZztcblx0fTtcblx0LyoqXG5cdCAqIFRPIEJFIElNUExFTUVOVEVEIDogb3BlcmF0b3IgbWFuYWdlbWVudCBpbiBETi1TdGF0dXNcblx0ICogQHBhcmFtICB7U3RyaW5nfVx0IG5ld09wZXJhdG9yIDoge1tsYXN0XSwgbWF4LCBtb3ksIHNkfVxuXHQgKiBAcmV0dXJuIHtTdGF0dXN9IHRoaXMgLSBjaGFpbmFibGVcblx0ICogU2V0IG9wZXJhdG9yIGNyaXRlcmlhLlxuXHQgKiBEZXBlbmRzIG9uIG5ld09wZXJhdG9yXG5cdCAqXHRAcGFyYW0ge1N0cmluZ30gbmV3T3BlcmF0b3Jcblx0ICpcdEByZXR1cm4gdGhpc1xuXHQgKiBHZXQgb3BlcmF0b3IgY3JpdGVyaWEuXG5cdCAqXHRAcmV0dXJuIHtTdHJpbmd9IG9wZXJhdG9yXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLkRhdGFPcGVyYXRvciA9IGZ1bmN0aW9uKG5ld09wZXJhdG9yKXtcblx0XHRpZihuZXdPcGVyYXRvcikge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLm9wZXJhdG9yID0gbmV3T3BlcmF0b3I7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHRoaXMuZGF0YUNvbmZpZy5vcGVyYXRvcjtcblx0fTtcblx0LyoqXG5cdCAqIERlcGVuZHMgb24gbnVtU2FtcGxlc1xuXHQgKiBAcGFyYW0ge2ludH0gbnVtYmVyIG9mIHNhbXBsZXMgaW4gZGF0YU1vZGVsXG5cdCAqIGlmIGRlZmluZWQgOiBzZXQgbnVtYmVyIG9mIHNhbXBsZXNcblx0ICpcdEByZXR1cm4ge1N0YXR1c30gdGhpc1xuXHQgKiBlbHNlXG5cdCAqXHRAcmV0dXJuIHtpbnR9IG51bWJlciBvZiBzYW1wbGVzXG5cdCAqKi9cblx0U3RhdHVzLnByb3RvdHlwZS5EYXRhU2FtcGxpbmcgPSBmdW5jdGlvbihudW1TYW1wbGVzKXtcblx0XHRpZihudW1TYW1wbGVzKSB7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcuc2FtcGxpbmcgPSBudW1TYW1wbGVzO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB0aGlzLmRhdGFDb25maWcuc2FtcGxpbmc7XG5cdH07XG5cdC8qKlxuXHQgKiBTZXQgb3IgZ2V0IGRhdGEgdGltZSBjcml0ZXJpYSBiZWcgYW5kIGVuZC5cblx0ICogSWYgcGFyYW0gZGVmaW5lZFxuXHQgKlx0QHBhcmFtIHtEYXRlfSBuZXdUaW1lQmVnIC8vIG1heSBiZSBudWxsXG5cdCAqXHRAcGFyYW0ge0RhdGV9IG5ld1RpbWVFbmQgLy8gbWF5IGJlIG51bGxcblx0ICpcdEByZXR1cm4ge1N0YXR1c30gdGhpc1xuXHQgKiBJZiBubyBwYXJhbSBkZWZpbmVkOlxuXHQgKlx0QHJldHVybiB7T2JqZWN0fSBUaW1lIG9iamVjdDogZmllbGRzIGJlZyBhbmQgZW5kLlxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5EYXRhVGltZSA9IGZ1bmN0aW9uKG5ld1RpbWVCZWcsbmV3VGltZUVuZCwgbmV3UmFuZ2Upe1xuXHRcdGlmKG5ld1RpbWVCZWcgfHwgbmV3VGltZUVuZCB8fCBuZXdSYW5nZSkge1xuXHRcdFx0dGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnRpbWUuYmVnID0gbmV3VGltZUJlZy5nZXRUaW1lKCk7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5lbmQgPSBuZXdUaW1lRW5kLmdldFRpbWUoKTtcblx0XHRcdHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS50aW1lLnJhbmdlID0gbmV3UmFuZ2U7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0YmVnOiBuZXcgRGF0ZSh0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5iZWcpLFxuXHRcdFx0XHRlbmQ6IG5ldyBEYXRlKHRoaXMuZGF0YUNvbmZpZy5jcml0ZXJpYS50aW1lLmVuZCksXG5cdFx0XHRcdHJhbmdlOiBuZXcgRGF0ZSh0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEudGltZS5yYW5nZSlcblx0XHRcdH07XG5cdH07XG5cdC8qKlxuXHQgKiBEZXBlbmRzIG9uIHJvYm90SWRzXG5cdCAqIFNldCByb2JvdCBjcml0ZXJpYS5cblx0ICpcdEBwYXJhbSB7QXJyYXlbSW50XX0gcm9ib3RJZHMgbGlzdCBvZiByb2JvdCBJZHNcblx0ICogR2V0IHJvYm90IGNyaXRlcmlhLlxuXHQgKlx0QHJldHVybiB7QXJyYXlbSW50XX0gbGlzdCBvZiByb2JvdCBJZHNcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YVJvYm90SWRzID0gZnVuY3Rpb24ocm9ib3RJZHMpe1xuXHRcdGlmKHJvYm90SWRzKSB7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEucm9ib3QgPSByb2JvdElkcztcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gdGhpcy5kYXRhQ29uZmlnLmNyaXRlcmlhLnJvYm90O1xuXHR9O1xuXHQvKipcblx0ICogRGVwZW5kcyBvbiBwbGFjZUlkcyAvLyBub3QgcmVsZXZhbnQ/LCBub3QgaW1wbGVtZW50ZWQgeWV0XG5cdCAqIFNldCBwbGFjZSBjcml0ZXJpYS5cblx0ICpcdEBwYXJhbSB7QXJyYXlbSW50XX0gcGxhY2VJZHMgbGlzdCBvZiBwbGFjZSBJZHNcblx0ICogR2V0IHBsYWNlIGNyaXRlcmlhLlxuXHQgKlx0QHJldHVybiB7QXJyYXlbSW50XX0gbGlzdCBvZiBwbGFjZSBJZHNcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuRGF0YVBsYWNlSWRzID0gZnVuY3Rpb24ocGxhY2VJZHMpe1xuXHRcdGlmKHBsYWNlSWRzKSB7XG5cdFx0XHR0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEucGxhY2VJZCA9IHBsYWNlSWRzO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB0aGlzLmRhdGFDb25maWcuY3JpdGVyaWEucGxhY2U7XG5cdH07XG5cdC8qKlxuXHQgKiBHZXQgZGF0YSBieSBzZW5zb3IgbmFtZS5cblx0ICpcdEBwYXJhbSB7QXJyYXlbU3RyaW5nXX0gc2Vuc29yTmFtZSBsaXN0IG9mIHNlbnNvcnNcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuZ2V0RGF0YUJ5TmFtZSA9IGZ1bmN0aW9uKHNlbnNvck5hbWVzKXtcblx0XHR2YXIgZGF0YT1bXTtcblx0XHRmb3IodmFyIG4gaW4gc2Vuc29yTmFtZXMpIHtcblx0XHRcdGRhdGEucHVzaCh0aGlzLmRhdGFNb2RlbFtzZW5zb3JOYW1lc1tuXV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gZGF0YTtcblx0fTtcblxuXHQvKipcblx0ICogU3Vic2NyaWJlIHRvIGVycm9yL3N0YXR1cyB1cGRhdGVzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLndhdGNoID0gZnVuY3Rpb24gKHJvYm90TmFtZXMsIGNhbGxiYWNrKSB7XG5cdFx0dGhpcy5zZWxlY3Rvci5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cdFx0dGhpcy5zZWxlY3Rvci5fY29ubmVjdGlvbi5zZXRNYXhMaXN0ZW5lcnMoMCk7XG5cdFx0bGV0IHNlbmREYXRhID0gW107XG5cdFx0bGV0IHJvYm90SWRzID0gW107XG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KF8gPT4ge1xuXHRcdFx0bGV0IHJlcSA9IHRoaXMuc2VsZWN0b3IucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6ICdzdGF0dXMnLFxuXHRcdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdvcmcuZnJlZWRlc2t0b3AuREJ1cy5PYmplY3RNYW5hZ2VyJyxcblx0XHRcdFx0fVxuXHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBvYmpEYXRhKSA9PiB7IC8vIGdldCBhbGwgb2JqZWN0IHBhdGhzLCBpbnRlcmZhY2VzIGFuZCBwcm9wZXJ0aWVzIGNoaWxkcmVuIG9mIFN0YXR1c1xuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoZXJyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRsZXQgcm9ib3ROYW1lID0gJyc7XG5cdFx0XHRcdFx0bGV0IHJvYm90SWQgPSAxO1xuXHRcdFx0XHRcdGZvciAobGV0IG9iamVjdFBhdGggaW4gb2JqRGF0YSkge1xuXHRcdFx0XHRcdFx0aWYgKG9iakRhdGFbb2JqZWN0UGF0aF1bJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90J10gIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRyb2JvdE5hbWUgPSBvYmpEYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddLlJvYm90TmFtZTtcblx0XHRcdFx0XHRcdFx0cm9ib3RJZCA9IG9iakRhdGFbb2JqZWN0UGF0aF1bJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90J10uUm9ib3RJZDtcblx0XHRcdFx0XHRcdFx0cm9ib3RJZHNbcm9ib3ROYW1lXSA9IHJvYm90SWQ7XG5cdFx0XHRcdFx0XHRcdHRoaXMuZ2V0QWxsU3RhdHVzZXMocm9ib3ROYW1lLCBmdW5jdGlvbiAobW9kZWwpIHtcblx0XHRcdFx0XHRcdFx0XHRjYWxsYmFjayhtb2RlbCwgcGVlcklkKTtcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGlmIChvYmpEYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0J10gIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRsZXQgc3VicyA9IHRoaXMuc2VsZWN0b3Iuc3Vic2NyaWJlKHsvLyBzdWJzY3JpYmVzIHRvIHN0YXR1cyBjaGFuZ2VzIGZvciBhbGwgcGFydHNcblx0XHRcdFx0XHRcdFx0XHRzZXJ2aWNlOiAnc3RhdHVzJyxcblx0XHRcdFx0XHRcdFx0XHRmdW5jOiAnU3RhdHVzQ2hhbmdlZCcsXG5cdFx0XHRcdFx0XHRcdFx0b2JqOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdHBhdGg6IG9iamVjdFBhdGhcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdGRhdGE6IHJvYm90TmFtZXNcblx0XHRcdFx0XHRcdFx0fSwgKHBlZXJJZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJTdGF0dXNTdWJzY3JpYmU6XCIgKyBlcnIpO1xuXHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzZW5kRGF0YVswXSA9IGRhdGE7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLl9nZXRSb2JvdE1vZGVsRnJvbVJlY3YyKHNlbmREYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwsIHBlZXJJZCk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zLnB1c2goc3Vicyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH0pLmNhdGNoKGVyciA9PiB7XG5cdFx0XHRMb2dnZXIuZXJyb3IoZXJyKTtcblx0XHR9KVxuXG5cblx0fTtcblxuXHQvKipcblx0ICogQ2xvc2UgYWxsIHN1YnNjcmlwdGlvbnNcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuY2xvc2VTdWJzY3JpcHRpb25zID0gZnVuY3Rpb24oKXtcblx0XHRmb3IodmFyIGkgaW4gdGhpcy5zdWJzY3JpcHRpb25zKSB7XG5cdFx0XHR0aGlzLnN1YnNjcmlwdGlvbnNbaV0uY2xvc2UoKTtcblx0XHR9XG5cdFx0dGhpcy5zdWJzY3JpcHRpb25zID1bXTtcblx0XHR0aGlzLnJvYm90TW9kZWwgPSBbXTtcblx0fTtcblxuXHQvKipcblx0ICogR2V0IGRhdGEgZ2l2ZW4gZGF0YUNvbmZpZy5cblx0ICogQHBhcmFtIHtmdW5jfSBjYWxsYmFjayA6IGNhbGxlZCBhZnRlciB1cGRhdGVcblx0ICogVE9ETyBVU0UgUFJPTUlTRVxuXHQgKi9cblx0U3RhdHVzLnByb3RvdHlwZS5nZXREYXRhID0gZnVuY3Rpb24oY2FsbGJhY2ssIGRhdGFDb25maWcpe1xuXHRcdHZhciBkYXRhTW9kZWwgPSB7fTtcblx0XHRyZXR1cm4gUHJvbWlzZS50cnkoXyA9PiB7XG5cdFx0XHRpZihkYXRhQ29uZmlnICE9IG51bGwpXG5cdFx0XHRcdHRoaXMuRGF0YUNvbmZpZyhkYXRhQ29uZmlnKTtcblx0XHRcdC8vIGNvbnNvbGUubG9nKFwiUmVxdWVzdDogXCIrSlNPTi5zdHJpbmdpZnkoZGF0YUNvbmZpZykpO1xuXHRcdFx0dGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHRcdFx0c2VydmljZTogXCJzdGF0dXNcIixcblx0XHRcdFx0ZnVuYzogXCJEYXRhUmVxdWVzdFwiLFxuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0dHlwZTpcInNwbFJlcVwiLFxuXHRcdFx0XHRcdGRhdGFDb25maWc6IHRoaXMuZGF0YUNvbmZpZ1xuXHRcdFx0XHR9XG5cdFx0XHR9LCAoZG5JZCwgZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdExvZ2dlci5lcnJvcihcIltcIiArIHRoaXMuZGF0YUNvbmZpZy5zZW5zb3JzICsgXCJdIFJlY3YgZXJyOiBcIiArIEpTT04uc3RyaW5naWZ5KGVycikpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZihkYXRhLmhlYWRlci5lcnJvciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0Ly8gVE9ETyA6IGNoZWNrL3VzZSBlcnIgc3RhdHVzIGFuZCBhZGFwdCBiZWhhdmlvciBhY2NvcmRpbmdseVxuXHRcdFx0XHRcdExvZ2dlci5lcnJvcihcIlVwZGF0ZURhdGE6XFxuXCIrSlNPTi5zdHJpbmdpZnkoZGF0YS5oZWFkZXIucmVxQ29uZmlnKSk7XG5cdFx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiRGF0YSByZXF1ZXN0IGZhaWxlZCAoXCIrZGF0YS5oZWFkZXIuZXJyb3Iuc3QrXCIpOiBcIitkYXRhLmhlYWRlci5lcnJvci5tc2cpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQvL0xvZ2dlci5sb2coSlNPTi5zdHJpbmdpZnkodGhpcy5kYXRhTW9kZWwpKTtcblx0XHRcdFx0ZGF0YU1vZGVsID0gdGhpcy5fZ2V0RGF0YU1vZGVsRnJvbVJlY3YoZGF0YSk7XG5cblx0XHRcdFx0TG9nZ2VyLmxvZyh0aGlzLmdldERhdGFNb2RlbCgpKTtcblx0XHRcdFx0Y2FsbGJhY2sgPSBjYWxsYmFjay5iaW5kKHRoaXMpOyAvLyBiaW5kIGNhbGxiYWNrIHdpdGggU3RhdHVzXG5cdFx0XHRcdGNhbGxiYWNrKGRhdGFNb2RlbCk7IC8vIGNhbGxiYWNrIGZ1bmNcblx0XHRcdH0pO1xuXHRcdH0pLmNhdGNoKGVyciA9PiB7XG5cdFx0XHRMb2dnZXIuZXJyb3IoZXJyKVxuXHRcdH0pXG5cdH07XG5cblxuXHQvKipcblx0ICogVXBkYXRlIGludGVybmFsIHJvYm90IG1vZGVsIHdpdGggcmVjZWl2ZWQgZGF0YSAodmVyc2lvbiAyKVxuXHQgKiBAcGFyYW0gIHtPYmplY3R9IGRhdGEgZGF0YSByZWNlaXZlZCBmcm9tIERpeWFOb2RlIGJ5IHdlYnNvY2tldFxuXHQgKiBAcmV0dXJuIHtbdHlwZV19XHRcdFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuX2dldFJvYm90TW9kZWxGcm9tUmVjdjIgPSBmdW5jdGlvbihkYXRhLCByb2JvdElkLCByb2JvdE5hbWUpIHtcblx0XHRpZih0aGlzLnJvYm90TW9kZWwgPT0gbnVsbClcblx0XHRcdHRoaXMucm9ib3RNb2RlbCA9IFtdO1xuXG5cdFx0aWYodGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdICE9IG51bGwpXG5cdFx0XHR0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0ucGFydHMgPSB7fTsgLy8gcmVzZXQgcGFydHNcblxuXHRcdGlmKHRoaXMucm9ib3RNb2RlbFtyb2JvdElkXSA9PSBudWxsKVxuXHRcdFx0dGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdID0ge307XG5cblx0XHR0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0gPSB7XG5cdFx0XHRyb2JvdDoge1xuXHRcdFx0XHRuYW1lOiByb2JvdE5hbWVcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqIGV4dHJhY3QgcGFydHMgaW5mbyAqKi9cblx0XHR0aGlzLnJvYm90TW9kZWxbcm9ib3RJZF0ucGFydHMgPSB7fTtcblx0XHRsZXQgclBhcnRzID0gdGhpcy5yb2JvdE1vZGVsW3JvYm90SWRdLnBhcnRzO1xuXG5cdFx0ZGF0YS5mb3JFYWNoKGQgPT4ge1xuXHRcdFx0bGV0IHBhcnRJZCA9IGRbMF07XG5cdFx0XHRsZXQgY2F0ZWdvcnkgPSBkWzFdO1xuXHRcdFx0bGV0IHBhcnROYW1lID0gZFsyXTtcblx0XHRcdGxldCBsYWJlbCA9IGRbM107XG5cdFx0XHRsZXQgdGltZSA9IGRbNF07XG5cdFx0XHRsZXQgY29kZSA9IGRbNV07XG5cdFx0XHRsZXQgY29kZVJlZiA9IGRbNl07XG5cdFx0XHRsZXQgbXNnID0gZFs3XTtcblx0XHRcdGxldCBjcml0TGV2ZWwgPSBkWzhdO1xuXHRcdFx0bGV0IGRlc2NyaXB0aW9uID0gZFs5XTtcblxuXHRcdFx0aWYgKHJQYXJ0c1twYXJ0SWRdID09IG51bGwpIHtcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0gPSB7fTtcblx0XHRcdH1cblx0XHRcdC8qIHVwZGF0ZSBwYXJ0IGNhdGVnb3J5ICovXG5cdFx0XHRyUGFydHNbcGFydElkXS5jYXRlZ29yeSA9IGNhdGVnb3J5O1xuXHRcdFx0LyogdXBkYXRlIHBhcnQgbmFtZSAqL1xuXHRcdFx0clBhcnRzW3BhcnRJZF0ubmFtZSA9IHBhcnROYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHQvKiB1cGRhdGUgcGFydCBsYWJlbCAqL1xuXHRcdFx0clBhcnRzW3BhcnRJZF0ubGFiZWwgPSBsYWJlbDtcblxuXHRcdFx0LyogdXBkYXRlIGVycm9yICovXG5cdFx0XHQvKiogdXBkYXRlIGVycm9yTGlzdCAqKi9cblx0XHRcdGlmIChyUGFydHNbcGFydElkXS5lcnJvckxpc3QgPT0gbnVsbClcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0ID0ge307XG5cblx0XHRcdGlmIChyUGFydHNbcGFydElkXS5lcnJvckxpc3RbY29kZVJlZl0gPT0gbnVsbClcblx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXJyb3JMaXN0W2NvZGVSZWZdID0ge1xuXHRcdFx0XHRcdG1zZzogbXNnLFxuXHRcdFx0XHRcdGNyaXRMZXZlbDogY3JpdExldmVsLFxuXHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuXHRcdFx0XHR9O1xuXHRcdFx0bGV0IGV2dHNfdG1wID0ge1xuXHRcdFx0XHR0aW1lOiB0aGlzLl9jb2Rlci5mcm9tKHRpbWUpLFxuXHRcdFx0XHRjb2RlOiB0aGlzLl9jb2Rlci5mcm9tKGNvZGUpLFxuXHRcdFx0XHRjb2RlUmVmOiB0aGlzLl9jb2Rlci5mcm9tKGNvZGVSZWYpXG5cdFx0XHR9O1xuXHRcdFx0LyoqIGlmIHJlY2VpdmVkIGxpc3Qgb2YgZXZlbnRzICoqL1xuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoZXZ0c190bXAuY29kZSkgfHwgQXJyYXkuaXNBcnJheShldnRzX3RtcC50aW1lKVxuXHRcdFx0XHR8fCBBcnJheS5pc0FycmF5KGV2dHNfdG1wLmNvZGVSZWYpKSB7XG5cdFx0XHRcdGlmIChldnRzX3RtcC5jb2RlLmxlbmd0aCA9PT0gZXZ0c190bXAuY29kZVJlZi5sZW5ndGhcblx0XHRcdFx0XHQmJiBldnRzX3RtcC5jb2RlLmxlbmd0aCA9PT0gZXZ0c190bXAudGltZS5sZW5ndGgpIHtcblx0XHRcdFx0XHQvKiogYnVpbGQgbGlzdCBvZiBldmVudHMgKiovXG5cdFx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXZ0cyA9IFtdO1xuXHRcdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZXZ0c190bXAuY29kZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0clBhcnRzW3BhcnRJZF0uZXZ0cy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0dGltZTogZXZ0c190bXAudGltZVtpXSxcblx0XHRcdFx0XHRcdFx0Y29kZTogZXZ0c190bXAuY29kZVtpXSxcblx0XHRcdFx0XHRcdFx0Y29kZVJlZjogZXZ0c190bXAuY29kZVJlZltpXVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgTG9nZ2VyLmVycm9yKFwiU3RhdHVzOkluY29uc2lzdGFudCBsZW5ndGhzIG9mIGJ1ZmZlcnMgKHRpbWUvY29kZS9jb2RlUmVmKVwiKTtcblx0XHRcdH1cblx0XHRcdGVsc2UgeyAvKioganVzdCBpbiBjYXNlLCB0byBwcm92aWRlIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgKiovXG5cdFx0XHRcdC8qKiBzZXQgcmVjZWl2ZWQgZXZlbnQgKiovXG5cdFx0XHRcdHJQYXJ0c1twYXJ0SWRdLmV2dHMgPSBbe1xuXHRcdFx0XHRcdHRpbWU6IGV2dHNfdG1wLnRpbWUsXG5cdFx0XHRcdFx0Y29kZTogZXZ0c190bXAuY29kZSxcblx0XHRcdFx0XHRjb2RlUmVmOiBldnRzX3RtcC5jb2RlUmVmXG5cdFx0XHRcdH1dO1xuXHRcdFx0fVxuXHRcdH0pXG5cdH07XG5cblx0LyoqIGNyZWF0ZSBTdGF0dXMgc2VydmljZSAqKi9cblx0RGl5YVNlbGVjdG9yLnByb3RvdHlwZS5TdGF0dXMgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiBuZXcgU3RhdHVzKHRoaXMpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBTZXQgb24gc3RhdHVzXG5cdCAqIEBwYXJhbSByb2JvdE5hbWUgdG8gZmluZCBzdGF0dXMgdG8gbW9kaWZ5XG5cdCAqIEBwYXJhbSBwYXJ0TmFtZSBcdHRvIGZpbmQgc3RhdHVzIHRvIG1vZGlmeVxuXHQgKiBAcGFyYW0gY29kZVx0XHRuZXdDb2RlXG5cdCAqIEBwYXJhbSBzb3VyY2VcdFx0c291cmNlXG5cdCAqIEBwYXJhbSBjYWxsYmFja1x0XHRyZXR1cm4gY2FsbGJhY2sgKDxib29sPnN1Y2Nlc3MpXG5cdCAqL1xuXHREaXlhU2VsZWN0b3IucHJvdG90eXBlLnNldFN0YXR1cyA9IGZ1bmN0aW9uIChyb2JvdE5hbWUsIHBhcnROYW1lLCBjb2RlLCBzb3VyY2UsIGNhbGxiYWNrKSB7XG5cdFx0cmV0dXJuIFByb21pc2UudHJ5KF8gPT4ge1xuXHRcdFx0dmFyIG9iamVjdFBhdGggPSBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1cy9Sb2JvdHMvXCIgKyB0aGlzLnNwbGl0QW5kQ2FtZWxDYXNlKHJvYm90TmFtZSwgXCItXCIpICsgXCIvUGFydHMvXCIgKyBwYXJ0TmFtZTtcblx0XHRcdHRoaXMucmVxdWVzdCh7XG5cdFx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRcdGZ1bmM6IFwiU2V0UGFydFwiLFxuXHRcdFx0XHRvYmo6IHtcblx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0XHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHQvL3JvYm90TmFtZTogcm9ib3ROYW1lLFxuXHRcdFx0XHRcdGNvZGU6IGNvZGUsXG5cdFx0XHRcdFx0Ly9wYXJ0TmFtZTogcGFydE5hbWUsXG5cdFx0XHRcdFx0c291cmNlOiBzb3VyY2UgfCAxXG5cdFx0XHRcdH1cblx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayhmYWxzZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2sodHJ1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pLmNhdGNoKGVyciA9PiB7XG5cdFx0XHRMb2dnZXIuZXJyb3IoZXJyKVxuXHRcdH0pXG5cdH07XG5cblx0LyoqXG5cdCAqIEdldCBvbmUgc3RhdHVzXG5cdCAqIEBwYXJhbSByb2JvdE5hbWUgdG8gZ2V0IHN0YXR1c1xuXHQgKiBAcGFyYW0gcGFydE5hbWUgXHR0byBnZXQgc3RhdHVzXG5cdCAqIEBwYXJhbSBjYWxsYmFja1x0XHRyZXR1cm4gY2FsbGJhY2soLTEgaWYgbm90IGZvdW5kL2RhdGEgb3RoZXJ3aXNlKVxuXHQgKiBAcGFyYW0gX2Z1bGwgXHRtb3JlIGRhdGEgYWJvdXQgc3RhdHVzXG5cdCAqL1xuXHRTdGF0dXMucHJvdG90eXBlLmdldFN0YXR1cyA9IGZ1bmN0aW9uIChyb2JvdE5hbWUsIHBhcnROYW1lLCBjYWxsYmFjay8qLCBfZnVsbCovKSB7XG5cdFx0bGV0IHNlbmREYXRhID0gW11cblx0XHRyZXR1cm4gUHJvbWlzZS50cnkoXyA9PiB7XG5cdFx0XHRsZXQgcmVxID0gdGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0XHRcdGZ1bmM6ICdHZXRNYW5hZ2VkT2JqZWN0cycsXG5cdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdGludGVyZmFjZTogJ29yZy5mcmVlZGVza3RvcC5EQnVzLk9iamVjdE1hbmFnZXInLFxuXHRcdFx0XHR9XG5cdFx0XHR9LCAocGVlcklkLCBlcnIsIG9iakRhdGEpID0+IHtcblx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0TG9nZ2VyLmVycm9yKGVycik7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cblx0XHRcdFx0XHRsZXQgb2JqZWN0UGF0aFJvYm90ID0gXCIvZnIvcGFydG5lcmluZy9TdGF0dXMvUm9ib3RzL1wiICsgdGhpcy5zcGxpdEFuZENhbWVsQ2FzZShyb2JvdE5hbWUsIFwiLVwiKTtcblx0XHRcdFx0XHRsZXQgb2JqZWN0UGF0aFBhcnQgPSBcIi9mci9wYXJ0bmVyaW5nL1N0YXR1cy9Sb2JvdHMvXCIgKyB0aGlzLnNwbGl0QW5kQ2FtZWxDYXNlKHJvYm90TmFtZSwgXCItXCIpICsgXCIvUGFydHMvXCIgKyBwYXJ0TmFtZTtcblx0XHRcdFx0XHRsZXQgcm9ib3RJZCA9IG9iakRhdGFbb2JqZWN0UGF0aFJvYm90XVsnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXS5Sb2JvdElkXG5cdFx0XHRcdFx0dGhpcy5zZWxlY3Rvci5yZXF1ZXN0KHtcblx0XHRcdFx0XHRcdHNlcnZpY2U6IFwic3RhdHVzXCIsXG5cdFx0XHRcdFx0XHRmdW5jOiBcIkdldFBhcnRcIixcblx0XHRcdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdFx0XHRpbnRlcmZhY2U6ICdmci5wYXJ0bmVyaW5nLlN0YXR1cy5QYXJ0Jyxcblx0XHRcdFx0XHRcdFx0cGF0aDogb2JqZWN0UGF0aFBhcnRcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LCAocGVlcklkLCBlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoZXJyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRzZW5kRGF0YS5wdXNoKGRhdGEpXG5cdFx0XHRcdFx0XHRcdHRoaXMuX2dldFJvYm90TW9kZWxGcm9tUmVjdjIoc2VuZERhdGEsIHJvYm90SWQsIHJvYm90TmFtZSk7XG5cdFx0XHRcdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKC0xKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayh0aGlzLnJvYm90TW9kZWwpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fSkuY2F0Y2goZXJyID0+IHtcblx0XHRcdExvZ2dlci5lcnJvcihlcnIpXG5cdFx0fSlcblx0fTtcblxuXHQvKipcblx0ICogR2V0IGFsbCBzdGF0dXNcblx0ICogQHBhcmFtIHJvYm90TmFtZSB0byBnZXQgc3RhdHVzXG5cdCAqIEBwYXJhbSBwYXJ0TmFtZSBcdHRvIGdldCBzdGF0dXNcblx0ICogQHBhcmFtIGNhbGxiYWNrXHRcdHJldHVybiBjYWxsYmFjaygtMSBpZiBub3QgZm91bmQvZGF0YSBvdGhlcndpc2UpXG5cdCAqIEBwYXJhbSBfZnVsbCBcdG1vcmUgZGF0YSBhYm91dCBzdGF0dXNcblx0ICovXG5cdFN0YXR1cy5wcm90b3R5cGUuZ2V0QWxsU3RhdHVzZXMgPSBmdW5jdGlvbiAocm9ib3ROYW1lLCBjYWxsYmFjaykge1xuXHRcdGxldCByZXEgPSB0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0c2VydmljZTogJ3N0YXR1cycsXG5cdFx0XHRmdW5jOiAnR2V0TWFuYWdlZE9iamVjdHMnLFxuXHRcdFx0b2JqOiB7XG5cdFx0XHRcdGludGVyZmFjZTogJ29yZy5mcmVlZGVza3RvcC5EQnVzLk9iamVjdE1hbmFnZXInLFxuXHRcdFx0fVxuXHRcdH0sIChwZWVySWQsIGVyciwgb2JqRGF0YSkgPT4geyAvLyBnZXQgYWxsIG9iamVjdCBwYXRocywgaW50ZXJmYWNlcyBhbmQgcHJvcGVydGllcyBjaGlsZHJlbiBvZiBTdGF0dXNcblx0XHRcdGlmIChlcnIgIT0gbnVsbCB8fCBvYmpEYXRhID09PSBudWxsKSB7XG5cdFx0XHRcdExvZ2dlci5lcnJvcihlcnIpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGxldCBvYmplY3RQYXRoID0gXCIvZnIvcGFydG5lcmluZy9TdGF0dXMvUm9ib3RzL1wiICsgdGhpcy5zcGxpdEFuZENhbWVsQ2FzZShyb2JvdE5hbWUsIFwiLVwiKTtcblx0XHRcdFx0aWYgKG9iakRhdGFbb2JqZWN0UGF0aF0gIT0gbnVsbCkge1xuXHRcdFx0XHRcdGlmIChvYmpEYXRhW29iamVjdFBhdGhdWydmci5wYXJ0bmVyaW5nLlN0YXR1cy5Sb2JvdCddICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdGxldCByb2JvdElkID0gb2JqRGF0YVtvYmplY3RQYXRoXVsnZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QnXS5Sb2JvdElkXG5cdFx0XHRcdFx0XHQvL3ZhciBmdWxsID0gX2Z1bGwgfHwgZmFsc2U7XG5cdFx0XHRcdFx0XHR0aGlzLnNlbGVjdG9yLnJlcXVlc3Qoe1xuXHRcdFx0XHRcdFx0XHRzZXJ2aWNlOiBcInN0YXR1c1wiLFxuXHRcdFx0XHRcdFx0XHRmdW5jOiBcIkdldEFsbFBhcnRzXCIsXG5cdFx0XHRcdFx0XHRcdG9iajoge1xuXHRcdFx0XHRcdFx0XHRcdGludGVyZmFjZTogJ2ZyLnBhcnRuZXJpbmcuU3RhdHVzLlJvYm90Jyxcblx0XHRcdFx0XHRcdFx0XHRwYXRoOiBvYmplY3RQYXRoXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0sIChwZWVySWQsIGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjaygtMSk7XG5cdFx0XHRcdFx0XHRcdFx0TG9nZ2VyLmVycm9yKGVycik7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5fZ2V0Um9ib3RNb2RlbEZyb21SZWN2MihkYXRhLCByb2JvdElkLCByb2JvdE5hbWUpO1xuXHRcdFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKHRoaXMucm9ib3RNb2RlbCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRMb2dnZXIuZXJyb3IoXCJJbnRlcmZhY2UgZnIucGFydG5lcmluZy5TdGF0dXMuUm9ib3QgZG9lc24ndCBleGlzdCFcIilcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0TG9nZ2VyLmVycm9yKFwiT2JqZWN0UGF0aCBcIiArIG9iamVjdFBhdGggKyBcIiBkb2Vzbid0IGV4aXN0IVwiKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSlcblx0fTtcblxuXHRTdGF0dXMucHJvdG90eXBlLnNwbGl0QW5kQ2FtZWxDYXNlID0gZnVuY3Rpb24gKGluU3RyaW5nLCBkZWxpbWl0ZXIpIHtcblx0XHRsZXQgYXJyYXlTcGxpdFN0cmluZyA9IGluU3RyaW5nLnNwbGl0KGRlbGltaXRlcik7XG5cdFx0bGV0IG91dENhbWVsU3RyaW5nID0gJyc7XG5cdFx0YXJyYXlTcGxpdFN0cmluZy5mb3JFYWNoKHN0ciA9PiB7XG5cdFx0XHRvdXRDYW1lbFN0cmluZyArPSBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc3Vic3RyaW5nKDEpO1xuXHRcdH0pXG5cdFx0cmV0dXJuIG91dENhbWVsU3RyaW5nO1xuXHR9XG5cbn0pKClcbiJdfQ==
