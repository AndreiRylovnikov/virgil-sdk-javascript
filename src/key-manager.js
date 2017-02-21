'use strict';

var utils = require('./shared/utils');
var VirgilKey = require('./virgil-key');

/**
 * Constructs and initializes objects that implement cryptographic key
 * managing functionality (i.e. generate, save, load, destroy).
 *
 * @param {VirgilAPIContext} context - The Virgil API context.
 * @constructs {KeyManager}
 */
function keyManager(context) {
	var crypto = context.crypto;
	var storage = context.keyStorage;

	return /** @lends {KeyManager} */ {

		/**
		 * Generates a cryptographic key with default parameters.
		 * @returns {VirgilKey}
         */
		generate: function () {
			var keyPair = crypto.generateKeys();
			return new VirgilKey(context, keyPair.privateKey);
		},

		/**
		 * Loads the key with the given name and password from storage.
		 * @param {string} name - The name under which the key is stored.
		 * @param {string} password - The password used for key encryption.
		 *
		 * @returns {Promise.<VirgilKey>}
         */
		load: function (name, password) {
			utils.assert(utils.isString(name),
				'load expects name argument to be passed as a string. ' +
				'Got ' + typeof  name);

			utils.assert(utils.isString(password),
				'load expects password argument to be passed as a string. ' +
				'Got ' + typeof  password);

			return storage.load(name)
				.then(function (privateKeyData) {
					var privateKey = crypto.importPrivateKey(
						privateKeyData, 
						password);
					return new VirgilKey(context, privateKey);
				});
		},

		/**
		 * Removes the key with the given name from storage.
		 * @param {string} name - The name of the key to remove.
         * @returns {Promise}
         */
		destroy: function (name) {
			utils.assert(utils.isString(name),
				'destroy expects name argument to be passed as a string. ' +
				'Got ' + typeof name);

			return storage.remove(name);
		}
	}
}

module.exports = keyManager;
