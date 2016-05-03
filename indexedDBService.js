'use strict';

/**
 * HTML5 IndexedDB AngularJS factory (utility service)
 * https://www.w3.org/TR/IndexedDB/
 *
 * @author Nicolas GUEFVENEU
 * @version 1.0
 * @url https://github.com/nicoguefveneu/angular-services
 */

// Module used for practicality ...
var indexedDBModule = angular.module('indexedDBModule', ['ngResource']);

// ...  in order to register this Factory
indexedDBModule.factory('indexedDBService', ['$window','$q',function($window, $q) {

	/**
	 * IndexedDB version
	 */
	 var VERSION = 1;

	/**
	 * IndexedDB Transaction mode constants
	 */
	var READONLY = 'readonly';
	var READWRITE = 'readwrite';

	/**
	 * IndexedDB instantiation
	 */
	var indexedDB = $window.indexedDB;

	/**
	 * The current database
	 */
	var db = null;

	/**
	 * Opens a connection to the database and call a function when an upgrade is needed
	 */
	var open = function(databaseName, onUpgradeNeededCustomFunction) {
		var deferred = $q.defer();
		var version = VERSION;
		var request = indexedDB.open(databaseName, version);
		request.onupgradeneeded = function(e) {
			db = e.target.result;
			e.target.transaction.onerror = indexedDB.onerror;

			onUpgradeNeededCustomFunction(db);

		};
		request.onsuccess = function(e) {
			db = e.target.result;
			deferred.resolve();
		};
		request.onerror = function() {
			deferred.reject('open DB on error');
		};

		return deferred.promise;
	};

	/**
	 * Clears all database
	 */
	var deleteDatabase = function(databaseName) {
		var deferred = $q.defer();

		// Check if the database is closed
		if(isOpenedDB()) {
			console.log('Database should be closed first');
			db.close();
		}

		var request = indexedDB.deleteDatabase(databaseName);

		request.onsuccess = function() {
			console.log('delete database success');
			db = null;
			deferred.resolve();
		};
		request.onerror = function() {
			console.log('delete database on error');
			deferred.reject('delete DB on error');
		};

		db.onerror = function() {
			console.log('delete database on error');
			deferred.reject('An error was occured when trying to close database');
		};

		return deferred.promise;
	};

	/**
	 * Checks if the connection to the current DB is opened
	 */
	var isOpenedDB = function() {
		return db !== null;
	};

	/**
	 * Inserts or updates one or several data lines
	 */
	var upsert = function(storeName, data) {
		var deferred = $q.defer();

		if (db === null) {
			deferred.reject('IndexDB is not opened yet !');

		} else {
			var tx = db.transaction([storeName], READWRITE);
			var store = tx.objectStore(storeName);

			var request = null;
			if(data.length === undefined) {
				/** Single value */
				request = store.put(data);
			} else {
				/** Array values */
				for (var i in data) {
					request = store.put(data[i]);
				}
			}

			request.onsuccess = function(e) {
				deferred.resolve();
			};

			request.onerror = function(e) {
				console.log(e.value);
				deferred.reject('item couldn\'t be added or updated !');
			};
		}
		return deferred.promise;
	};

	/**
	 * Gets all the records for the given table name
	 */
	var getAll = function(storeName) {
		var deferred = $q.defer();

		if (db === null) {
			deferred.reject('IndexDB is not opened yet !');

		} else {
			var data = [];

			var tx = db.transaction([storeName], READONLY);
			var store = tx.objectStore(storeName);
			var request = store.openCursor();

			request.onsuccess = function(e) {
				var cursor = request.result;
				if(cursor) {
					data.push(cursor.value);
					cursor.continue();
				}
			};

			tx.oncomplete = function(evt) {
				deferred.resolve(data);
			};

			request.onerror = function(e) {
				console.log(e.value);
				deferred.reject('item couldn\'t be added or updated !');
			};
		}
		return deferred.promise;
	};

	/**
	 * Gets a record by its table name and key value
	 */
	var getFromKey = function(storeName, key) {
		var deferred = $q.defer();

		if (db === null) {
			deferred.reject('IndexDB is not opened yet !');

		} else {
			var tx = db.transaction([storeName], READONLY);
			var store = tx.objectStore(storeName);
			var request = store.get(key);

			request.onsuccess = function(e) {
				deferred.resolve(request.result);
			};

			request.onerror = function(e) {
				console.log(e.value);
				deferred.reject('item couldn\'t be found !');
			};
		}

		return deferred.promise;
	};

	/**
	 * Delete a record by its table name and key value
	 */
	var deleteFromKey = function(storeName, key) {
		var deferred = $q.defer();

		if (db === null) {
			deferred.reject('IndexDB is not opened yet !');

		} else {
			var tx = db.transaction([storeName], READWRITE);
			var store = tx.objectStore(storeName);
			var request = store.delete(key);

			request.onsuccess = function(e) {
				deferred.resolve(request.result);
			};

			request.onerror = function(e) {
				console.log(e.value);
				deferred.reject('item couldn\'t be deleted !');
			};
		}

		return deferred.promise;
	};

	return {
		open : open,
		deleteDatabase : deleteDatabase,
		isOpenedDB : isOpenedDB,
		upsert : upsert,
		getAll : getAll,
		getFromKey : getFromKey,
		deleteFromKey : deleteFromKey
	};

}]);
