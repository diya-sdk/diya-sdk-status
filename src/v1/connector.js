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

var isBrowser = (typeof window !== 'undefined');
var Promise;
if (!isBrowser) { Promise = require('bluebird'); }
else { Promise = window.Promise; }


class ConnectorV1 {
	/**
	 *	callback : function called after model updated
	 * */
	constructor(selector) {
		this.selector = selector;
		this._coder = selector.encode();
		this.subscriptions = [];

		/** model of robot : available parts and status **/
		this.robotModel = [];
		return this;
	}

	/**
	 * Subscribe to error/status updates
	 */
	watch (robotNames, callback) {
		this.selector.setMaxListeners(0);
		this.selector._connection.setMaxListeners(0);
		let sendData = [];
		return Promise.try( () => {
			this.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager',
				}
			}, (peerId, err, objData) => { // get all object paths, interfaces and properties children of Status
				let robotName = '';
				let robotId = 1;
				for (let objectPath in objData) {
					if (objData[objectPath]['fr.partnering.Status.Robot'] != null) {
						robotName = objData[objectPath]['fr.partnering.Status.Robot'].RobotName;
						robotId = objData[objectPath]['fr.partnering.Status.Robot'].RobotId;
						this.getAllStatuses(robotName, function (model) {
							callback(model, peerId);
						})
					}
					if (objData[objectPath]['fr.partnering.Status.Part'] != null) {
						let subs = this.selector.subscribe({// subscribes to status changes for all parts
							service: 'status',
							func: 'StatusChanged',
							obj: {
								interface: 'fr.partnering.Status.Part',
								path: objectPath
							},
							data: robotNames
						}, (peerId, err, data) => {
							if (err != null) {
								Logger.error("StatusSubscribe:" + err);
							} else {
								sendData[0] = data;
								this._getRobotModelFromRecv(sendData, robotId, robotName);
								if (typeof callback === 'function') {
									callback(this.robotModel, peerId);
								}
							}
						});
						this.subscriptions.push(subs);
					}
				}
			})
		})
		.catch( err => {
			Logger.error(err);
		});
	}

	/**
	 * Close all subscriptions
	 */
	closeSubscriptions () {
		for (var i in this.subscriptions) {
			this.subscriptions[i].close();
		}
		this.subscriptions = [];
		this.robotModel = [];
	}

	/**
	 * Update internal robot model with received data (version 2)
	 * @param  {Object} data data received from DiyaNode by websocket
	 * @return {[type]} [description]
	 */
	_getRobotModelFromRecv (data, robotId, robotName) {
		if (this.robotModel == null)
			this.robotModel = [];

		if (this.robotModel[robotId] != null)
			this.robotModel[robotId].parts = {}; // reset parts

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
			if (Array.isArray(evts_tmp.code) || Array.isArray(evts_tmp.time)
				|| Array.isArray(evts_tmp.codeRef)) {
				if (evts_tmp.code.length === evts_tmp.codeRef.length
					&& evts_tmp.code.length === evts_tmp.time.length) {
					rParts[partId].evts = [];
					for (let i = 0; i < evts_tmp.code.length; i++) {
						rParts[partId].evts.push({
							time: evts_tmp.time[i],
							code: evts_tmp.code[i],
							codeRef: evts_tmp.codeRef[i]
						});
					}
				} else {
					Logger.error("Status:Inconsistant lengths of buffers (time/code/codeRef)");
				}
			} else { /** just in case, to provide backward compatibility **/
				/** set received event **/
				rParts[partId].evts = [{
					time: evts_tmp.time,
					code: evts_tmp.code,
					codeRef: evts_tmp.codeRef
				}];
			}
		});
	}

    /**
	 * Set on status
	 * @param robotName to find status to modify
	 * @param partName 	to find status to modify
	 * @param code      newCode
	 * @param source    source
	 * @param callback  return callback (<bool>success)
	 */
	setStatus (robotName, partName, code, source, callback) {
		return Promise.try( () => {
			var objectPath = "/fr/partnering/Status/Robots/" + this._splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
			this.request({
				service: "status",
				func: "SetPart",
				obj: {
					interface: 'fr.partnering.Status.Part',
					path: objectPath
				},
				data: {
					code: code,
					source: source | 1
				}
			}, this._onSetPart.bind(this, callback));
		})
		.catch( err => {
			Logger.error(err);
		});
	}

	/**
	 * Callback on SetPart
	 */
	_onSetPart (callback, peerId, err, data) {
		if (err != null) {
			if (typeof callback === 'function') callback(false);
		} else {
			if (typeof callback === 'function') callback(true);
		}
	}

	/**
	 * Get one status
	 * @param robotName to get status
	 * @param partName 	to get status
	 * @param callback  return callback(-1 if not found/data otherwise)
	 * @param _full     more data about status
	 */
	getStatus (robotName, partName, callback/*, _full*/) {
		return Promise.try( () => {
			this.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager',
				}
			}, this.onGetManagedObjectsGetStatus.bind(this, robotName, partName, callback));
		})
		.catch( err => {
			Logger.error(err);
		});
	}

	/**
	 * Callback on GetManagedObjects in GetStatus
	 */
	onGetManagedObjectsGetStatus (robotName, partName, callback, peerId, err, data) {
		let objectPathRobot = "/fr/partnering/Status/Robots/" + this._splitAndCamelCase(robotName, "-");
		let objectPathPart = "/fr/partnering/Status/Robots/" + this._splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
		let robotId = data[objectPathRobot]['fr.partnering.Status.Robot'].RobotId
		this.selector.request({
			service: "status",
			func: "GetPart",
			obj: {
				interface: 'fr.partnering.Status.Part',
				path: objectPathPart
			}
		}, this._onGetPart.bind(this, robotId, robotName, callback));
	}

	/**
	 * Callback on GetPart
	 */
	_onGetPart (robotId, robotName, callback, peerId, err, data) {
		let sendData = []
		sendData.push(data)
		this._getRobotModelFromRecv(sendData, robotId, robotName);
		if (err != null) {
			if (typeof callback === 'function') callback(-1);
		} else {
			if (typeof callback === 'function') callback(this.robotModel);
		}
	}

	/**
	 * Get all status
	 * @param robotName to get status
	 * @param partName 	to get status
	 * @param callback		return callback(-1 if not found/data otherwise)
	 * @param _full 	more data about status
	 */
	getAllStatuses (robotName, callback) {
		this.selector.request({
			service: 'status',
			func: 'GetManagedObjects',
			obj: {
				interface: 'org.freedesktop.DBus.ObjectManager',
			}
		}, this._onGetManagedObjectsGetAllStatuses.bind(this, robotName, callback))
	}

	/**
	 * Callback on GetManagedObjects in GetAllStatuses
	 */
	_onGetManagedObjectsGetAllStatuses (robotName, callback, peerId, err, data) {
		let objectPath = "/fr/partnering/Status/Robots/" + this._splitAndCamelCase(robotName, "-");
		if (data[objectPath] != null) {
			if (data[objectPath]['fr.partnering.Status.Robot'] != null) {
				let robotId = data[objectPath]['fr.partnering.Status.Robot'].RobotId
				//var full = _full || false;
				this.selector.request({
					service: "status",
					func: "GetAllParts",
					obj: {
						interface: 'fr.partnering.Status.Robot',
						path: objectPath
					}
				}, this._onGetAllParts.bind(this, robotId, robotName, callback));
			} else {
				Logger.error("Interface fr.partnering.Status.Robot doesn't exist!");
			}
		} else {
			Logger.error("ObjectPath " + objectPath + " doesn't exist!");
		}
	}

	/**
	 * Callback on GetAllParts
	 */
	_onGetAllParts (robotId, robotName, callback, peerId, err, data) {
		if (err != null) {
			if (typeof callback === 'function') callback(-1);
			throw new Error(err);
		} else {
			this._getRobotModelFromRecv(data, robotId, robotName);
			if (typeof callback === 'function') callback(this.robotModel);
		}
	}

	_splitAndCamelCase (inString, delimiter) {
		let arraySplitString = inString.split(delimiter);
		let outCamelString = '';
		arraySplitString.forEach( str => {
			outCamelString += str.charAt(0).toUpperCase() + str.substring(1);
		});
		return outCamelString;
	}
}

module.exports = ConnectorV1;
