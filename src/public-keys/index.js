var Virgil = require('virgil-crypto');
var assert = require('assert');
var ApiClient = require('apiapi');
var uuid = require('node-uuid');
var errors = require('./errors');
var errorHandler = require('../error-handler')(errors);

var signer = new Virgil.Signer();

module.exports = function createAPIClient (applicationToken, opts) {
	opts = typeof opts === 'object' ? opts : {};

	var apiClient = new ApiClient({
		baseUrl: opts.publicKeysBaseUrl || 'https://keys.virgilsecurity.com/v2',

		methods: {
			getPublicKey: 'get /public-key/{public_key_id}'
		},

		headers: {
			'X-VIRGIL-ACCESS-TOKEN': applicationToken
		},

		before: {
			getPublicKey: getPublicKey,
		},

		query: {
			getPublicKey: []
		},

		errorHandler: errorHandler,
		parse: parseResponse
	});

	apiClient.generateUUID = typeof opts.generateUUID === 'function' ? opts.generateUUID: uuid;
	apiClient.getRequestHeaders = getRequestHeaders;
	return apiClient;
}

function getRequestHeaders (requestBody, privateKey, virgilCardId) {
	var requestUUID = this.generateUUID();
	var requestText = requestUUID + JSON.stringify(requestBody);

	var headers = {
		'X-VIRGIL-REQUEST-SIGN': signer.sign(requestText, privateKey).toString('base64'),
		'X-VIRGIL-REQUEST-UUID': requestUUID,
	};

	if (virgilCardId) {
		headers['X-VIRGIL-REQUEST-SIGN-VIRGIL-CARD-ID'] = virgilCardId;
	}

	return headers;
}

function getPublicKey (params, requestBody, opts) {
	assert(params.public_key_id, 'public_key_id param is required');

	if (params.virgil_card_id && params.private_key) {
		opts.headers = this.getRequestHeaders(requestBody, params.private_key, params.virgil_card_id);
	}

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
