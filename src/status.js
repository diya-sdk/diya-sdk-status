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

	var isBrowser = !(typeof window === 'undefined');
	if(!isBrowser) { var Promise = require('bluebird'); }
	else { var Promise = window.Promise; }
	var DiyaSelector = d1.DiyaSelector;
	var util = require('util');


	//////////////////////////////////////////////////////////////
	/////////////////// Logging utility methods //////////////////
	//////////////////////////////////////////////////////////////

	var DEBUG = false;
	var Logger = {
		log: function(message){
			if(DEBUG) console.log(message);
		},

		debug: function(message, ...args){
			if(DEBUG) console.log(message, ...args);
		},

		warn: function(message){
			if(DEBUG) console.warn(message);
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

	Status.prototype._subscribeToMultidayStatusUpdate = function (robot_objects, callback) {
		Logger.debug(`Subscribe to MultidayStatusUpdate`)
		let subs = this.selector.subscribe({
				service: 'status',
				func: 'MultidayStatusUpdated',
				obj: {
					interface: 'fr.partnering.Status',
					path: "/fr/partnering/Status"
				}
			}, (peerId, err, data) => {
				if (err != null) {
					Logger.error("Multiday status subscription: error", err)
					return
				}
				if (!Array.isArray(data)) {
					Logger.warn("Multiday status subscription: malformed data", data)
					return
				}
				let robotToStatusMap = this._unpackRobotModels(data[0])
				Logger.debug(`Multiday status subscription data after unpacking:`, robotToStatusMap)
				for (var [key, value] of robotToStatusMap.entries()) {
					let robotIds = key.split(':')
					let robotId = robotIds[0]
					let robotName = robotIds[1]
					this._getRobotModelFromRecv2(value, robotId, robotName) // update this.robotModel
				  }
				Logger.debug(`RobotModel after unpacking:`, this.robotModel)
				if (typeof callback === 'function') {
					callback(this.robotModel);
				}
		})
		this.subscriptions.push(subs)

		Logger.debug(`Triggering MultidayStatusUpdate for robots`, robotNames)
		let robotNames = robot_objects.map(robot => robot.RobotName)
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
			}, (peerId, err, data) => {
				// Do nothing since the server should reponse back via signals
				if (err != null) {
					Logger.warn(`Multiday status trigger: error`, err)
					if (typeof callback === 'function') callback(-1);
					throw new Error(err)
				}
			})
	}

	/**
	 * Get 'Parts' reference map to reduce status payload. Duplicated contents in status are stored in the map.
	 */
	Status.prototype._getPartReferenceMap = function () {
		if (this._partReferenceMap == null || this._partReferenceMap.length == 0) {
			return new Promise((resolve, reject) => {
				this.selector.request({
					service: 'Status',
					func: 'GetPartReferenceMap',
					obj: {
						interface: 'fr.partnering.Status',
						path: '/fr/partnering/Status'
					}
				}, (peerId, err, data) => {
					Logger.debug(`PartReferenceMap response`, data, err)
					if (data == null) {
						data = []
					}
					this._partReferenceMap = data
					resolve() // returns a map of partid to its properties
				})
			})
		}
		Logger.debug('PartReferenceMap already exists, no need to request. Number of parts:', this._partReferenceMap.length)
	};

	/**
	 * Get 'StatusEvts' reference map to reduce status payload. Duplicated contents in status are stored in the map.
	 */
	Status.prototype._getStatusEvtReferenceMap = function () {
		if (this._statusEvtReferenceMap == null || this._statusEvtReferenceMap.length == 0) {
			return new Promise((resolve, reject) => {
				this.selector.request({
					service: 'Status',
					func: 'GetStatusEvtReferenceMap',
					obj: {
						interface: 'fr.partnering.Status',
						path: '/fr/partnering/Status'
					}
				}, (peerId, err, data) => {
					Logger.debug(`StatusEvtReferenceMap response`, data, err)
					if (data == null) {
						data = []
					}
					this._statusEvtReferenceMap = data
					resolve() // returns a map of partid to its properties
				})
			})
		}
		Logger.debug('StatusEvtReferenceMap already exists, no need to request. Number of parts:', this._statusEvtReferenceMap.length)
	};

	/**
	 * Subscribes to status changes for all parts
	 * @param {*} parts 
	 * @param {*} callback 
	 */
	Status.prototype._subscribeToStatusChanged = function (parts, callback) {
		if (parts == null) {
			return
		}

		parts.forEach(part => {
			if (part.objectPath == null) {
				Logger.warn('Subscribe to StatusChanged: input error', part)
				return
			}
			Logger.debug(`Subscribing to ${part.objectPath}`)
			let subs = this.selector.subscribe({
				service: 'status',
				func: 'StatusChanged',
				obj: {
					interface: 'fr.partnering.Status.Part',
					path: part.objectPath
				}
			}, (peerId, err, data) => {
				if (err != null) {
					Logger.error("StatusSubscribe:" + err)
					return
				}
				Logger.debug(`Part's StatusChanged is called, data:`, data)
				if (data[9] == null) data[9] = '' // empty description
				// Update robotModel variable
				// Since data is one-dimensional array, make it two-dimensional
				this._getRobotModelFromRecv2([data], part.RobotId, part.RobotName);
				if (typeof callback === 'function') {
					callback(this.robotModel);
				}
			})
			this.subscriptions.push(subs);
		})
	}

	/**
	 * Query for initial statuses
	 * Subscribe to error/status updates
	 */
	Status.prototype.watch = function (robotNames, callback) {
		Logger.debug(`Status.watch: robotNames`, robotNames)

		this.selector.setMaxListeners(0);
		this.selector._connection.setMaxListeners(0);

		// Promise to retrieve list of paired neighbors, i.e. all neighbor robots in the same mesh network
		let getNeighbors = new Promise((resolve, reject) => {
			this.selector.request({
				service: 'MeshNetwork',
				func: 'ListNeighbors',
			}, (peerId, err, neighbors) => {
				Logger.debug(`neighbors, err`, neighbors, err)
				if (err != null) {
					reject(err)
				}
				// This only returns the list of physical devices paired into the mesh network, the diya-server instance is not already included in the list
				if (neighbors == null) {
					neighbors = []
				}
				resolve(neighbors) // returns a array of neighbor object, each object is an array of [robot-name, address, bool]
			})
		})

		// Promise to retrieve all objects (robots, parts) exposed in DBus by diya-node-status
		let getRobotsAndParts = new Promise((resolve, reject) => {
			this.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager',
				}
			}, (peerId, err, objData) => { // get all object paths, interfaces and properties children of Status
				if (err != null || objData == null) {
					reject(err)
				}
				resolve(objData) // returns a map that links the object path to its corresponding interface
			})
		})

		let robotIface = 'fr.partnering.Status.Robot'
		let partIface = 'fr.partnering.Status.Part'

		// js objects of robots and parts
		let robotMap = new Map() // map robot name to id
		let robots = [] // list of robot objects
		let parts = [] // list of part object
		let meshedRobotNames = [] // list of names of robots and diya-server in the mesh network

		// Retrieve reference map of keys and values in order to reduce payload for status requests
		return Promise.try(_ => this._getPartReferenceMap())
			.then(_ => this._getStatusEvtReferenceMap())
			.then(_ => getNeighbors)
			.then(ret => {
				if (ret == null || !Array.isArray(ret)) {
					meshedRobotNames = []
				}
				let hostname = this.selector._connection._self
				meshedRobotNames = ret.map(r => r[0]) // we only keep the robot names
				if (!meshedRobotNames.includes(hostname)) {
					meshedRobotNames.push(hostname) // add hostname, i.e. the diya-server, which is not in the list of neighbors
				}
			})
			.then(_ => getRobotsAndParts)
			.then(ret => {
				for (let objectPath in ret) {
					// the object obtained from the object path
					let object = ret[objectPath]

					// if the return object is of a robot in the list of neighbors, or of the diya-server, retrieve all ofits relevant statuses
					if (object.hasOwnProperty(robotIface)) { // this is robot object
						robots.push(object[robotIface])
					}

					// if the return object is of a part, listen to signal StatusChanged of the part
					if (object.hasOwnProperty(partIface)) { // this is a part object
						let part = object[partIface]
						part.objectPath = objectPath
						part.RobotName = objectPath.split('/')[5] /* /fr/partnering/Status/Robots/B1R00037/Parts/voct */
						parts.push(part)
					}
				}

				Logger.debug('robots', robots)
				Logger.debug('parts', parts)

				// filer and keep the diya-server and the robots that are only in the same mesh networks
				robots = robots.filter(robot => meshedRobotNames.includes(robot.RobotName)) // only keeps robots that are neighbors (i.e. in the same mesh network)

				// filter parts that belongs to the robot in the mesh network (including the diya-server)
				parts = parts.filter(part => meshedRobotNames.includes(part.RobotName)) // only keeps parts belonging to neighbors (i.e. in the same mesh network)

				// create map of robot name to id for setting RobotId to paths
				robots.forEach(robot => {
					if (robotMap.has(robot.RobotName)) {
						return
					}
					robotMap.set(robot.RobotName, robot.RobotId)
				})

				// set RobotId to each part
				parts.forEach(part => {
					part.RobotId = robotMap.get(part.RobotName)
				})
				
				Logger.debug('meshed robots to be displayed', robots)
				Logger.debug('meshed parts to be subscribed to', parts)
			})
			.then(_ => this._subscribeToMultidayStatusUpdate(robots, callback)) // Retrieve initial statuses from the filtered robots
			.then(_ => this._subscribeToStatusChanged(parts, callback)) // Listen to StatusChange from the parts belonging to the filtered robots
	};

	/**
	 * Close all subscriptions
	 */
	Status.prototype.closeSubscriptions = function(){
		for(var i in this.subscriptions) {
			this.subscriptions[i].close();
		}
		this.subscriptions =[];
		this.robotModel = [];
	};

	/**
	 * Get data given dataConfig.
	 * @param {func} callback : called after update
	 * TODO USE PROMISE
	 */
	Status.prototype.getData = function(callback, dataConfig){
		var dataModel = {};
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
			}, (dnId, err, data) => {
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
				callback = callback.bind(this); // bind callback with Status
				callback(dataModel); // callback func
			});
		}).catch(err => {
			Logger.error(err)
		})
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
	Status.prototype._unpackRobotModels = function(data) {
		if (data == null) {
			return
		}
		// These two reference map should have been retrieved at initial connection
		if (this._partReferenceMap == null) {
			this._partReferenceMap = []
		}
		if (this._statusEvtReferenceMap == null) {
			this._statusEvtReferenceMap = []
		}
		// Begin to unpack data
		let robotToStatusMap = new Map()
		for (let robot in data) { // i.e. 4:D1R00035
			for (let partId in data[robot]) {
				let subStatuses = data[robot][partId] // an array of [time, code, hash]
				if (!Array.isArray(subStatuses)) { // erroneous data
					continue
				}
				// extract part-related information from pre-retrieved map
				let partReference = this._partReferenceMap[partId];
				if (partReference == null) {
					Logger.warn(`PartReference finds no map for partId ${partId}`)
				}
				let partName = partReference == null ? null : partReference[0];
				let label = partReference == null ? null : partReference[1];
				let category = partReference == null ? null : partReference[2];

				subStatuses.forEach(subStatus => {
					let time = subStatus[0]
					let code = subStatus[1]

					// map the hash value to the status event values
					let hash = subStatus[2]
					let statusEvtReference = this._statusEvtReferenceMap[hash]
					if (statusEvtReference == null) {
						Logger.warn(`StatusEvtReference finds no map for hash key ${hash}`)
					}
					let codeRef = statusEvtReference == null ? null : statusEvtReference[0];
					let msg = statusEvtReference == null ? null : statusEvtReference[1];
					let critLevel = statusEvtReference == null ? null : statusEvtReference[2];

					// construct full information for each status
					let status = [partId, category, partName, label, time, code, codeRef, msg, critLevel, '']
					if (!robotToStatusMap.has(robot)) {
						robotToStatusMap.set(robot, [])
					}
					robotToStatusMap.get(robot).push(status);
				})
			}
		}
		return robotToStatusMap
	}

	/**
	 * Update internal robot model with received data (version 2)
	 * @param  {Object} data - two dimensional array received from DiyaNode by websocket
	 * @param {int} robotId
	 * @param {string} robotName
	 */
	Status.prototype._getRobotModelFromRecv2 = function(data, robotId, robotName) {
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
				/** set received events **/
				if (rParts[partId].evts == null) {
					rParts[partId].evts = []
				}
				rParts[partId].evts.push({
					time: evts_tmp.time,
					code: evts_tmp.code,
					codeRef: evts_tmp.codeRef
				});
			}
		})
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
	DiyaSelector.prototype.setStatus = function (robotName, partName, code, source, callback) {
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
			}, (peerId, err, data) => {
				if (err != null) {
					if (typeof callback === 'function') callback(false);
				}
				else {
					if (typeof callback === 'function') callback(true);
				}
			});
		}).catch(err => {
			Logger.error(err)
		})
	};

	/**
	 * Get one status
	 * @param robotName to get status
	 * @param partName 	to get status
	 * @param callback		return callback(-1 if not found/data otherwise)
	 * @param _full 	more data about status
	 */
	Status.prototype.getStatus = function (robotName, partName, callback/*, _full*/) {
		let sendData = []
		return Promise.try(_ => {
			let req = this.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager',
				}
			}, (peerId, err, objData) => {

				let objectPathRobot = "/fr/partnering/Status/Robots/" + this.splitAndCamelCase(robotName, "-");
				let objectPathPart = "/fr/partnering/Status/Robots/" + this.splitAndCamelCase(robotName, "-") + "/Parts/" + partName;
				let robotId = objData[objectPathRobot]['fr.partnering.Status.Robot'].RobotId
				this.selector.request({
					service: "status",
					func: "GetPart",
					obj: {
						interface: 'fr.partnering.Status.Part',
						path: objectPathPart
					}
				}, (peerId, err, data) => {
					sendData.push(data)
					this._getRobotModelFromRecv2(sendData, robotId, robotName);
					if (err != null) {
						if (typeof callback === 'function') callback(-1);
					}
					else {
						if (typeof callback === 'function') callback(this.robotModel);
					}
				});
			})
		}).catch(err => {
			Logger.error(err)
		})
	};

	Status.prototype.splitAndCamelCase = function (inString, delimiter) {
		let arraySplitString = inString.split(delimiter);
		let outCamelString = '';
		arraySplitString.forEach(str => {
			outCamelString += str.charAt(0).toUpperCase() + str.substring(1);
		})
		return outCamelString;
	}

})()
