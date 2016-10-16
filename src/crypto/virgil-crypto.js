import { VirgilCrypto } from 'virgil-crypto';
import cryptoAsyncPatch from '../crypto-async-patch';

const Buffer = VirgilCrypto.Buffer;

cryptoAsyncPatch(VirgilCrypto);

/**
 * Represents private key.
 * @typedef {Object} PrivateKey
 */

/**
 * Represents public key.
 * @typedef {Object} PublicKey
 */

/**
 * Represents key pair.
 * @typedef {Object} KeyPair
 * @property {PrivateKey} privateKey - Private part of the key
 * @property {PublicKey} publicKey - Public part of the key
 */

const keyValueStore = new WeakMap();

export function virgilCrypto() {

	return {
		generateKeys,
		importPrivateKey,
		importPublicKey,
		exportPrivateKey,
		exportPublicKey,
		extractPublicKey,
		encrypt,
		decrypt,
		sign,
		verify,
		hash,
		calculateFingerprint,
		HashAlgorithm: VirgilCrypto.HashAlgorithm,
		KeyPairType: VirgilCrypto.KeysTypeEnum
	};

	function createPrivateKey(recipientId, value) {
		const privateKey = {};
		keyValueStore.set(privateKey, { recipientId, value });
		return privateKey;
	}

	function createPublicKey(recipientId, value) {
		const publicKey = {};
		keyValueStore.set(publicKey, { recipientId, value });
		return publicKey;
	}

	/**
	 * Generates new key pair.
	 *
	 * @param {string} [keyPairType] - Type of key pair. See virgilCrypto.KeyPairType for available options
	 * @returns {object}
	 * */
	function generateKeys(keyPairType) {
		const keyPair = VirgilCrypto.generateKeyPair({ type: keyPairType });
		const publicKeyDER = VirgilCrypto.publicKeyToDER(keyPair.publicKey);
		const privateKeyDER = VirgilCrypto.privateKeyToDER(keyPair.privateKey);
		const keyPairId = VirgilCrypto.hash(publicKeyDER);

		return {
			privateKey: createPrivateKey(keyPairId, privateKeyDER),
			publicKey: createPublicKey(keyPairId, publicKeyDER)
		};
	}

	/**
	 * Imports private key from material representation.
	 *
	 * @param {Buffer} rawPrivateKey - Private key bytes
	 * @param {string} [password] - Password the key is encrypted with
	 *
	 * @returns {PrivateKey}
	 * */
	function importPrivateKey(rawPrivateKey, password) {
		if (!Buffer.isBuffer(rawPrivateKey)) {
			throw new TypeError('Unexpected type of "rawPrivateKey", use Buffer.');
		}

		rawPrivateKey = password ?
			VirgilCrypto.decryptPrivateKey(rawPrivateKey, new Buffer(password)) :
			rawPrivateKey;

		const privateKeyDER = VirgilCrypto.privateKeyToDER(rawPrivateKey);
		const publicKey = VirgilCrypto.extractPublicKey(privateKeyDER);

		return createPrivateKey(VirgilCrypto.hash(publicKey), privateKeyDER);
	}

	/**
	 * Imports public key from material representation.
	 *
	 * @param {Buffer} rawPublicKey - Public key bytes
	 *
	 * @returns {PublicKey}
	 * */
	function importPublicKey(rawPublicKey) {
		if (!Buffer.isBuffer(rawPublicKey)) {
			throw new TypeError('Unexpected type of "rawPublicKey", use Buffer.');
		}

		return createPublicKey(VirgilCrypto.hash(rawPublicKey), VirgilCrypto.publicKeyToDER(rawPublicKey));
	}

	/**
	 * Exports private key into material representation.
	 *
	 * @param {PrivateKey} privateKey - Private key to export
	 * @param {string} [password] - Password to encrypt the key with
	 *
	 * @returns {Buffer}
	 * */
	function exportPrivateKey(privateKey, password) {
		const keyData = keyValueStore.get(privateKey);
		if (!keyData) {
			throw new Error('Cannot export private key. Object passed is not a valid private key.');
		}

		if (!password) {
			return VirgilCrypto.privateKeyToDER(keyData.value);
		}

		const passwordBuffer = new Buffer(password);
		const encryptedKey = VirgilCrypto.encryptPrivateKey(keyData.value, passwordBuffer);
		return VirgilCrypto.privateKeyToDER(encryptedKey, passwordBuffer);
	}

	/**
	 * Exports public key into material representation.
	 *
	 * @param {PublicKey} publicKey - Public key to export
	 *
	 * @returns {Buffer}
	 * */
	function exportPublicKey(publicKey) {
		const keyData = keyValueStore.get(publicKey);
		if (!keyData) {
			throw new Error('Cannot export public key. Object passed is not a valid public key.');
		}

		return VirgilCrypto.publicKeyToDER(keyData.value);
	}

	/**
	 * Extracts public key from private key.
	 *
	 * @param {PrivateKey} privateKey
	 * @param {string} [password=''] - Password the private key is encrypted with
	 *
	 * @returns {PublicKey}
	 * */
	function extractPublicKey(privateKey, password) {
		var keyData = keyValueStore.get(privateKey);
		if (!keyData) {
			throw new Error('Cannot extract public key. Object passed is not a valid private key.');
		}

		var publicKey = VirgilCrypto.extractPublicKey(keyData.value, new Buffer(password));
		return createPublicKey(keyData.recipientId, VirgilCrypto.publicKeyToDER(publicKey));
	}

	/**
	 * Encrypts the data for recipients.
	 *
	 * @param {Buffer} data - Data to encrypt
	 * @param {PublicKey|PublicKey[]} recipients - Public keys to encrypt the data with.
	 *
	 * @returns {Buffer} - Encrypted data
	 * */
	function encrypt(data, recipients) {
		if (!Buffer.isBuffer(data)) {
			throw new TypeError('Cannot encrypt the given data. Argument "data" must be a Buffer.');
		}

		recipients = Array.isArray(recipients) ? recipients : [recipients];

		const publicKeys = recipients.map((recipient) => {
			const keyData = keyValueStore.get(recipient);
			if (!keyData) {
				throw new Error('Cannot encrypt data. Object passed is not a valid public key.');
			}
			return keyData;
		});

		return VirgilCrypto.encrypt(data, publicKeys);
	}

	/**
	 * Decrypts the data with private key.
	 *
	 * @param {Buffer} cipherData - Encrypted data
	 * @param {PrivateKey} privateKey - Private key to decrypt with
	 *
	 * @returns {Buffer} - Decrypted data
	 * */
	function decrypt(cipherData, privateKey) {
		if (!Buffer.isBuffer(cipherData)) {
			throw new TypeError('Cannot decrypt the given data. Argument "cipherData" must be a Buffer.');
		}

		const keyData = keyValueStore.get(privateKey);
		if (!keyData) {
			throw new Error('Cannot decrypt with given key. Object passed is not a valid private key.');
		}

		return VirgilCrypto.decrypt(cipherData, keyData.recipientId, keyData.value);
	}

	/**
	 * Signs the data with private key.
	 *
	 * @param {Buffer} data - Data to sign
	 * @param {PrivateKey} privateKey - Private key to sign with
	 * */
	function sign(data, privateKey) {
		if (!Buffer.isBuffer(data)) {
			throw new TypeError('Cannot sign the given data. Argument "data" must be a Buffer.');
		}

		const keyData = keyValueStore.get(privateKey);
		if (!keyData) {
			throw new Error('Cannot sign with given key. Object passed is not a valid private key');
		}

		return VirgilCrypto.sign(data, keyData.value);
	}

	/**
	 * Verifies the signature using public key.
	 *
	 * @param {Buffer} data - The data to verify signature of
	 * @param {Buffer} signature - The signature to verify
	 * @param {PublicKey} publicKey - Public key to verify with
	 *
	 * @returns {Boolean}
	 * */
	function verify(data, signature, publicKey) {
		if (!Buffer.isBuffer(data)) {
			throw new TypeError('Cannot verify the signature. Argument "data" must be a Buffer.');
		}

		if (!Buffer.isBuffer(signature)) {
			throw new TypeError('Cannot verify the signature. Argument "signature" must be a Buffer.');
		}

		const keyData = keyValueStore.get(publicKey);
		if (!keyData) {
			throw new Error('Cannot verify the signature. Object provided is not a valid public key.');
		}

		return VirgilCrypto.verify(data, keyData.value, signature);
	}

	/**
	 * Calculates the fingerprint of given data
	 *
	 * @param {Buffer} data
	 *
	 * @returns {Buffer} - Fingerprint
	 * */
	function calculateFingerprint(data) {
		if (!Buffer.isBuffer(data)) {
			throw new TypeError('Cannot calculate fingerprint. Argument "data" must be a Buffer.')
		}

		return VirgilCrypto.hash(data, VirgilCrypto.HashAlgorithm.SHA256);
	}

	/**
	 * Calculates the hash of given data
	 *
	 * @param {Buffer} data
	 * @param {string} [algorithm] - Hash algorithm to use. See virgilCrypto.HashAlgorithm for available options
	 *
	 * @returns {Buffer} - Hash
	 * */
	function hash(data, algorithm) {
		if (!Buffer.isBuffer(data)) {
			throw new TypeError('Cannot hash data. Argument "data" must be a Buffer.')
		}

		return VirgilCrypto.hash(data, algorithm);
	}
}

virgilCrypto.KeyPairTypes = VirgilCrypto.KeysTypesEnum;
