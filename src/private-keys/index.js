var Virgil = require('virgil-crypto');
var assert = require('assert');
var ApiClient = require('apiapi');
var uuid = require('node-uuid');
var errors = require('./errors');

var PRIVATE_KEYS_SERVICE_APP_ID = 'user@virgilsecurity.com';
var PRIVATE_KEYS_SERVICE_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\nMIGbMBQGByqGSM49AgEGCSskAwMCCAEBDQOBggAEnsoNapK9CZjl5p9b1eF85IyC\nG6RrDo1rsNY99CJlDw0B7018YcqZIJT6gGn2t4CgoS0gCm7SOTMr9xahfJ9m10kw\n69Fb6qOW1oFUYGFZOw0p5bzYv8zh3WJnbr/JhvPm49Rp73j4vYW9z3xx4yFuOh6D\n6etbkZ7GOxxA9SIsSl4=\n-----END PUBLIC KEY-----";

var signer = new Virgil.Signer();

module.exports = function createAPIClient (applicationToken, opts) {
	opts = typeof opts === 'object' ? opts : {};

	var apiClient = new ApiClient({
		baseUrl: opts.privateKeysBaseUrl || 'https://keys.virgilsecurity.com/v2',

		methods: {
			stash: 'post /private-key',
			get: 'post /private-key/actions/grab',
			destroy: 'post /private-key/actions/delete',
		},

		headers: {
			'X-VIRGIL-ACCESS-TOKEN': applicationToken
		},

		before: {
			stash: stash,
			get: get,
			destroy: destroy,
		},

		body: {
			stash: ['private_key', 'virgil_card_id'],
			get: ['identity', 'response_password', 'virgil_card_id'],
			destroy: ['virgil_card_id']
		},

		errorHandler: errorHandler,
		parse: parseResponse
	});

	apiClient.generateUUID = typeof opts.generateUUID === 'function' ? opts.generateUUID: uuid;
	apiClient.getRequestHeaders = getRequestHeaders;
	return apiClient;
}

function encryptBody (requestBody) {
	var cipher = new Virgil.Cipher();
	cipher.addKeyRecipient(PRIVATE_KEYS_SERVICE_APP_ID, PRIVATE_KEYS_SERVICE_PUBLIC_KEY);
	return cipher.encrypt(JSON.stringify(requestBody)).toString('base64');
}

function getRequestHeaders (requestBody, privateKey, virgilCardId) {
	var requestUUID = this.generateUUID();
	var requestText = requestUUID + JSON.stringify(requestBody);

	var headers = {
		'X-VIRGIL-REQUEST-SIGN': signer.sign(requestText, privateKey).toString('base64'),
		'X-VIRGIL-REQUEST-UUID': requestUUID,
	};

	return headers;
}

function stash (params, requestBody, opts) {
	assert(params.private_key, 'private_key param is required');
	assert(params.virgil_card_id, 'virgil_card_id param is required');

	if (params.private_key) {
		requestBody.private_key = new Buffer(params.private_key, 'utf8').toString('base64');
	}

	requestBody = encryptBody(requestBody);
	opts.headers = this.getRequestHeaders(requestBody, params.private_key, params.virgil_card_id);
	return [params, requestBody, opts];
}

function get (params, requestBody, opts) {
	assert(params.identity, 'identity is required');
	assert(params.response_password, 'response_password');
	assert(params.virgil_card_id, 'virgil_card_id');
	requestBody = encryptBody(requestBody);
	return [params, requestBody, opts];
}

function destroy (params, requestBody, opts) {
	assert(params.virgil_card_id, 'virgil_card_id is param is required');
	requestBody = encryptBody(requestBody);
	opts.headers = this.getRequestHeaders(requestBody, params.private_key, params.virgil_card_id);
	return [params, requestBody, opts];
}

function parseResponse (res) {
	if (res.status === 404) {
		throw new Error('Item not found');
	}

	var body = res.data;
	if (body) {
		if (body.public_key) {
			body.public_key.public_key = new Buffer(body.public_key.public_key, 'base64').toString('utf8');
		}

		return body;
	}
}

function errorHandler (res) {
	if (res.data.code) {
		throw createError(res.data.code);
	}

	throw new Error(res);
}

function createError (code) {
	var err = new Error();
	err.message = errors[code];
	err.code = code;
	return err;
}
