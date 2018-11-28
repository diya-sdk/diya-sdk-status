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
(function(){
	const debug = require('debug')('status');
	let Watcher = require('./watcher.js');

	let isBrowser = !(typeof window === 'undefined');
	if(!isBrowser) { var Promise = require('bluebird'); }
	else { var Promise = window.Promise; }
	let DiyaSelector = d1.DiyaSelector;
	let util = require('util');


	//////////////////////////////////////////////////////////////
	/////////////////// Logging utility methods //////////////////
	//////////////////////////////////////////////////////////////

	var DEBUG = true;
	var Logger = {
		log: function(message){
			if(DEBUG) console.log(message);
		},

		error: function(message){
			if(DEBUG) console.error(message);
		}
	};

	/**
	 *	callback : function called after model updated
	 * */
	function Status(selector){
		this.selector = selector;
		this._coder = selector.encode();
		this.watchers = [];
		this.subscriptions = []; // DEPRECATED TO BE REMOVED ?

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
	Status.prototype.getRobotModel = function(){
		return this.robotModel;
	};

	/**
	 * @param {Object} dataConfig config for data request
	 * if dataConfig is define : set and return this
	 *	 @return {Status} this
	 * else
	 *	 @return {Object} current dataConfig
	 */
	Status.prototype.DataConfig = function(newDataConfig){
		if(newDataConfig) {
			this.dataConfig=newDataConfig;
			return this;
		}
		else
			return this.dataConfig;
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
	Status.prototype.DataOperator = function(newOperator){
		if(newOperator) {
			this.dataConfig.operator = newOperator;
			return this;
		}
		else
			return this.dataConfig.operator;
	};
	/**
	 * Depends on numSamples
	 * @param {int} number of samples in dataModel
	 * if defined : set number of samples
	 *	@return {Status} this
	 * else
	 *	@return {int} number of samples
	 **/
	Status.prototype.DataSampling = function(numSamples){
		if(numSamples) {
			this.dataConfig.sampling = numSamples;
			return this;
		}
		else
			return this.dataConfig.sampling;
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
	Status.prototype.DataTime = function(newTimeBeg,newTimeEnd, newRange){
		if(newTimeBeg || newTimeEnd || newRange) {
			this.dataConfig.criteria.time.beg = newTimeBeg.getTime();
			this.dataConfig.criteria.time.end = newTimeEnd.getTime();
			this.dataConfig.criteria.time.range = newRange;
			return this;
		}
		else
			return {
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
	Status.prototype.DataRobotIds = function(robotIds){
		if(robotIds) {
			this.dataConfig.criteria.robot = robotIds;
			return this;
		}
		else
			return this.dataConfig.criteria.robot;
	};
	/**
	 * Depends on placeIds // not relevant?, not implemented yet
	 * Set place criteria.
	 *	@param {Array[Int]} placeIds list of place Ids
	 * Get place criteria.
	 *	@return {Array[Int]} list of place Ids
	 */
	Status.prototype.DataPlaceIds = function(placeIds){
		if(placeIds) {
			this.dataConfig.criteria.placeId = placeIds;
			return this;
		}
		else
			return this.dataConfig.criteria.place;
	};
	/**
	 * Get data by sensor name.
	 *	@param {Array[String]} sensorName list of sensors
	 */
	Status.prototype.getDataByName = function(sensorNames){
		var data=[];
		for(var n in sensorNames) {
			data.push(this.dataModel[sensorNames[n]]);
		}
		return data;
	};

	/**
	 * Subscribe to error/status updates
	 */
	Status.prototype.watch = function(robotNames, callback) {

		// do not create watcher without a callback
		if (callback == null || typeof callback !== 'function') {
			return null
		}

		let watcher = new Watcher(this.selector, robotNames)

		// add watcher in watcher list
		this.watchers.push(watcher)

		watcher.on('data', (data) => {
			debug(data)
			callback(this._getRobotModelFromRecv2(data.parts,
			                                      data.robotId,
			                                      data.robotName),
			         data.peerId)
		})
		watcher.on('stop', this._removeWatcher)

		return watcher;



		// // Increase number of listeners (SHOULD BE AVOIDED)
		// this.selector.setMaxListeners(0);
		// this.selector._connection.setMaxListeners(0);

		// return Promise.try(_ => {
		// 	this.selector.request({
		// 		service: 'status',
		// 		func: 'GetManagedObjects',
		// 		obj: {
		// 			interface: 'org.freedesktop.DBus.ObjectManager',
		// 		}
		// 	}, this.onGetManagedObjectsWatch.bind(this, robotNames, callback));
		// }).catch(err => {
		// 	Logger.error(err);
		// })
	};

	/**
	 * Callback to remove watcher from list
	 * @param watcher to be removed
	 */
	Status.prototype._removeWatcher = function (watcher) {
		// find and remove watcher in list
		this.watchers.find( (el, id, watchers) => {
			if (watcher === el) {
				watchers.splice(id, 1); // remove
				return true;
			}
			return false;
		})
	};

	/**
	 * Stop all watchers
	 */
	Status.prototype.closeSubscriptions = function () {
		console.warn('Deprecated function use stopWatchers instead');
		this.stopWatchers();
	};
	Status.prototype.stopWatchers = function () {
		this.watchers.forEach( watcher => {
			// remove listener on stop event to avoid purging watchers twice
			watcher.removeListener('stop', this._removeWatcher);
			watcher.stop();
		});
		this.watchers =[];
		// this.robotModel = []; DEVEL - NEEDED ?
	};

	/**
	 * Callback on GetManagedObjects in Watch
	 */
	// get all object paths, interfaces and properties children of Status
	Status.prototype.onGetManagedObjectsWatch = function(robotNames, callback,
	                                                     peerId, err, data) {
		let robotName = '';
		let robotId = 1;
		let robotIds = [];
		for (let objectPath in data) {
			if (data[objectPath]['fr.partnering.Status.Robot'] != null) {
				robotName = data[objectPath]['fr.partnering.Status.Robot'].RobotName;
				robotId = data[objectPath]['fr.partnering.Status.Robot'].RobotId;
				robotIds[robotName] = robotId;
				this.getAllStatuses(robotName, this.onGetAllStatuses.bind(this, peerId, callback))
			}
			if (data[objectPath]['fr.partnering.Status.Part'] != null) {
				let subs = this.selector.subscribe({// subscribes to status changes for all parts
					service: 'status',
					func: 'StatusChanged',
					obj: {
						interface: 'fr.partnering.Status.Part',
						path: objectPath
					},
					data: robotNames
				}, this.onStatusChanged.bind(this, robotId, robotName, callback));
				this.subscriptions.push(subs);
			}
		}
	}

	/**
	 * Callback on GetAllStatuses
	 */
	Status.prototype.onGetAllStatuses = function(peerId, callback, model) {
		callback(model, peerId);
	}

	/**
	 * Callback on StatusChanged
	 */
	Status.prototype.onStatusChanged = function(robotId, robotName, callback, peerId, err, data) {
		let sendData = [];
		if (err != null) {
			Logger.error("StatusSubscribe:" + err);
		} else {
			sendData[0] = data;
			this._getRobotModelFromRecv2(sendData, robotId, robotName);
			if (typeof callback === 'function') {
				callback(this.robotModel, peerId);
			}
		}
	}

	/// DEPRECATED
	// /**
	//  * Close all subscriptions
	//  */
	// Status.prototype.closeSubscriptions = function(){
	// 	for(var i in this.subscriptions) {
	// 		this.subscriptions[i].close();
	// 	}
	// 	this.subscriptions =[];
	// 	this.robotModel = [];
	// };

	/**
	 * Get data given dataConfig.
	 * @param {func} callback : called after update
	 * TODO USE PROMISE
	 */
	Status.prototype.getData = function(callback, dataConfig){
		return Promise.try(_ => {
			if(dataConfig != null)
				this.DataConfig(dataConfig);
			// console.log("Request: "+JSON.stringify(dataConfig));
			this.selector.request({
				service: "status",
				func: "DataRequest",
				data: {
					type:"splReq",
					dataConfig: this.dataConfig
				}
			}, this.onDataRequest.bind(this, callback));
		}).catch(err => {
			Logger.error(err)
		})
	};

	/**
	 * Callback on DataRequest
	 */
	Status.prototype.onDataRequest = function(callback, peerId, err, data) {
		let dataModel = {};
		if (err != null) {
			Logger.error("[" + this.dataConfig.sensors + "] Recv err: " + JSON.stringify(err));
			return;
		}
		if(data.header.error != null) {
			// TODO : check/use err status and adapt behavior accordingly
			Logger.error("UpdateData:\n"+JSON.stringify(data.header.reqConfig));
			Logger.error("Data request failed ("+data.header.error.st+"): "+data.header.error.msg);
			return;
		}
		//Logger.log(JSON.stringify(this.dataModel));
		dataModel = this._getDataModelFromRecv(data);

		Logger.log(this.getDataModel());
		callback(dataModel); // callback func
	}

	/**
	 * Update internal robot model with received data (version 2)
	 * @param  {Array of Array of PartInfo (struct)} data data received from
	 *                                                    DiyaNode by websocket
	 * @param  {int} robotId id of the robot
	 * @param  {string} robotName name of the robot
	 * @return {[type]}		[description]
	 */
	Status.prototype._getRobotModelFromRecv2 = function(data,
	                                                    robotId,
	                                                    robotName) {
		if(this.robotModel == null)
			this.robotModel = [];

		if(this.robotModel[robotId] != null)
			this.robotModel[robotId].parts = {}; // reset parts

		if(this.robotModel[robotId] == null)
			this.robotModel[robotId] = {};

		this.robotModel[robotId] = {
			robot: {
				name: robotName
			}
		};

		/** extract parts info **/
		this.robotModel[robotId].parts = {};
		let rParts = this.robotModel[robotId].parts;

		data.forEach(d => {
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
			/* update part category */
			rParts[partId].category = category;
			/* update part name */
			rParts[partId].name = partName.toLowerCase();
			/* update part label */
			rParts[partId].label = label;

			/* update error */
			/** update errorList **/
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
			/** if received list of events **/
			if (Array.isArray(evts_tmp.code) || Array.isArray(evts_tmp.time)
				|| Array.isArray(evts_tmp.codeRef)) {
				if (evts_tmp.code.length === evts_tmp.codeRef.length
					&& evts_tmp.code.length === evts_tmp.time.length) {
					/** build list of events **/
					rParts[partId].evts = [];
					for (let i = 0; i < evts_tmp.code.length; i++) {
						rParts[partId].evts.push({
							time: evts_tmp.time[i],
							code: evts_tmp.code[i],
							codeRef: evts_tmp.codeRef[i]
						});
					}
				}
				else Logger.error("Status:Inconsistant lengths of buffers (time/code/codeRef)");
			}
			else { /** just in case, to provide backward compatibility **/
				/** set received event **/
				rParts[partId].evts = [{
					time: evts_tmp.time,
					code: evts_tmp.code,
					codeRef: evts_tmp.codeRef
				}];
			}
		})
		return this.robotModel
	};

	/** create Status service **/
	DiyaSelector.prototype.Status = function(){
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
	DiyaSelector.prototype.setStatus = function(robotName, partName, code, source, callback) {
		return Promise.try(_ => {
			var objectPath = "/fr/partnering/Status/Robots/" + this.splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
			this.request({
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
			}, this.onSetPart.bind(this, callback));
		}).catch(err => {
			Logger.error(err)
		})
	};

	/**
	 * Callback on SetPart
	 */
	Status.prototype.onSetPart = function(callback, peerId, err, data) {
		if (err != null) {
			if (typeof callback === 'function') callback(false);
		}
		else {
			if (typeof callback === 'function') callback(true);
		}
	}

	/**
	 * Get one status
	 * @param robotName to get status
	 * @param partName 	to get status
	 * @param callback		return callback(-1 if not found/data otherwise)
	 * @param _full 	more data about status
	 */
	Status.prototype.getStatus = function(robotName, partName, callback/*, _full*/) {
		return Promise.try(_ => {
			this.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager',
				}
			}, this.onGetManagedObjectsGetStatus.bind(this, robotName, partName, callback));
		}).catch(err => {
			Logger.error(err)
		})
	};

	/**
	 * Callback on GetManagedObjects in GetStatus
	 */
	Status.prototype.onGetManagedObjectsGetStatus = function(robotName, partName, callback, peerId, err, data) {
		let objectPathRobot = "/fr/partnering/Status/Robots/" + this.splitAndCamelCase(robotName, "-");
		let objectPathPart = "/fr/partnering/Status/Robots/" + this.splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
		let robotId = data[objectPathRobot]['fr.partnering.Status.Robot'].RobotId
		this.selector.request({
			service: "status",
			func: "GetPart",
			obj: {
				interface: 'fr.partnering.Status.Part',
				path: objectPathPart
			}
		}, this.onGetPart.bind(this, robotId, robotName, callback));
	}

	/**
	 * Callback on GetPart
	 */
	Status.prototype.onGetPart = function(robotId, robotName, callback, peerId, err, data) {
		let sendData = []
		sendData.push(data)
		this._getRobotModelFromRecv2(sendData, robotId, robotName);
		if (err != null) {
			if (typeof callback === 'function') callback(-1);
		}
		else {
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
	Status.prototype.getAllStatuses = function(robotName, callback) {
		this.selector.request({
			service: 'status',
			func: 'GetManagedObjects',
			obj: {
				interface: 'org.freedesktop.DBus.ObjectManager',
			}
		}, this.onGetManagedObjectsGetAllStatuses.bind(this, robotName, callback))
	};

	/**
	 * Callback on GetManagedObjects in GetAllStatuses
	 */
	Status.prototype.onGetManagedObjectsGetAllStatuses = function(robotName, callback, peerId, err, data) {
		let objectPath = "/fr/partnering/Status/Robots/" + this.splitAndCamelCase(robotName, "-");
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
				}, this.onGetAllParts.bind(this, robotId, robotName, callback));
			} else {
				Logger.error("Interface fr.partnering.Status.Robot doesn't exist!")
			}
		} else {
			Logger.error("ObjectPath " + objectPath + " doesn't exist!")
		}
	}

	/**
	 * Callback on GetAllParts
	 */
	Status.prototype.onGetAllParts = function(robotId, robotName, callback, peerId, err, data) {
		if (err != null) {
			if (typeof callback === 'function') callback(-1);
			throw new Error(err)
		}
		else {
			this._getRobotModelFromRecv2(data, robotId, robotName);
			if (typeof callback === 'function') callback(this.robotModel);
		}
	}

	Status.prototype.splitAndCamelCase = function(inString, delimiter) {
		let arraySplitString = inString.split(delimiter);
		let outCamelString = '';
		arraySplitString.forEach(str => {
			outCamelString += str.charAt(0).toUpperCase() + str.substring(1);
		})
		return outCamelString;
	}

})()
