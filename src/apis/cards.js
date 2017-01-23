var ApiClient = require('apiapi');
var errors = require('./cards-errors');
var errorHandler = require('../shared/error-handler')(errors);

module.exports = function createCardsClient (applicationToken, opts) {
	var apiClient = new ApiClient({
		baseUrl: opts.cardsBaseUrl || 'https://cards.virgilsecurity.com/v4',

		methods: {
			publish: 'post /card',
			revoke: 'delete /card/{card_id}'
		},

		headers: {
			'Authorization': 'VIRGIL ' + applicationToken
		},

		body: {
			publish: ['content_snapshot', 'meta'],
			revoke: ['content_snapshot', 'meta']
		},

		required: {
			publish: ['content_snapshot', 'meta'],
			revoke: ['content_snapshot', 'meta']
		},

		errorHandler: errorHandler,

		transformResponse: function transformResponse (res) {
			return res.data;
		}
	});

	return apiClient;
};
