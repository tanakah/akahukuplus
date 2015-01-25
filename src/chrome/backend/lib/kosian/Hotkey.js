/**
 * background side hotkey manager
 *
 * @author akahuku@gmail.com
 */
/**
 * Copyright 2014 akahuku, akahuku@gmail.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function (global) {
	'use strict';

	var DEFAULT_HOTKEYS_DESC =  '<insert>,<c-enter>';

	/*
	 * keyCode of punctual keys
	 * ========================
	 *
	 * xubuntu 14.04
	 * -----------------------
	 *
	 *             Chromium    Opera    Firefox
	 * ctrl + ~    192         192      192
	 * ctrl + -    189         109      173      *
	 * ctrl + =    187         107       61      *
	 * ctrl + [    219         219      219
	 * ctrl + ]    221         221      221
	 * ctrl + \    220         220      220
	 * ctrl + ,    188         188      188
	 * ctrl + .    190         190      190
	 * ctrl + /    191         191      191
	 *
	 * shift + ~   192          18      192      *
	 * shift + -   189         109      173      *
	 * shift + =   187         107       61      *
	 * shift + [   219         219      219
	 * shift + ]   221         221      221
	 * shift + \   220         220      220
	 * shift + ,   188         188      188
	 * shift + .   190         190      190
	 * shift + /   191         191      191
	 *
	 * Windows 7
	 * -------------------
	 *
	 *             Chromium    Opera    Firefox
	 * ctrl + ~    229         192        0      *
	 * ctrl + -    189         189      173      *
	 * ctrl + =    187         187       61      *
	 * ctrl + [    219         219      219
	 * ctrl + ]    221         221      221
	 * ctrl + \    220         220      220
	 * ctrl + ,    188         188      188
	 * ctrl + .    190         190      190
	 * ctrl + /    191         191      191
	 *
	 * shift + ~   192         192      192
	 * shift + -   189         189      173      *
	 * shift + =   187         187       61      *
	 * shift + [   219         219      219
	 * shift + ]   221         221      221
	 * shift + \   220         220      220
	 * shift + ,   188         188      188
	 * shift + .   190         190      190
	 * shift + /   191         191      191
	 *
	 * Mac OS X
	 * ------------------
	 *
	 * (I don't have Macintosh)
	 */

	var keyTable = {
		// basic keys [0-9a-z]: generated by code

		// special keys
		backspace:8, bs:8,
		tab:9,
		enter:13, return:13, ret:13,
		space:32, spc:32,
		pageup:33, pgup:33,
		pagedown:34, pgdn: 34,
		end:35,
		home:36,
		left:37,
		up:38,
		right:39,
		down:40,
		insert:45, ins:45,
		delete:46, del:46,

		// function keys: generated by code
		// f1:112 - f12:123

		// punctual keys
		',': 188, comma: 188,
		'.': 190,   dot: 190, period: 190,
		'/': 191, slash: 190,
		'[': 219,
		'\\':220, backslash: 220,
		']': 221
	};

	// hotkey base class
	function Hotkey (emit) {
		this.onPress = null;
		this.canProcess = false;
		this.defaultHotkeysDesc_ = DEFAULT_HOTKEYS_DESC;
	}

	Hotkey.prototype = {
		register:function (hotkeys) {},
		getObjectsForDOM:function (hotkeys) {
			return this.parseHotkeys(hotkeys);
		},
		get defaultHotkeysDesc () {
			return this.defaultHotkeysDesc_;
		},
		set defaultHotkeysDesc (v) {
			this.defaultHotkeysDesc_ = v;
		},
		get keyTable () {
			return keyTable;
		},
		parseHotkeys:function (hotkeys) {
			var result = [];

			hotkeys = (hotkeys || '').replace(/^\s+|\s+$/g, '') || this.defaultHotkeysDesc_;
			hotkeys.toLowerCase().split(/\s*,\s*/).forEach(function (sc) {
				var re = /^<([^>]+)>$/.exec(sc);
				if (!re) return;

				var modifiers = re[1].split('-');
				var key = modifiers.pop();
				if (!(key in keyTable)) return;

				var codes = {keyCode:keyTable[key], shiftKey:false, ctrlKey:false};
				modifiers.forEach(function (m) {
					switch (m.toLowerCase()) {
					case 's':
						codes['shiftKey'] = true;
						break;
					case 'c':
						codes['ctrlKey'] = true;
						break;
					}
				});

				result.push(codes);
			});

			if (result.length == 0) {
				result = this.parseHotkeys('');
			}

			var hash = {};
			result.forEach(function (sc) {
				hash[JSON.stringify(sc)] = sc;
			});
			result = Object.keys(hash).map(function (key) {
				return hash[key];
			});

			return result;
		},
		handlePress:function () {
		},
		validateKeyCode:function (arg) {
			if (typeof arg == 'number') {
				arg = {keyCode: arg};
			}

			for (var i in keyTable) {
				if (keyTable[i] == arg.keyCode) {
					var codes = [];
					arg.shiftKey && codes.push('s');
					arg.ctrlKey && codes.push('c');
					codes.push(i);
					return '<' + codes.join('-') + '>';
				}
			}

			return null;
		}
	};

	// chrome
	function HotkeyChrome () {
		Hotkey.apply(this, arguments);
	}
	HotkeyChrome.prototype = Object.create(Hotkey.prototype);
	HotkeyChrome.prototype.constructor = Hotkey;

	// opera
	function HotkeyOpera () {
		Hotkey.apply(this, arguments);
	}
	HotkeyOpera.prototype = Object.create(Hotkey.prototype);
	HotkeyOpera.prototype.constructor = Hotkey;
	
	// firefox
	function HotkeyFirefox (emit) {
		Hotkey.apply(this, arguments);
		this.canProcess = true;
		this.emit = emit;
		this.tabs = require('sdk/tabs');
		this.hotkeyFactory = require('sdk/hotkeys').Hotkey;
		this.hotkeyObjects = null;
		this.handlePressBinded = this.handlePress.bind(this);
	}
	HotkeyFirefox.prototype = Object.create(Hotkey.prototype, {
		constructor: Hotkey,
		translateTable: {value: {
			enter:'return', ret:'return',
			ins:'insert',
			del:'delete',
			comma:',',
			dot:'.', period:'.',
			slash:'/',
			backslash:'\\'
		}},
		register: {value: function (hotkeys) {
			if (this.hotkeyObjects) {
				this.hotkeysObject.forEach(function (hotkey) {
					hotkey.destroy();
				}, this);
			}

			this.hotkeyObjects = [];
			this.parseHotkeys(hotkeys).forEach(function (hotkey) {
				this.hotkeyObjects.push(this.hotkeyFactory({
					combo:hotkey,
					onPress:this.handlePressBinded
				}));
			}, this);
		}},
		parseHotkeys: {value: function (hotkeys) {
			var result = [];

			hotkeys = (hotkeys || '').replace(/^\s+|\s+$/g, '') || this.defaultHotkeysDesc_;
			hotkeys.toLowerCase().split(/\s*,\s*/).forEach(function (sc) {
				var re = /^<([^>]+)>$/.exec(sc);
				if (!re) return;

				var modifiers = re[1].split('-');
				var key = modifiers.pop();
				if (key in this.translateTable) {
					key = this.translateTable[key];
				}
				if (!(key in keyTable)) return;

				var codes = {shift:false, control:false, alt:false, meta:false, accel:false};
				modifiers.forEach(function (m) {
					switch (m.toLowerCase()) {
					case 's':
						codes.shift = true;
						break;
					case 'c':
						codes.control = true;
						break;
					case 'a':
						codes.alt = true;
						break;
					case 'm':
						codes.meta = true;
						break;
					case 'x':
						codes.accel = true;
						break;
					}
				});

				codes = Object.keys(codes).filter(function (m) {return codes[m]});
				if (codes.length) {
					codes.push(key);
					result.push(codes.join('-'));
				}
			}, this);

			if (result.length == 0) {
				result = this.parseHotkeys('');
			}

			return result;
		}},
		handlePress: {value: function () {
			if (this.emit) {
				this.emit(this.onPress, this);
			}
			else if (this.onPress) {
				this.onPress(this);
			}
		}}
	});

	function create (useDefault) {
		var ext = require('kosian/Kosian').Kosian();

		if (!useDefault) {
			if (global.chrome) {
				return new HotkeyChrome(ext.emit);
			}
			else if (global.opera) {
				return new HotkeyOpera(ext.emit);
			}
			else if (require('sdk/self')) {
				return new HotkeyFirefox(ext.emit);
			}
		}

		return new Hotkey(ext.emit);
	}

	(function init () {
		var i, j, goal;
		for (i = '0'.charCodeAt(0), goal = '9'.charCodeAt(0); i <= goal; i++) {
			keyTable[String.fromCharCode(i)] = i;
		}
		for (i = 'A'.charCodeAt(0), goal = 'Z'.charCodeAt(0); i <= goal; i++) {
			keyTable[String.fromCharCode(i)] = i;
			keyTable[String.fromCharCode(i + 32)] = i;
		}
		for (i = 112, j = 1, goal = i + 12; i < goal; i++, j++) {
			keyTable['f' + j] = i;
		}
	})();

	exports.Hotkey = create;
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :