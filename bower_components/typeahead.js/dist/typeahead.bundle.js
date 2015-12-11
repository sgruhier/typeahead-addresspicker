/*!
 * typeahead.js 0.10.4
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

(function($) {
	var _ = function() {
		"use strict";
		return {
			isMsie: function() {
				return /(msie|trident)/i.test(navigator.userAgent) ? navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2] : false;
			},
			isBlankString: function(str) {
				return !str || /^\s*$/.test(str);
			},
			escapeRegExChars: function(str) {
				return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
			},
			isString: function(obj) {
				return typeof obj === "string";
			},
			isNumber: function(obj) {
				return typeof obj === "number";
			},
			isArray: $.isArray,
			isFunction: $.isFunction,
			isObject: $.isPlainObject,
			isUndefined: function(obj) {
				return typeof obj === "undefined";
			},
			toStr: function toStr(s) {
				return _.isUndefined(s) || s === null ? "" : s + "";
			},
			bind: $.proxy,
			each: function(collection, cb) {
				$.each(collection, reverseArgs);
				function reverseArgs(index, value) {
					return cb(value, index);
				}
			},
			map: $.map,
			filter: $.grep,
			every: function(obj, test) {
				var result = true;
				if (!obj) {
					return result;
				}
				$.each(obj, function(key, val) {
					if (!(result = test.call(null, val, key, obj))) {
						return false;
					}
				});
				return !!result;
			},
			some: function(obj, test) {
				var result = false;
				if (!obj) {
					return result;
				}
				$.each(obj, function(key, val) {
					if (result = test.call(null, val, key, obj)) {
						return false;
					}
				});
				return !!result;
			},
			mixin: $.extend,
			getUniqueId: function() {
				var counter = 0;
				return function() {
					return counter++;
				};
			}(),
			templatify: function templatify(obj) {
				return $.isFunction(obj) ? obj : template;
				function template() {
					return String(obj);
				}
			},
			defer: function(fn) {
				setTimeout(fn, 0);
			},
			debounce: function(func, wait, immediate) {
				var timeout, result;
				return function() {
					var context = this, args = arguments, later, callNow;
					later = function() {
						timeout = null;
						if (!immediate) {
							result = func.apply(context, args);
						}
					};
					callNow = immediate && !timeout;
					clearTimeout(timeout);
					timeout = setTimeout(later, wait);
					if (callNow) {
						result = func.apply(context, args);
					}
					return result;
				};
			},
			throttle: function(func, wait) {
				var context, args, timeout, result, previous, later;
				previous = 0;
				later = function() {
					previous = new Date();
					timeout = null;
					result = func.apply(context, args);
				};
				return function() {
					var now = new Date(), remaining = wait - (now - previous);
					context = this;
					args = arguments;
					if (remaining <= 0) {
						clearTimeout(timeout);
						timeout = null;
						previous = now;
						result = func.apply(context, args);
					} else if (!timeout) {
						timeout = setTimeout(later, remaining);
					}
					return result;
				};
			},
			noop: function() {}
		};
	}();
	var VERSION = "0.10.4";
	var tokenizers = function() {
		"use strict";
		return {
			nonword: nonword,
			whitespace: whitespace,
			obj: {
				nonword: getObjTokenizer(nonword),
				whitespace: getObjTokenizer(whitespace)
			}
		};
		function whitespace(str) {
			str = _.toStr(str);
			return str ? str.split(/\s+/) : [];
		}
		function nonword(str) {
			str = _.toStr(str);
			return str ? str.split(/\W+/) : [];
		}
		function getObjTokenizer(tokenizer) {
			return function setKey() {
				var args = [].slice.call(arguments, 0);
				return function tokenize(o) {
					var tokens = [];
					_.each(args, function(k) {
						tokens = tokens.concat(tokenizer(_.toStr(o[k])));
					});
					return tokens;
				};
			};
		}
	}();
	var LruCache = function() {
		"use strict";
		function LruCache(maxSize) {
			this.maxSize = _.isNumber(maxSize) ? maxSize : 100;
			this.reset();
			if (this.maxSize <= 0) {
				this.set = this.get = $.noop;
			}
		}
		_.mixin(LruCache.prototype, {
			set: function set(key, val) {
				var tailItem = this.list.tail, node;
				if (this.size >= this.maxSize) {
					this.list.remove(tailItem);
					delete this.hash[tailItem.key];
				}
				if (node = this.hash[key]) {
					node.val = val;
					this.list.moveToFront(node);
				} else {
					node = new Node(key, val);
					this.list.add(node);
					this.hash[key] = node;
					this.size++;
				}
			},
			get: function get(key) {
				var node = this.hash[key];
				if (node) {
					this.list.moveToFront(node);
					return node.val;
				}
			},
			reset: function reset() {
				this.size = 0;
				this.hash = {};
				this.list = new List();
			}
		});
		function List() {
			this.head = this.tail = null;
		}
		_.mixin(List.prototype, {
			add: function add(node) {
				if (this.head) {
					node.next = this.head;
					this.head.prev = node;
				}
				this.head = node;
				this.tail = this.tail || node;
			},
			remove: function remove(node) {
				node.prev ? node.prev.next = node.next : this.head = node.next;
				node.next ? node.next.prev = node.prev : this.tail = node.prev;
			},
			moveToFront: function(node) {
				this.remove(node);
				this.add(node);
			}
		});
		function Node(key, val) {
			this.key = key;
			this.val = val;
			this.prev = this.next = null;
		}
		return LruCache;
	}();
	var PersistentStorage = function() {
		"use strict";
		var ls, methods;
		try {
			ls = window.localStorage;
			ls.setItem("~~~", "!");
			ls.removeItem("~~~");
		} catch (err) {
			ls = null;
		}
		function PersistentStorage(namespace) {
			this.prefix = [ "__", namespace, "__" ].join("");
			this.ttlKey = "__ttl__";
			this.keyMatcher = new RegExp("^" + _.escapeRegExChars(this.prefix));
		}
		if (ls && window.JSON) {
			methods = {
				_prefix: function(key) {
					return this.prefix + key;
				},
				_ttlKey: function(key) {
					return this._prefix(key) + this.ttlKey;
				},
				get: function(key) {
					if (this.isExpired(key)) {
						this.remove(key);
					}
					return decode(ls.getItem(this._prefix(key)));
				},
				set: function(key, val, ttl) {
					if (_.isNumber(ttl)) {
						ls.setItem(this._ttlKey(key), encode(now() + ttl));
					} else {
						ls.removeItem(this._ttlKey(key));
					}
					return ls.setItem(this._prefix(key), encode(val));
				},
				remove: function(key) {
					ls.removeItem(this._ttlKey(key));
					ls.removeItem(this._prefix(key));
					return this;
				},
				clear: function() {
					var i, key, keys = [], len = ls.length;
					for (i = 0; i < len; i++) {
						if ((key = ls.key(i)).match(this.keyMatcher)) {
							keys.push(key.replace(this.keyMatcher, ""));
						}
					}
					for (i = keys.length; i--; ) {
						this.remove(keys[i]);
					}
					return this;
				},
				isExpired: function(key) {
					var ttl = decode(ls.getItem(this._ttlKey(key)));
					return _.isNumber(ttl) && now() > ttl ? true : false;
				}
			};
		} else {
			methods = {
				get: _.noop,
				set: _.noop,
				remove: _.noop,
				clear: _.noop,
				isExpired: _.noop
			};
		}
		_.mixin(PersistentStorage.prototype, methods);
		return PersistentStorage;
		function now() {
			return new Date().getTime();
		}
		function encode(val) {
			return JSON.stringify(_.isUndefined(val) ? null : val);
		}
		function decode(val) {
			return JSON.parse(val);
		}
	}();
	var Transport = function() {
		"use strict";
		var pendingRequestsCount = 0, pendingRequests = {}, maxPendingRequests = 6, sharedCache = new LruCache(10);
		function Transport(o) {
			o = o || {};
			this.cancelled = false;
			this.lastUrl = null;
			this._send = o.transport ? callbackToDeferred(o.transport) : $.ajax;
			this._get = o.rateLimiter ? o.rateLimiter(this._get) : this._get;
			this._cache = o.cache === false ? new LruCache(0) : sharedCache;
		}
		Transport.setMaxPendingRequests = function setMaxPendingRequests(num) {
			maxPendingRequests = num;
		};
		Transport.resetCache = function resetCache() {
			sharedCache.reset();
		};
		_.mixin(Transport.prototype, {
			_get: function(url, o, cb) {
				var that = this, jqXhr;
				if (this.cancelled || url !== this.lastUrl) {
					return;
				}
				if (jqXhr = pendingRequests[url]) {
					jqXhr.done(done).fail(fail);
				} else if (pendingRequestsCount < maxPendingRequests) {
					pendingRequestsCount++;
					pendingRequests[url] = this._send(url, o).done(done).fail(fail).always(always);
				} else {
					this.onDeckRequestArgs = [].slice.call(arguments, 0);
				}
				function done(resp) {
					cb && cb(null, resp);
					that._cache.set(url, resp);
				}
				function fail() {
					cb && cb(true);
				}
				function always() {
					pendingRequestsCount--;
					delete pendingRequests[url];
					if (that.onDeckRequestArgs) {
						that._get.apply(that, that.onDeckRequestArgs);
						that.onDeckRequestArgs = null;
					}
				}
			},
			get: function(url, o, cb) {
				var resp;
				if (_.isFunction(o)) {
					cb = o;
					o = {};
				}
				this.cancelled = false;
				this.lastUrl = url;
				if (resp = this._cache.get(url)) {
					_.defer(function() {
						cb && cb(null, resp);
					});
				} else {
					this._get(url, o, cb);
				}
				return !!resp;
			},
			cancel: function() {
				this.cancelled = true;
			}
		});
		return Transport;
		function callbackToDeferred(fn) {
			return function customSendWrapper(url, o) {
				var deferred = $.Deferred();
				fn(url, o, onSuccess, onError);
				return deferred;
				function onSuccess(resp) {
					_.defer(function() {
						deferred.resolve(resp);
					});
				}
				function onError(err) {
					_.defer(function() {
						deferred.reject(err);
					});
				}
			};
		}
	}();
	var SearchIndex = function() {
		"use strict";
		function SearchIndex(o) {
			o = o || {};
			if (!o.datumTokenizer || !o.queryTokenizer) {
				$.error("datumTokenizer and queryTokenizer are both required");
			}
			this.datumTokenizer = o.datumTokenizer;
			this.queryTokenizer = o.queryTokenizer;
			this.reset();
		}
		_.mixin(SearchIndex.prototype, {
			bootstrap: function bootstrap(o) {
				this.datums = o.datums;
				this.trie = o.trie;
			},
			add: function(data) {
				var that = this;
				data = _.isArray(data) ? data : [ data ];
				_.each(data, function(datum) {
					var id, tokens;
					id = that.datums.push(datum) - 1;
					tokens = normalizeTokens(that.datumTokenizer(datum));
					_.each(tokens, function(token) {
						var node, chars, ch;
						node = that.trie;
						chars = token.split("");
						while (ch = chars.shift()) {
							node = node.children[ch] || (node.children[ch] = newNode());
							node.ids.push(id);
						}
					});
				});
			},
			get: function get(query) {
				var that = this, tokens, matches;
				tokens = normalizeTokens(this.queryTokenizer(query));
				_.each(tokens, function(token) {
					var node, chars, ch, ids;
					if (matches && matches.length === 0) {
						return false;
					}
					node = that.trie;
					chars = token.split("");
					while (node && (ch = chars.shift())) {
						node = node.children[ch];
					}
					if (node && chars.length === 0) {
						ids = node.ids.slice(0);
						matches = matches ? getIntersection(matches, ids) : ids;
					} else {
						matches = [];
						return false;
					}
				});
				return matches ? _.map(unique(matches), function(id) {
					return that.datums[id];
				}) : [];
			},
			reset: function reset() {
				this.datums = [];
				this.trie = newNode();
			},
			serialize: function serialize() {
				return {
					datums: this.datums,
					trie: this.trie
				};
			}
		});
		return SearchIndex;
		function normalizeTokens(tokens) {
			tokens = _.filter(tokens, function(token) {
				return !!token;
			});
			tokens = _.map(tokens, function(token) {
				return token.toLowerCase();
			});
			return tokens;
		}
		function newNode() {
			return {
				ids: [],
				children: {}
			};
		}
		function unique(array) {
			var seen = {}, uniques = [];
			for (var i = 0, len = array.length; i < len; i++) {
				if (!seen[array[i]]) {
					seen[array[i]] = true;
					uniques.push(array[i]);
				}
			}
			return uniques;
		}
		function getIntersection(arrayA, arrayB) {
			var ai = 0, bi = 0, intersection = [];
			arrayA = arrayA.sort(compare);
			arrayB = arrayB.sort(compare);
			var lenArrayA = arrayA.length, lenArrayB = arrayB.length;
			while (ai < lenArrayA && bi < lenArrayB) {
				if (arrayA[ai] < arrayB[bi]) {
					ai++;
				} else if (arrayA[ai] > arrayB[bi]) {
					bi++;
				} else {
					intersection.push(arrayA[ai]);
					ai++;
					bi++;
				}
			}
			return intersection;
			function compare(a, b) {
				return a - b;
			}
		}
	}();
	var oParser = function() {
		"use strict";
		return {
			local: getLocal,
			prefetch: getPrefetch,
			remote: getRemote
		};
		function getLocal(o) {
			return o.local || null;
		}
		function getPrefetch(o) {
			var prefetch, defaults;
			defaults = {
				url: null,
				thumbprint: "",
				ttl: 24 * 60 * 60 * 1e3,
				filter: null,
				ajax: {}
			};
			if (prefetch = o.prefetch || null) {
				prefetch = _.isString(prefetch) ? {
					url: prefetch
				} : prefetch;
				prefetch = _.mixin(defaults, prefetch);
				prefetch.thumbprint = VERSION + prefetch.thumbprint;
				prefetch.ajax.type = prefetch.ajax.type || "GET";
				prefetch.ajax.dataType = prefetch.ajax.dataType || "json";
				!prefetch.url && $.error("prefetch requires url to be set");
			}
			return prefetch;
		}
		function getRemote(o) {
			var remote, defaults;
			defaults = {
				url: null,
				cache: true,
				wildcard: "%QUERY",
				replace: null,
				rateLimitBy: "debounce",
				rateLimitWait: 300,
				send: null,
				filter: null,
				ajax: {}
			};
			if (remote = o.remote || null) {
				remote = _.isString(remote) ? {
					url: remote
				} : remote;
				remote = _.mixin(defaults, remote);
				remote.rateLimiter = /^throttle$/i.test(remote.rateLimitBy) ? byThrottle(remote.rateLimitWait) : byDebounce(remote.rateLimitWait);
				remote.ajax.type = remote.ajax.type || "GET";
				remote.ajax.dataType = remote.ajax.dataType || "json";
				delete remote.rateLimitBy;
				delete remote.rateLimitWait;
				!remote.url && $.error("remote requires url to be set");
			}
			return remote;
			function byDebounce(wait) {
				return function(fn) {
					return _.debounce(fn, wait);
				};
			}
			function byThrottle(wait) {
				return function(fn) {
					return _.throttle(fn, wait);
				};
			}
		}
	}();
	(function(root) {
		"use strict";
		var old, keys;
		old = root.Bloodhound;
		keys = {
			data: "data",
			protocol: "protocol",
			thumbprint: "thumbprint"
		};
		root.Bloodhound = Bloodhound;
		function Bloodhound(o) {
			if (!o || !o.local && !o.prefetch && !o.remote) {
				$.error("one of local, prefetch, or remote is required");
			}
			this.limit = o.limit || 5;
			this.sorter = getSorter(o.sorter);
			this.dupDetector = o.dupDetector || ignoreDuplicates;
			this.local = oParser.local(o);
			this.prefetch = oParser.prefetch(o);
			this.remote = oParser.remote(o);
			this.cacheKey = this.prefetch ? this.prefetch.cacheKey || this.prefetch.url : null;
			this.index = new SearchIndex({
				datumTokenizer: o.datumTokenizer,
				queryTokenizer: o.queryTokenizer
			});
			this.storage = this.cacheKey ? new PersistentStorage(this.cacheKey) : null;
		}
		Bloodhound.noConflict = function noConflict() {
			root.Bloodhound = old;
			return Bloodhound;
		};
		Bloodhound.tokenizers = tokenizers;
		_.mixin(Bloodhound.prototype, {
			_loadPrefetch: function loadPrefetch(o) {
				var that = this, serialized, deferred;
				if (serialized = this._readFromStorage(o.thumbprint)) {
					this.index.bootstrap(serialized);
					deferred = $.Deferred().resolve();
				} else {
					deferred = $.ajax(o.url, o.ajax).done(handlePrefetchResponse);
				}
				return deferred;
				function handlePrefetchResponse(resp) {
					that.clear();
					that.add(o.filter ? o.filter(resp) : resp);
					that._saveToStorage(that.index.serialize(), o.thumbprint, o.ttl);
				}
			},
			_getFromRemote: function getFromRemote(query, cb) {
				var that = this, url, uriEncodedQuery;
				if (!this.transport) {
					return;
				}
				query = query || "";
				uriEncodedQuery = encodeURIComponent(query);
				url = this.remote.replace ? this.remote.replace(this.remote.url, query) : this.remote.url.replace(this.remote.wildcard, uriEncodedQuery);
				return this.transport.get(url, this.remote.ajax, handleRemoteResponse);
				function handleRemoteResponse(err, resp) {
					err ? cb([]) : cb(that.remote.filter ? that.remote.filter(resp) : resp);
				}
			},
			_cancelLastRemoteRequest: function cancelLastRemoteRequest() {
				this.transport && this.transport.cancel();
			},
			_saveToStorage: function saveToStorage(data, thumbprint, ttl) {
				if (this.storage) {
					this.storage.set(keys.data, data, ttl);
					this.storage.set(keys.protocol, location.protocol, ttl);
					this.storage.set(keys.thumbprint, thumbprint, ttl);
				}
			},
			_readFromStorage: function readFromStorage(thumbprint) {
				var stored = {}, isExpired;
				if (this.storage) {
					stored.data = this.storage.get(keys.data);
					stored.protocol = this.storage.get(keys.protocol);
					stored.thumbprint = this.storage.get(keys.thumbprint);
				}
				isExpired = stored.thumbprint !== thumbprint || stored.protocol !== location.protocol;
				return stored.data && !isExpired ? stored.data : null;
			},
			_initialize: function initialize() {
				var that = this, local = this.local, deferred;
				deferred = this.prefetch ? this._loadPrefetch(this.prefetch) : $.Deferred().resolve();
				local && deferred.done(addLocalToIndex);
				this.transport = this.remote ? new Transport(this.remote) : null;
				return this.initPromise = deferred.promise();
				function addLocalToIndex() {
					that.add(_.isFunction(local) ? local() : local);
				}
			},
			initialize: function initialize(force) {
				return !this.initPromise || force ? this._initialize() : this.initPromise;
			},
			add: function add(data) {
				this.index.add(data);
			},
			get: function get(query, cb) {
				var that = this, matches = [], cacheHit = false;
				matches = this.index.get(query);
				matches = this.sorter(matches).slice(0, this.limit);
				matches.length < this.limit ? cacheHit = this._getFromRemote(query, returnRemoteMatches) : this._cancelLastRemoteRequest();
				if (!cacheHit) {
					(matches.length > 0 || !this.transport) && cb && cb(matches);
				}
				function returnRemoteMatches(remoteMatches) {
					var matchesWithBackfill = matches.slice(0);
					_.each(remoteMatches, function(remoteMatch) {
						var isDuplicate;
						isDuplicate = _.some(matchesWithBackfill, function(match) {
							return that.dupDetector(remoteMatch, match);
						});
						!isDuplicate && matchesWithBackfill.push(remoteMatch);
						return matchesWithBackfill.length < that.limit;
					});
					cb && cb(that.sorter(matchesWithBackfill));
				}
			},
			clear: function clear() {
				this.index.reset();
			},
			clearPrefetchCache: function clearPrefetchCache() {
				this.storage && this.storage.clear();
			},
			clearRemoteCache: function clearRemoteCache() {
				this.transport && Transport.resetCache();
			},
			ttAdapter: function ttAdapter() {
				return _.bind(this.get, this);
			}
		});
		return Bloodhound;
		function getSorter(sortFn) {
			return _.isFunction(sortFn) ? sort : noSort;
			function sort(array) {
				return array.sort(sortFn);
			}
			function noSort(array) {
				return array;
			}
		}
		function ignoreDuplicates() {
			return false;
		}
	})(this);
	var html = function() {
		return {
			wrapper: '<span class="twitter-typeahead"></span>',
			dropdown: '<span class="tt-dropdown-menu"></span>',
			dataset: '<div class="tt-dataset-%CLASS%"></div>',
			suggestions: '<span class="tt-suggestions"></span>',
			suggestion: '<div class="tt-suggestion"></div>'
		};
	}();
	var css = function() {
		"use strict";
		var css = {
			wrapper: {
				position: "relative",
				display: "inline-block"
			},
			hint: {
				position: "absolute",
				top: "0",
				left: "0",
				borderColor: "transparent",
				boxShadow: "none",
				opacity: "1"
			},
			input: {
				position: "relative",
				verticalAlign: "top",
				backgroundColor: "transparent"
			},
			inputWithNoHint: {
				position: "relative",
				verticalAlign: "top"
			},
			dropdown: {
				position: "absolute",
				top: "100%",
				left: "0",
				zIndex: "100",
				display: "none"
			},
			suggestions: {
				display: "block"
			},
			suggestion: {
				whiteSpace: "nowrap",
				cursor: "pointer"
			},
			suggestionChild: {
				whiteSpace: "normal"
			},
			ltr: {
				left: "0",
				right: "auto"
			},
			rtl: {
				left: "auto",
				right: " 0"
			}
		};
		if (_.isMsie()) {
			_.mixin(css.input, {
				backgroundImage: "url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)"
			});
		}
		if (_.isMsie() && _.isMsie() <= 7) {
			_.mixin(css.input, {
				marginTop: "-1px"
			});
		}
		return css;
	}();
	var EventBus = function() {
		"use strict";
		var namespace = "typeahead:";
		function EventBus(o) {
			if (!o || !o.el) {
				$.error("EventBus initialized without el");
			}
			this.$el = $(o.el);
		}
		_.mixin(EventBus.prototype, {
			trigger: function(type) {
				var args = [].slice.call(arguments, 1);
				this.$el.trigger(namespace + type, args);
			}
		});
		return EventBus;
	}();
	var EventEmitter = function() {
		"use strict";
		var splitter = /\s+/, nextTick = getNextTick();
		return {
			onSync: onSync,
			onAsync: onAsync,
			off: off,
			trigger: trigger
		};
		function on(method, types, cb, context) {
			var type;
			if (!cb) {
				return this;
			}
			types = types.split(splitter);
			cb = context ? bindContext(cb, context) : cb;
			this._callbacks = this._callbacks || {};
			while (type = types.shift()) {
				this._callbacks[type] = this._callbacks[type] || {
					sync: [],
					async: []
				};
				this._callbacks[type][method].push(cb);
			}
			return this;
		}
		function onAsync(types, cb, context) {
			return on.call(this, "async", types, cb, context);
		}
		function onSync(types, cb, context) {
			return on.call(this, "sync", types, cb, context);
		}
		function off(types) {
			var type;
			if (!this._callbacks) {
				return this;
			}
			types = types.split(splitter);
			while (type = types.shift()) {
				delete this._callbacks[type];
			}
			return this;
		}
		function trigger(types) {
			var type, callbacks, args, syncFlush, asyncFlush;
			if (!this._callbacks) {
				return this;
			}
			types = types.split(splitter);
			args = [].slice.call(arguments, 1);
			while ((type = types.shift()) && (callbacks = this._callbacks[type])) {
				syncFlush = getFlush(callbacks.sync, this, [ type ].concat(args));
				asyncFlush = getFlush(callbacks.async, this, [ type ].concat(args));
				syncFlush() && nextTick(asyncFlush);
			}
			return this;
		}
		function getFlush(callbacks, context, args) {
			return flush;
			function flush() {
				var cancelled;
				for (var i = 0, len = callbacks.length; !cancelled && i < len; i += 1) {
					cancelled = callbacks[i].apply(context, args) === false;
				}
				return !cancelled;
			}
		}
		function getNextTick() {
			var nextTickFn;
			if (window.setImmediate) {
				nextTickFn = function nextTickSetImmediate(fn) {
					setImmediate(function() {
						fn();
					});
				};
			} else {
				nextTickFn = function nextTickSetTimeout(fn) {
					setTimeout(function() {
						fn();
					}, 0);
				};
			}
			return nextTickFn;
		}
		function bindContext(fn, context) {
			return fn.bind ? fn.bind(context) : function() {
				fn.apply(context, [].slice.call(arguments, 0));
			};
		}
	}();
	


	var highlight = (function(doc) {
	  'use strict';

	  var defaults = {
			node: null,
			pattern: null,
			tagName: 'strong',
			className: null,
			wordsOnly: false,
			caseSensitive: false,
			diacriticInsensitive: true
		  };
		  
	  // used for diacritic insensitivity
	  var accented = {
		'A': '[Aa\xaa\xc0-\xc5\xe0-\xe5\u0100-\u0105\u01cd\u01ce\u0200-\u0203\u0226\u0227\u1d2c\u1d43\u1e00\u1e01\u1e9a\u1ea0-\u1ea3\u2090\u2100\u2101\u213b\u249c\u24b6\u24d0\u3371-\u3374\u3380-\u3384\u3388\u3389\u33a9-\u33af\u33c2\u33ca\u33df\u33ff\uff21\uff41]',
		'B': '[Bb\u1d2e\u1d47\u1e02-\u1e07\u212c\u249d\u24b7\u24d1\u3374\u3385-\u3387\u33c3\u33c8\u33d4\u33dd\uff22\uff42]',
		'C': '[Cc\xc7\xe7\u0106-\u010d\u1d9c\u2100\u2102\u2103\u2105\u2106\u212d\u216d\u217d\u249e\u24b8\u24d2\u3376\u3388\u3389\u339d\u33a0\u33a4\u33c4-\u33c7\uff23\uff43]',
		'D': '[Dd\u010e\u010f\u01c4-\u01c6\u01f1-\u01f3\u1d30\u1d48\u1e0a-\u1e13\u2145\u2146\u216e\u217e\u249f\u24b9\u24d3\u32cf\u3372\u3377-\u3379\u3397\u33ad-\u33af\u33c5\u33c8\uff24\uff44]',
		'E': '[Ee\xc8-\xcb\xe8-\xeb\u0112-\u011b\u0204-\u0207\u0228\u0229\u1d31\u1d49\u1e18-\u1e1b\u1eb8-\u1ebd\u2091\u2121\u212f\u2130\u2147\u24a0\u24ba\u24d4\u3250\u32cd\u32ce\uff25\uff45]',
		'F': '[Ff\u1da0\u1e1e\u1e1f\u2109\u2131\u213b\u24a1\u24bb\u24d5\u338a-\u338c\u3399\ufb00-\ufb04\uff26\uff46]',
		'G': '[Gg\u011c-\u0123\u01e6\u01e7\u01f4\u01f5\u1d33\u1d4d\u1e20\u1e21\u210a\u24a2\u24bc\u24d6\u32cc\u32cd\u3387\u338d-\u338f\u3393\u33ac\u33c6\u33c9\u33d2\u33ff\uff27\uff47]',
		'H': '[Hh\u0124\u0125\u021e\u021f\u02b0\u1d34\u1e22-\u1e2b\u1e96\u210b-\u210e\u24a3\u24bd\u24d7\u32cc\u3371\u3390-\u3394\u33ca\u33cb\u33d7\uff28\uff48]',
		'I': '[Ii\xcc-\xcf\xec-\xef\u0128-\u0130\u0132\u0133\u01cf\u01d0\u0208-\u020b\u1d35\u1d62\u1e2c\u1e2d\u1ec8-\u1ecb\u2071\u2110\u2111\u2139\u2148\u2160-\u2163\u2165-\u2168\u216a\u216b\u2170-\u2173\u2175-\u2178\u217a\u217b\u24a4\u24be\u24d8\u337a\u33cc\u33d5\ufb01\ufb03\uff29\uff49]',
		'J': '[Jj\u0132-\u0135\u01c7-\u01cc\u01f0\u02b2\u1d36\u2149\u24a5\u24bf\u24d9\u2c7c\uff2a\uff4a]',
		'K': '[Kk\u0136\u0137\u01e8\u01e9\u1d37\u1d4f\u1e30-\u1e35\u212a\u24a6\u24c0\u24da\u3384\u3385\u3389\u338f\u3391\u3398\u339e\u33a2\u33a6\u33aa\u33b8\u33be\u33c0\u33c6\u33cd-\u33cf\uff2b\uff4b]',
		'L': '[Ll\u0139-\u0140\u01c7-\u01c9\u02e1\u1d38\u1e36\u1e37\u1e3a-\u1e3d\u2112\u2113\u2121\u216c\u217c\u24a7\u24c1\u24db\u32cf\u3388\u3389\u33d0-\u33d3\u33d5\u33d6\u33ff\ufb02\ufb04\uff2c\uff4c]',
		'M': '[Mm\u1d39\u1d50\u1e3e-\u1e43\u2120\u2122\u2133\u216f\u217f\u24a8\u24c2\u24dc\u3377-\u3379\u3383\u3386\u338e\u3392\u3396\u3399-\u33a8\u33ab\u33b3\u33b7\u33b9\u33bd\u33bf\u33c1\u33c2\u33ce\u33d0\u33d4-\u33d6\u33d8\u33d9\u33de\u33df\uff2d\uff4d]',
		'N': '[Nn\xd1\xf1\u0143-\u0149\u01ca-\u01cc\u01f8\u01f9\u1d3a\u1e44-\u1e4b\u207f\u2115\u2116\u24a9\u24c3\u24dd\u3381\u338b\u339a\u33b1\u33b5\u33bb\u33cc\u33d1\uff2e\uff4e]',
		'O': '[Oo\xba\xd2-\xd6\xf2-\xf6\u014c-\u0151\u01a0\u01a1\u01d1\u01d2\u01ea\u01eb\u020c-\u020f\u022e\u022f\u1d3c\u1d52\u1ecc-\u1ecf\u2092\u2105\u2116\u2134\u24aa\u24c4\u24de\u3375\u33c7\u33d2\u33d6\uff2f\uff4f]',
		'P': '[Pp\u1d3e\u1d56\u1e54-\u1e57\u2119\u24ab\u24c5\u24df\u3250\u3371\u3376\u3380\u338a\u33a9-\u33ac\u33b0\u33b4\u33ba\u33cb\u33d7-\u33da\uff30\uff50]',
		'Q': '[Qq\u211a\u24ac\u24c6\u24e0\u33c3\uff31\uff51]',
		'R': '[Rr\u0154-\u0159\u0210-\u0213\u02b3\u1d3f\u1d63\u1e58-\u1e5b\u1e5e\u1e5f\u20a8\u211b-\u211d\u24ad\u24c7\u24e1\u32cd\u3374\u33ad-\u33af\u33da\u33db\uff32\uff52]',
		'S': '[Ss\u015a-\u0161\u017f\u0218\u0219\u02e2\u1e60-\u1e63\u20a8\u2101\u2120\u24ae\u24c8\u24e2\u33a7\u33a8\u33ae-\u33b3\u33db\u33dc\ufb06\uff33\uff53]',
		'T': '[Tt\u0162-\u0165\u021a\u021b\u1d40\u1d57\u1e6a-\u1e71\u1e97\u2121\u2122\u24af\u24c9\u24e3\u3250\u32cf\u3394\u33cf\ufb05\ufb06\uff34\uff54]',
		'U': '[Uu\xd9-\xdc\xf9-\xfc\u0168-\u0173\u01af\u01b0\u01d3\u01d4\u0214-\u0217\u1d41\u1d58\u1d64\u1e72-\u1e77\u1ee4-\u1ee7\u2106\u24b0\u24ca\u24e4\u3373\u337a\uff35\uff55]',
		'V': '[Vv\u1d5b\u1d65\u1e7c-\u1e7f\u2163-\u2167\u2173-\u2177\u24b1\u24cb\u24e5\u2c7d\u32ce\u3375\u33b4-\u33b9\u33dc\u33de\uff36\uff56]',
		'W': '[Ww\u0174\u0175\u02b7\u1d42\u1e80-\u1e89\u1e98\u24b2\u24cc\u24e6\u33ba-\u33bf\u33dd\uff37\uff57]',
		'X': '[Xx\u02e3\u1e8a-\u1e8d\u2093\u213b\u2168-\u216b\u2178-\u217b\u24b3\u24cd\u24e7\u33d3\uff38\uff58]',
		'Y': '[Yy\xdd\xfd\xff\u0176-\u0178\u0232\u0233\u02b8\u1e8e\u1e8f\u1e99\u1ef2-\u1ef9\u24b4\u24ce\u24e8\u33c9\uff39\uff59]',
		'Z': '[Zz\u0179-\u017e\u01f1-\u01f3\u1dbb\u1e90-\u1e95\u2124\u2128\u24b5\u24cf\u24e9\u3390-\u3394\uff3a\uff5a]'
	  };

	  return function hightlight(o) {
		var regex;

		o = _.mixin({}, defaults, o);

		if (!o.node || !o.pattern) {
		  // fail silently
		  return;
		}

		// support wrapping multiple patterns
		o.pattern = _.isArray(o.pattern) ? o.pattern : [o.pattern];

		regex = getRegex(o.pattern, o.caseSensitive, o.wordsOnly, o.diacriticInsensitive);
		traverse(o.node, hightlightTextNode);

		function hightlightTextNode(textNode) {
		  var match, patternNode, wrapperNode;

		  if (match = regex.exec(textNode.data)) {
			wrapperNode = doc.createElement(o.tagName);
			o.className && (wrapperNode.className = o.className);

			patternNode = textNode.splitText(match.index);
			patternNode.splitText(match[0].length);
			wrapperNode.appendChild(patternNode.cloneNode(true));

			textNode.parentNode.replaceChild(wrapperNode, patternNode);
		  }

		  return !!match;
		}

		function traverse(el, hightlightTextNode) {
		  var childNode, TEXT_NODE_TYPE = 3;

		  for (var i = 0; i < el.childNodes.length; i++) {
			childNode = el.childNodes[i];

			if (childNode.nodeType === TEXT_NODE_TYPE) {
			  i += hightlightTextNode(childNode) ? 1 : 0;
			}

			else {
			  traverse(childNode, hightlightTextNode);
			}
		  }
		}
	  };

	  // replace characters by their compositors
	  // custom for diacritic insensitivity
	  function accent_replacer(chr) {
		  return accented[chr.toUpperCase()] || chr;
	  }
	  function getRegex(patterns, caseSensitive, wordsOnly, diacriticInsensitive) {
		  var escapedPatterns = [], regexStr;
		  for (var i = 0, len = patterns.length; i < len; i++) {
			  var escapedWord = _.escapeRegExChars(patterns[i]);
			  // added for diacritic insensitivity
			  if(diacriticInsensitive){
				var escapedWord = escapedWord.replace(/\S/g,accent_replacer);
			  }
			  escapedPatterns.push(escapedWord);
		  }
		  regexStr = wordsOnly ? "\\b(" + escapedPatterns.join("|") + ")\\b" : "(" + escapedPatterns.join("|") + ")";
		  return caseSensitive ? new RegExp(regexStr) : new RegExp(regexStr, "i");
	  }
	})(window.document);











	var Input = function() {
		"use strict";
		var specialKeyCodeMap;
		specialKeyCodeMap = {
			9: "tab",
			27: "esc",
			37: "left",
			39: "right",
			13: "enter",
			38: "up",
			40: "down"
		};
		function Input(o) {
			var that = this, onBlur, onFocus, onKeydown, onInput;
			o = o || {};
			if (!o.input) {
				$.error("input is missing");
			}
			onBlur = _.bind(this._onBlur, this);
			onFocus = _.bind(this._onFocus, this);
			onKeydown = _.bind(this._onKeydown, this);
			onInput = _.bind(this._onInput, this);
			this.$hint = $(o.hint);
			this.$input = $(o.input).on("blur.tt", onBlur).on("focus.tt", onFocus).on("keydown.tt", onKeydown);
			if (this.$hint.length === 0) {
				this.setHint = this.getHint = this.clearHint = this.clearHintIfInvalid = _.noop;
			}
			if (!_.isMsie()) {
				this.$input.on("input.tt", onInput);
			} else {
				this.$input.on("keydown.tt keypress.tt cut.tt paste.tt", function($e) {
					if (specialKeyCodeMap[$e.which || $e.keyCode]) {
						return;
					}
					_.defer(_.bind(that._onInput, that, $e));
				});
			}
			this.query = this.$input.val();
			this.$overflowHelper = buildOverflowHelper(this.$input);
		}
		Input.normalizeQuery = function(str) {
			return (str || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
		};
		_.mixin(Input.prototype, EventEmitter, {
			_onBlur: function onBlur() {
				this.resetInputValue();
				this.trigger("blurred");
			},
			_onFocus: function onFocus() {
				this.trigger("focused");
			},
			_onKeydown: function onKeydown($e) {
				var keyName = specialKeyCodeMap[$e.which || $e.keyCode];
				this._managePreventDefault(keyName, $e);
				if (keyName && this._shouldTrigger(keyName, $e)) {
					this.trigger(keyName + "Keyed", $e);
				}
			},
			_onInput: function onInput() {
				this._checkInputValue();
			},
			_managePreventDefault: function managePreventDefault(keyName, $e) {
				var preventDefault, hintValue, inputValue;
				switch (keyName) {
				  case "tab":
					hintValue = this.getHint();
					inputValue = this.getInputValue();
					preventDefault = hintValue && hintValue !== inputValue && !withModifier($e);
					break;

				  case "up":
				  case "down":
					preventDefault = !withModifier($e);
					break;

				  default:
					preventDefault = false;
				}
				preventDefault && $e.preventDefault();
			},
			_shouldTrigger: function shouldTrigger(keyName, $e) {
				var trigger;
				switch (keyName) {
				  case "tab":
					trigger = !withModifier($e);
					break;

				  default:
					trigger = true;
				}
				return trigger;
			},
			_checkInputValue: function checkInputValue() {
				var inputValue, areEquivalent, hasDifferentWhitespace;
				inputValue = this.getInputValue();
				areEquivalent = areQueriesEquivalent(inputValue, this.query);
				hasDifferentWhitespace = areEquivalent ? this.query.length !== inputValue.length : false;
				this.query = inputValue;
				if (!areEquivalent) {
					this.trigger("queryChanged", this.query);
				} else if (hasDifferentWhitespace) {
					this.trigger("whitespaceChanged", this.query);
				}
			},
			focus: function focus() {
				this.$input.focus();
			},
			blur: function blur() {
				this.$input.blur();
			},
			getQuery: function getQuery() {
				return this.query;
			},
			setQuery: function setQuery(query) {
				this.query = query;
			},
			getInputValue: function getInputValue() {
				return this.$input.val();
			},
			setInputValue: function setInputValue(value, silent) {
				this.$input.val(value);
				silent ? this.clearHint() : this._checkInputValue();
			},
			resetInputValue: function resetInputValue() {
				this.setInputValue(this.query, true);
			},
			getHint: function getHint() {
				return this.$hint.val();
			},
			setHint: function setHint(value) {
				this.$hint.val(value);
			},
			clearHint: function clearHint() {
				this.setHint("");
			},
			clearHintIfInvalid: function clearHintIfInvalid() {
				var val, hint, valIsPrefixOfHint, isValid;
				val = this.getInputValue();
				hint = this.getHint();
				valIsPrefixOfHint = val !== hint && hint.indexOf(val) === 0;
				isValid = val !== "" && valIsPrefixOfHint && !this.hasOverflow();
				!isValid && this.clearHint();
			},
			getLanguageDirection: function getLanguageDirection() {
				return (this.$input.css("direction") || "ltr").toLowerCase();
			},
			hasOverflow: function hasOverflow() {
				var constraint = this.$input.width() - 2;
				this.$overflowHelper.text(this.getInputValue());
				return this.$overflowHelper.width() >= constraint;
			},
			isCursorAtEnd: function() {
				var valueLength, selectionStart, range;
				valueLength = this.$input.val().length;
				selectionStart = this.$input[0].selectionStart;
				if (_.isNumber(selectionStart)) {
					return selectionStart === valueLength;
				} else if (document.selection) {
					range = document.selection.createRange();
					range.moveStart("character", -valueLength);
					return valueLength === range.text.length;
				}
				return true;
			},
			destroy: function destroy() {
				this.$hint.off(".tt");
				this.$input.off(".tt");
				this.$hint = this.$input = this.$overflowHelper = null;
			}
		});
		return Input;
		function buildOverflowHelper($input) {
			return $('<pre aria-hidden="true"></pre>').css({
				position: "absolute",
				visibility: "hidden",
				whiteSpace: "pre",
				fontFamily: $input.css("font-family"),
				fontSize: $input.css("font-size"),
				fontStyle: $input.css("font-style"),
				fontVariant: $input.css("font-variant"),
				fontWeight: $input.css("font-weight"),
				wordSpacing: $input.css("word-spacing"),
				letterSpacing: $input.css("letter-spacing"),
				textIndent: $input.css("text-indent"),
				textRendering: $input.css("text-rendering"),
				textTransform: $input.css("text-transform")
			}).insertAfter($input);
		}
		function areQueriesEquivalent(a, b) {
			return Input.normalizeQuery(a) === Input.normalizeQuery(b);
		}
		function withModifier($e) {
			return $e.altKey || $e.ctrlKey || $e.metaKey || $e.shiftKey;
		}
	}();
	var Dataset = function() {
		"use strict";
		var datasetKey = "ttDataset", valueKey = "ttValue", datumKey = "ttDatum";
		function Dataset(o) {
			o = o || {};
			o.templates = o.templates || {};
			if (!o.source) {
				$.error("missing source");
			}
			if (o.name && !isValidName(o.name)) {
				$.error("invalid dataset name: " + o.name);
			}
			this.query = null;
			this.highlight = !!o.highlight;
			this.name = o.name || _.getUniqueId();
			this.source = o.source;
			this.displayFn = getDisplayFn(o.display || o.displayKey);
			this.templates = getTemplates(o.templates, this.displayFn);
			this.$el = $(html.dataset.replace("%CLASS%", this.name));
		}
		Dataset.extractDatasetName = function extractDatasetName(el) {
			return $(el).data(datasetKey);
		};
		Dataset.extractValue = function extractDatum(el) {
			return $(el).data(valueKey);
		};
		Dataset.extractDatum = function extractDatum(el) {
			return $(el).data(datumKey);
		};
		_.mixin(Dataset.prototype, EventEmitter, {
			_render: function render(query, suggestions) {
				if (!this.$el) {
					return;
				}
				var that = this, hasSuggestions;
				this.$el.empty();
				hasSuggestions = suggestions && suggestions.length;
				if (!hasSuggestions && this.templates.empty) {
					this.$el.html(getEmptyHtml()).prepend(that.templates.header ? getHeaderHtml() : null).append(that.templates.footer ? getFooterHtml() : null);
				} else if (hasSuggestions) {
					this.$el.html(getSuggestionsHtml()).prepend(that.templates.header ? getHeaderHtml() : null).append(that.templates.footer ? getFooterHtml() : null);
				}
				this.trigger("rendered");
				function getEmptyHtml() {
					return that.templates.empty({
						query: query,
						isEmpty: true
					});
				}
				function getSuggestionsHtml() {
					var $suggestions, nodes;
					$suggestions = $(html.suggestions).css(css.suggestions);
					nodes = _.map(suggestions, getSuggestionNode);
					$suggestions.append.apply($suggestions, nodes);
					that.highlight && highlight({
						className: "tt-highlight",
						node: $suggestions[0],
						pattern: query
					});
					return $suggestions;
					function getSuggestionNode(suggestion) {
						var $el;
						$el = $(html.suggestion).append(that.templates.suggestion(suggestion)).data(datasetKey, that.name).data(valueKey, that.displayFn(suggestion)).data(datumKey, suggestion);
						$el.children().each(function() {
							$(this).css(css.suggestionChild);
						});
						return $el;
					}
				}
				function getHeaderHtml() {
					return that.templates.header({
						query: query,
						isEmpty: !hasSuggestions
					});
				}
				function getFooterHtml() {
					return that.templates.footer({
						query: query,
						isEmpty: !hasSuggestions
					});
				}
			},
			getRoot: function getRoot() {
				return this.$el;
			},
			update: function update(query) {
				var that = this;
				this.query = query;
				this.canceled = false;
				this.source(query, render);
				function render(suggestions) {
					if (!that.canceled && query === that.query) {
						that._render(query, suggestions);
					}
				}
			},
			cancel: function cancel() {
				this.canceled = true;
			},
			clear: function clear() {
				this.cancel();
				this.$el.empty();
				this.trigger("rendered");
			},
			isEmpty: function isEmpty() {
				return this.$el.is(":empty");
			},
			destroy: function destroy() {
				this.$el = null;
			}
		});
		return Dataset;
		function getDisplayFn(display) {
			display = display || "value";
			return _.isFunction(display) ? display : displayFn;
			function displayFn(obj) {
				return obj[display];
			}
		}
		function getTemplates(templates, displayFn) {
			return {
				empty: templates.empty && _.templatify(templates.empty),
				header: templates.header && _.templatify(templates.header),
				footer: templates.footer && _.templatify(templates.footer),
				suggestion: templates.suggestion || suggestionTemplate
			};
			function suggestionTemplate(context) {
				return "<p>" + displayFn(context) + "</p>";
			}
		}
		function isValidName(str) {
			return /^[_a-zA-Z0-9-]+$/.test(str);
		}
	}();
	var Dropdown = function() {
		"use strict";
		function Dropdown(o) {
			var that = this, onSuggestionClick, onSuggestionMouseEnter, onSuggestionMouseLeave;
			o = o || {};
			if (!o.menu) {
				$.error("menu is required");
			}
			this.isOpen = false;
			this.isEmpty = true;
			this.datasets = _.map(o.datasets, initializeDataset);
			onSuggestionClick = _.bind(this._onSuggestionClick, this);
			onSuggestionMouseEnter = _.bind(this._onSuggestionMouseEnter, this);
			onSuggestionMouseLeave = _.bind(this._onSuggestionMouseLeave, this);
			this.$menu = $(o.menu).on("click.tt", ".tt-suggestion", onSuggestionClick).on("mouseenter.tt", ".tt-suggestion", onSuggestionMouseEnter).on("mouseleave.tt", ".tt-suggestion", onSuggestionMouseLeave);
			_.each(this.datasets, function(dataset) {
				that.$menu.append(dataset.getRoot());
				dataset.onSync("rendered", that._onRendered, that);
			});
		}
		_.mixin(Dropdown.prototype, EventEmitter, {
			_onSuggestionClick: function onSuggestionClick($e) {
				this.trigger("suggestionClicked", $($e.currentTarget));
			},
			_onSuggestionMouseEnter: function onSuggestionMouseEnter($e) {
				this._removeCursor();
				this._setCursor($($e.currentTarget), true);
			},
			_onSuggestionMouseLeave: function onSuggestionMouseLeave() {
				this._removeCursor();
			},
			_onRendered: function onRendered() {
				this.isEmpty = _.every(this.datasets, isDatasetEmpty);
				this.isEmpty ? this._hide() : this.isOpen && this._show();
				this.trigger("datasetRendered");
				function isDatasetEmpty(dataset) {
					return dataset.isEmpty();
				}
			},
			_hide: function() {
				this.$menu.hide();
			},
			_show: function() {
				this.$menu.css("display", "block");
			},
			_getSuggestions: function getSuggestions() {
				return this.$menu.find(".tt-suggestion");
			},
			_getCursor: function getCursor() {
				return this.$menu.find(".tt-cursor").first();
			},
			_setCursor: function setCursor($el, silent) {
				$el.first().addClass("tt-cursor");
				!silent && this.trigger("cursorMoved");
			},
			_removeCursor: function removeCursor() {
				this._getCursor().removeClass("tt-cursor");
			},
			_moveCursor: function moveCursor(increment) {
				var $suggestions, $oldCursor, newCursorIndex, $newCursor;
				if (!this.isOpen) {
					return;
				}
				$oldCursor = this._getCursor();
				$suggestions = this._getSuggestions();
				this._removeCursor();
				newCursorIndex = $suggestions.index($oldCursor) + increment;
				newCursorIndex = (newCursorIndex + 1) % ($suggestions.length + 1) - 1;
				if (newCursorIndex === -1) {
					this.trigger("cursorRemoved");
					return;
				} else if (newCursorIndex < -1) {
					newCursorIndex = $suggestions.length - 1;
				}
				this._setCursor($newCursor = $suggestions.eq(newCursorIndex));
				this._ensureVisible($newCursor);
			},
			_ensureVisible: function ensureVisible($el) {
				var elTop, elBottom, menuScrollTop, menuHeight;
				elTop = $el.position().top;
				elBottom = elTop + $el.outerHeight(true);
				menuScrollTop = this.$menu.scrollTop();
				menuHeight = this.$menu.height() + parseInt(this.$menu.css("paddingTop"), 10) + parseInt(this.$menu.css("paddingBottom"), 10);
				if (elTop < 0) {
					this.$menu.scrollTop(menuScrollTop + elTop);
				} else if (menuHeight < elBottom) {
					this.$menu.scrollTop(menuScrollTop + (elBottom - menuHeight));
				}
			},
			close: function close() {
				if (this.isOpen) {
					this.isOpen = false;
					this._removeCursor();
					this._hide();
					this.trigger("closed");
				}
			},
			open: function open() {
				if (!this.isOpen) {
					this.isOpen = true;
					!this.isEmpty && this._show();
					this.trigger("opened");
				}
			},
			setLanguageDirection: function setLanguageDirection(dir) {
				this.$menu.css(dir === "ltr" ? css.ltr : css.rtl);
			},
			moveCursorUp: function moveCursorUp() {
				this._moveCursor(-1);
			},
			moveCursorDown: function moveCursorDown() {
				this._moveCursor(+1);
			},
			getDatumForSuggestion: function getDatumForSuggestion($el) {
				var datum = null;
				if ($el.length) {
					datum = {
						raw: Dataset.extractDatum($el),
						value: Dataset.extractValue($el),
						datasetName: Dataset.extractDatasetName($el)
					};
				}
				return datum;
			},
			getDatumForCursor: function getDatumForCursor() {
				return this.getDatumForSuggestion(this._getCursor().first());
			},
			getDatumForTopSuggestion: function getDatumForTopSuggestion() {
				return this.getDatumForSuggestion(this._getSuggestions().first());
			},
			update: function update(query) {
				_.each(this.datasets, updateDataset);
				function updateDataset(dataset) {
					dataset.update(query);
				}
			},
			empty: function empty() {
				_.each(this.datasets, clearDataset);
				this.isEmpty = true;
				function clearDataset(dataset) {
					dataset.clear();
				}
			},
			isVisible: function isVisible() {
				return this.isOpen && !this.isEmpty;
			},
			destroy: function destroy() {
				this.$menu.off(".tt");
				this.$menu = null;
				_.each(this.datasets, destroyDataset);
				function destroyDataset(dataset) {
					dataset.destroy();
				}
			}
		});
		return Dropdown;
		function initializeDataset(oDataset) {
			return new Dataset(oDataset);
		}
	}();
	var Typeahead = function() {
		"use strict";
		var attrsKey = "ttAttrs";
		function Typeahead(o) {
			var $menu, $input, $hint;
			o = o || {};
			if (!o.input) {
				$.error("missing input");
			}
			this.isActivated = false;
			this.autoselect = !!o.autoselect;
			this.minLength = _.isNumber(o.minLength) ? o.minLength : 1;
			this.$node = buildDom(o.input, o.withHint);
			$menu = this.$node.find(".tt-dropdown-menu");
			$input = this.$node.find(".tt-input");
			$hint = this.$node.find(".tt-hint");
			$input.on("blur.tt", function($e) {
				var active, isActive, hasActive;
				active = document.activeElement;
				isActive = $menu.is(active);
				hasActive = $menu.has(active).length > 0;
				if (_.isMsie() && (isActive || hasActive)) {
					$e.preventDefault();
					$e.stopImmediatePropagation();
					_.defer(function() {
						$input.focus();
					});
				}
			});
			$menu.on("mousedown.tt", function($e) {
				$e.preventDefault();
			});
			this.eventBus = o.eventBus || new EventBus({
				el: $input
			});
			this.dropdown = new Dropdown({
				menu: $menu,
				datasets: o.datasets
			}).onSync("suggestionClicked", this._onSuggestionClicked, this).onSync("cursorMoved", this._onCursorMoved, this).onSync("cursorRemoved", this._onCursorRemoved, this).onSync("opened", this._onOpened, this).onSync("closed", this._onClosed, this).onAsync("datasetRendered", this._onDatasetRendered, this);
			this.input = new Input({
				input: $input,
				hint: $hint
			}).onSync("focused", this._onFocused, this).onSync("blurred", this._onBlurred, this).onSync("enterKeyed", this._onEnterKeyed, this).onSync("tabKeyed", this._onTabKeyed, this).onSync("escKeyed", this._onEscKeyed, this).onSync("upKeyed", this._onUpKeyed, this).onSync("downKeyed", this._onDownKeyed, this).onSync("leftKeyed", this._onLeftKeyed, this).onSync("rightKeyed", this._onRightKeyed, this).onSync("queryChanged", this._onQueryChanged, this).onSync("whitespaceChanged", this._onWhitespaceChanged, this);
			this._setLanguageDirection();
		}
		_.mixin(Typeahead.prototype, {
			_onSuggestionClicked: function onSuggestionClicked(type, $el) {
				var datum;
				if (datum = this.dropdown.getDatumForSuggestion($el)) {
					this._select(datum);
				}
			},
			_onCursorMoved: function onCursorMoved() {
				var datum = this.dropdown.getDatumForCursor();
				this.input.setInputValue(datum.value, true);
				this.eventBus.trigger("cursorchanged", datum.raw, datum.datasetName);
			},
			_onCursorRemoved: function onCursorRemoved() {
				this.input.resetInputValue();
				this._updateHint();
			},
			_onDatasetRendered: function onDatasetRendered() {
				this._updateHint();
			},
			_onOpened: function onOpened() {
				this._updateHint();
				this.eventBus.trigger("opened");
			},
			_onClosed: function onClosed() {
				this.input.clearHint();
				this.eventBus.trigger("closed");
			},
			_onFocused: function onFocused() {
				this.isActivated = true;
				this.dropdown.open();
			},
			_onBlurred: function onBlurred() {
				this.isActivated = false;
				this.dropdown.empty();
				this.dropdown.close();
			},
			_onEnterKeyed: function onEnterKeyed(type, $e) {
				var cursorDatum, topSuggestionDatum;
				cursorDatum = this.dropdown.getDatumForCursor();
				topSuggestionDatum = this.dropdown.getDatumForTopSuggestion();
				if (cursorDatum) {
					this._select(cursorDatum);
					$e.preventDefault();
				} else if (this.autoselect && topSuggestionDatum) {
					this._select(topSuggestionDatum);
					$e.preventDefault();
				}
			},
			_onTabKeyed: function onTabKeyed(type, $e) {
				var datum;
				if (datum = this.dropdown.getDatumForCursor()) {
					this._select(datum);
					$e.preventDefault();
				} else {
					this._autocomplete(true);
				}
			},
			_onEscKeyed: function onEscKeyed() {
				this.dropdown.close();
				this.input.resetInputValue();
			},
			_onUpKeyed: function onUpKeyed() {
				var query = this.input.getQuery();
				this.dropdown.isEmpty && query.length >= this.minLength ? this.dropdown.update(query) : this.dropdown.moveCursorUp();
				this.dropdown.open();
			},
			_onDownKeyed: function onDownKeyed() {
				var query = this.input.getQuery();
				this.dropdown.isEmpty && query.length >= this.minLength ? this.dropdown.update(query) : this.dropdown.moveCursorDown();
				this.dropdown.open();
			},
			_onLeftKeyed: function onLeftKeyed() {
				this.dir === "rtl" && this._autocomplete();
			},
			_onRightKeyed: function onRightKeyed() {
				this.dir === "ltr" && this._autocomplete();
			},
			_onQueryChanged: function onQueryChanged(e, query) {
				this.input.clearHintIfInvalid();
				query.length >= this.minLength ? this.dropdown.update(query) : this.dropdown.empty();
				this.dropdown.open();
				this._setLanguageDirection();
			},
			_onWhitespaceChanged: function onWhitespaceChanged() {
				this._updateHint();
				this.dropdown.open();
			},
			_setLanguageDirection: function setLanguageDirection() {
				var dir;
				if (this.dir !== (dir = this.input.getLanguageDirection())) {
					this.dir = dir;
					this.$node.css("direction", dir);
					this.dropdown.setLanguageDirection(dir);
				}
			},
			_updateHint: function updateHint() {
				var datum, val, query, escapedQuery, frontMatchRegEx, match;
				datum = this.dropdown.getDatumForTopSuggestion();
				if (datum && this.dropdown.isVisible() && !this.input.hasOverflow()) {
					val = this.input.getInputValue();
					query = Input.normalizeQuery(val);
					escapedQuery = _.escapeRegExChars(query);
					frontMatchRegEx = new RegExp("^(?:" + escapedQuery + ")(.+$)", "i");
					match = frontMatchRegEx.exec(datum.value);
					match ? this.input.setHint(val + match[1]) : this.input.clearHint();
				} else {
					this.input.clearHint();
				}
			},
			_autocomplete: function autocomplete(laxCursor) {
				var hint, query, isCursorAtEnd, datum;
				hint = this.input.getHint();
				query = this.input.getQuery();
				isCursorAtEnd = laxCursor || this.input.isCursorAtEnd();
				if (hint && query !== hint && isCursorAtEnd) {
					datum = this.dropdown.getDatumForTopSuggestion();
					datum && this.input.setInputValue(datum.value);
					this.eventBus.trigger("autocompleted", datum.raw, datum.datasetName);
				}
			},
			_select: function select(datum) {
				this.input.setQuery(datum.value);
				this.input.setInputValue(datum.value, true);
				this._setLanguageDirection();
				this.eventBus.trigger("selected", datum.raw, datum.datasetName);
				this.dropdown.close();
				_.defer(_.bind(this.dropdown.empty, this.dropdown));
			},
			open: function open() {
				this.dropdown.open();
			},
			close: function close() {
				this.dropdown.close();
			},
			setVal: function setVal(val) {
				val = _.toStr(val);
				if (this.isActivated) {
					this.input.setInputValue(val);
				} else {
					this.input.setQuery(val);
					this.input.setInputValue(val, true);
				}
				this._setLanguageDirection();
			},
			getVal: function getVal() {
				return this.input.getQuery();
			},
			destroy: function destroy() {
				this.input.destroy();
				this.dropdown.destroy();
				destroyDomStructure(this.$node);
				this.$node = null;
			}
		});
		return Typeahead;
		function buildDom(input, withHint) {
			var $input, $wrapper, $dropdown, $hint;
			$input = $(input);
			$wrapper = $(html.wrapper).css(css.wrapper);
			$dropdown = $(html.dropdown).css(css.dropdown);
			$hint = $input.clone().css(css.hint).css(getBackgroundStyles($input));
			$hint.val("").removeData().addClass("tt-hint").removeAttr("id name placeholder required").prop("readonly", true).attr({
				autocomplete: "off",
				spellcheck: "false",
				tabindex: -1
			});
			$input.data(attrsKey, {
				dir: $input.attr("dir"),
				autocomplete: $input.attr("autocomplete"),
				spellcheck: $input.attr("spellcheck"),
				style: $input.attr("style")
			});
			$input.addClass("tt-input").attr({
				autocomplete: "off",
				spellcheck: false
			}).css(withHint ? css.input : css.inputWithNoHint);
			try {
				!$input.attr("dir") && $input.attr("dir", "auto");
			} catch (e) {}
			return $input.wrap($wrapper).parent().prepend(withHint ? $hint : null).append($dropdown);
		}
		function getBackgroundStyles($el) {
			return {
				backgroundAttachment: $el.css("background-attachment"),
				backgroundClip: $el.css("background-clip"),
				backgroundColor: $el.css("background-color"),
				backgroundImage: $el.css("background-image"),
				backgroundOrigin: $el.css("background-origin"),
				backgroundPosition: $el.css("background-position"),
				backgroundRepeat: $el.css("background-repeat"),
				backgroundSize: $el.css("background-size")
			};
		}
		function destroyDomStructure($node) {
			var $input = $node.find(".tt-input");
			_.each($input.data(attrsKey), function(val, key) {
				_.isUndefined(val) ? $input.removeAttr(key) : $input.attr(key, val);
			});
			$input.detach().removeData(attrsKey).removeClass("tt-input").insertAfter($node);
			$node.remove();
		}
	}();
	(function() {
		"use strict";
		var old, typeaheadKey, methods;
		old = $.fn.typeahead;
		typeaheadKey = "ttTypeahead";
		methods = {
			initialize: function initialize(o, datasets) {
				datasets = _.isArray(datasets) ? datasets : [].slice.call(arguments, 1);
				o = o || {};
				return this.each(attach);
				function attach() {
					var $input = $(this), eventBus, typeahead;
					_.each(datasets, function(d) {
						d.highlight = !!o.highlight;
					});
					typeahead = new Typeahead({
						input: $input,
						eventBus: eventBus = new EventBus({
							el: $input
						}),
						withHint: _.isUndefined(o.hint) ? true : !!o.hint,
						minLength: o.minLength,
						autoselect: o.autoselect,
						datasets: datasets
					});
					$input.data(typeaheadKey, typeahead);
				}
			},
			open: function open() {
				return this.each(openTypeahead);
				function openTypeahead() {
					var $input = $(this), typeahead;
					if (typeahead = $input.data(typeaheadKey)) {
						typeahead.open();
					}
				}
			},
			close: function close() {
				return this.each(closeTypeahead);
				function closeTypeahead() {
					var $input = $(this), typeahead;
					if (typeahead = $input.data(typeaheadKey)) {
						typeahead.close();
					}
				}
			},
			val: function val(newVal) {
				return !arguments.length ? getVal(this.first()) : this.each(setVal);
				function setVal() {
					var $input = $(this), typeahead;
					if (typeahead = $input.data(typeaheadKey)) {
						typeahead.setVal(newVal);
					}
				}
				function getVal($input) {
					var typeahead, query;
					if (typeahead = $input.data(typeaheadKey)) {
						query = typeahead.getVal();
					}
					return query;
				}
			},
			destroy: function destroy() {
				return this.each(unattach);
				function unattach() {
					var $input = $(this), typeahead;
					if (typeahead = $input.data(typeaheadKey)) {
						typeahead.destroy();
						$input.removeData(typeaheadKey);
					}
				}
			}
		};
		$.fn.typeahead = function(method) {
			var tts;
			if (methods[method] && method !== "initialize") {
				tts = this.filter(function() {
					return !!$(this).data(typeaheadKey);
				});
				return methods[method].apply(tts, [].slice.call(arguments, 1));
			} else {
				return methods.initialize.apply(this, arguments);
			}
		};
		$.fn.typeahead.noConflict = function noConflict() {
			$.fn.typeahead = old;
			return this;
		};
	})();
})(window.jQuery);