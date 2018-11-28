const EventEmitter = require('eventemitter3');
const debug = require('debug')('status:watcher');
const debugError = require('debug')('status:watcher:errors');
//! const getTimeSampling = require('./timecontrol.js').getTimeSampling;

'use strict';

class StopCondition extends Error {
	constructor(msg) {
		super(msg);
		this.name='StopCondition'
	}
}

class Watcher extends EventEmitter {
	/**
	 * @param emit emit data (mandatory)
	 * @param config to get data from server
	 */
	constructor (selector, robotNames) {
		super();

		this.selector = selector;
		this.subscriptions = [];
		this.state = 'running';

		this.reconnectionPeriod = 0; // initial period between reconnections
		this.maxReconnectionPeriod = 60000; // max 1 min

		// Increase number of listeners (SHOULD BE AVOIDED)
		this.selector.setMaxListeners(0);
		this.selector._connection.setMaxListeners(0);

		/** initialise options for request **/
		let options = robotNames;

		this.options = options;
		debug(options);

		this.watch(options); // start watcher
	}

	watch (options) {
		debug('in watch');
		new Promise( (resolve, reject) => {
			this.selector.request({
				service: 'status',
				func: 'GetManagedObjects',
				obj: {
					interface: 'org.freedesktop.DBus.ObjectManager',
				}
			}, (peerId, err, data) => {
				if (err != null)  {
					reject(err);
					return;
				}
				if (this.state === 'stopped') {
					reject(new StopCondition());
				}
				debug('Request:emitData');
				// Parse status data
				debug(data)
				data = this._parseGetManagedObjectsData(data)
				debug(data)
				for (let deviceName in data.devices) {
					let device = data.devices[deviceName]
					if (device.parts.length === 0) {
						// TODO there should be a signal indicating
						// that the objects paths has all be loaded...
						// Indeed, the parts may not have been loaded yet
						reject('Error: No part yet')
						return
					}
					let dataToEmit = {
						parts: device.parts,
						robotId: device.robotId,
						robotName: device.robotName,
						peerId: peerId,
					}
					// Sending part data device (robot) by device
					this.emit('data', dataToEmit)
				}
				resolve();
			});
		})
			.then( _ => {
				// subscribe to Parts (TO BE IMPROVED!)
				/**
				 * Actually current method is subscribing to each and every part
				 * a better way to do it would be to subscribe to robots
				 * on condition that robots provides the adequate signals
				 */
				debug('Subscribing');
				return new Promise ( (resolve, reject) =>  {
					/// TODO subscription
					resolve() /// TODO
					this.subscription = this.selector.subscribe({
						service: "ieq",
						func: options.criteria.time.sampling,
						data: {data: options}, // TODO : no options for signals...
						obj:{
							path: '/fr/partnering/Ieq',
							interface: "fr.partnering.Ieq"
						}
					}, (dnd, err, data) => {
						if (err != null) {
							reject(err);
							return;
						}
						debug('Signal:emitData');
						debug(data)
						data = this._parseGetManagedObjectsData(data)
						debug(data)
						this.emit('data', data);

						this.reconnectionPeriod=0; // reset period on subscription requests
						resolve();
					})
				})
			})

		// 	// Request history data before subscribing
		// 	this.selector.request({
		// 		service: "ieq",
		// 		func: "DataRequest",
		// 		data: {
		// 			data: JSON.stringify(options)
		// 		},
		// 		obj:{
		// 			path: '/fr/partnering/Ieq',
		// 			interface: "fr.partnering.Ieq"
		// 		},
		// 	}, (dnId, err, dataString) => {
		// 		if (err != null)  {
		// 			reject(err);
		// 			return;
		// 		}
		// 		if (this.state === 'stopped') {
		// 			reject(new StopCondition());
		// 		}
		// 		debug('Request:emitData');
		// 		let data = JSON.parse(dataString);
		// 		this.emit('data', data);
		// 		resolve();
		// 	});
		// })
		// 	.then( _ => {
		// 		// subscribe to signal
		// 		debug('Subscribing');
		// 		return new Promise ( (resolve, reject) =>  {
		// 			this.subscription = this.selector.subscribe({
		// 				service: "ieq",
		// 				func: options.criteria.time.sampling,
		// 				data: {data: options}, // TODO : no options for signals...
		// 				obj:{
		// 					path: '/fr/partnering/Ieq',
		// 					interface: "fr.partnering.Ieq"
		// 				}
		// 			}, (dnd, err, data) => {
		// 				if (err != null) {
		// 					reject(err);
		// 					return;
		// 				}
		// 				debug('Signal:emitData');
		// 				data = JSON.parse(data);
		// 				this.emit('data', data);

		// 				this.reconnectionPeriod=0; // reset period on subscription requests
		// 				resolve();
		// 			})
		// 		})
		// 	})
			.catch( err => {
				// watcher stopped : do nothing
				if (err.name === 'StopCondition') {
					return;
				}
				// try to restart later
				debugError(err);
				this._closeSubscriptions(); // should not be necessary
				// increase delay by 1 sec
				this.reconnectionPeriod = this.reconnectionPeriod+1000;
				if (this.reconnectionPeriod > this.maxReconnectionPeriod) {
					// max 5min
					this.reconnectionPeriod = this.maxReconnectionPeriod;
				}
				this.watchTentative = setTimeout( _ => {
					this.watch(options);
				}, this.reconnectionPeriod); // try again later
			});

	}

	/**
	 * Parse objectManager introspect data to feed back status manager
	 *
	 * @param {Object} data raw data from getManagedObjects
	 * @return {Object{String,String,Array of Array of PartInfo} parsedData
	 */
	_parseGetManagedObjectsData (data) {
		let parsedData = {
			devices: {}
		}
		if (data == null) {
			return parsedData
		}

		// For each object path
		for (let path in data) {
			let obj = data[path]
			let splitPath = path.split('/')
			if (splitPath.length === 6) {
				// with device path, split path has 6 items
				for (let iface in obj) {
					if (iface === "fr.partnering.Status.Robot") {
						// Interface of the device objects
						let device = obj[iface]
						// Find product name and id
						let robotName = splitPath[5].toLowerCase()
						let selDevice = parsedData.devices[robotName]
						if (selDevice == null) {
							selDevice = {
								parts: []
							}
							parsedData.devices[robotName] = selDevice
						}
						selDevice.robotName = device.RobotName
						selDevice.robotId = device.RobotId
					}
				}
			} else if (splitPath.length === 8) {
				// with part path, split path has 8 items
				for (let iface in obj) {
					if (iface === "fr.partnering.Status.Part") {
						// Interface of the part objects
						let part = obj[iface]
						// Find product name
						let robotName = splitPath[5].toLowerCase()
						let selDevice = parsedData.devices[robotName]
						if (selDevice == null) {
							selDevice = {
								parts: []
							}
							parsedData.devices[robotName] = selDevice
						}
						// Build part array
						// TODO optimize how the data are used :
						// actually converting object to array then
						// from array to object again...
						let newPart = []
						newPart[0] = part.PartId
						newPart[1] = part.Category
						newPart[2] = part.PartName
						newPart[3] = "" // Label is unused in practice
						newPart[4] = part.Time
						newPart[5] = part.Code
						newPart[6] = part.CodeRef
						newPart[7] = part.Msg
						newPart[8] = part.CritLevel
						newPart[9] = "" // Description is unused in practice

						selDevice.parts.push(newPart)
					}
				}

			} else {
				debugError("Undefined path format")
			}
		}


		// Read Robot name and robot Id
		// Read Part data
		return parsedData
	}

	// Close all subscriptions if any
	_closeSubscriptions () {
		debug('In closeSubscription');
		for(var i in this.subscriptions) {
			this.subscriptions[i].close();
		}
		this.subscriptions = [];
	}

	stop () {
		debug('In stop');
		this.state = 'stopped';
		if (this.watchTentative != null) {
			clearTimeout(this.watchTentative);
		}
		this._closeSubscriptions();
		this.emit('stop');
		this.removeAllListeners();
	}
}

module.exports = Watcher;
