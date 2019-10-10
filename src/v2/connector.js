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

const debug = require('debug')('status:connector');

var Watcher = require('./watcher.js');
var ConnectorV1 = require('../v1/connector.js');

class ConnectorV2 extends ConnectorV1 {
	/**
	 *	callback : function called after model updated
	 * */
	constructor(selector) {
		super(selector);
		this.watchers = [];
		return this;
	}

	/**
	 * Subscribe to error/status updates
	 */
	watch (options, callback) {

		// do not create watcher without a callback
		if (callback == null || typeof callback !== 'function') {
			return null;
		}

		let watcher = new Watcher(this.selector, options);

		// add watcher in watcher list
		this.watchers.push(watcher);

		watcher.on('data', (data) => {
			debug(data);
			callback(this._getRobotModelFromRecv(data.parts,
				data.robotId,
				data.robotName),
				data.peerId)
		});
		watcher.on('stop', this._removeWatcher);

		return watcher;
	}

	/**
	 * Callback to remove watcher from list
	 * @param watcher to be removed
	 */
	_removeWatcher (watcher) {
		// find and remove watcher in list
		this.watchers.find( (el, id, watchers) => {
			if (watcher === el) {
				watchers.splice(id, 1); // remove
				return true;
			}
			return false;
		});
	}

	stopWatchers () {
		this.watchers.forEach( watcher => {
			// remove listener on stop event to avoid purging watchers twice
			watcher.removeListener('stop', this._removeWatcher);
			watcher.stop();
		});
		this.watchers = [];
	}

	closeSubscriptions () {
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
	_getRobotModelFromRecv (data, robotId, robotName) {
		if (this.robotModel == null)
			this.robotModel = [];

		if (this.robotModel[robotId] != null)
			this.robotModel[robotId].parts = {};

		if (this.robotModel[robotId] == null)
			this.robotModel[robotId] = {};

		this.robotModel[robotId] = {
			robot: {
				name: robotName
			}
		};

		this.robotModel[robotId].parts = {};
		let rParts = this.robotModel[robotId].parts;

		data.forEach( d => {
			let partId = d[0];
			let category = d[1];
			let partName = d[2];
			let label = d[3];
			let time = d[4];
			let code = d[5];
			let codeRef = d[6];
			let msg = d[7];
			let critLevel = d[8];
			let description = d[9];

			if (rParts[partId] == null) {
				rParts[partId] = {};
			}
			rParts[partId].category = category;
			rParts[partId].name = partName.toLowerCase();
			rParts[partId].label = label;

			if (rParts[partId].errorList == null)
				rParts[partId].errorList = {};

			if (rParts[partId].errorList[codeRef] == null)
				rParts[partId].errorList[codeRef] = {
					msg: msg,
					critLevel: critLevel,
					description: description
				};
			let evts_tmp = {
				time: this._coder.from(time),
				code: this._coder.from(code),
				codeRef: this._coder.from(codeRef)
			};
			if (rParts[partId].evts == null) {
				rParts[partId].evts = [];
			}
			rParts[partId].evts.push(evts_tmp);
		});
		return this.robotModel;
	}
}

module.exports = ConnectorV2;