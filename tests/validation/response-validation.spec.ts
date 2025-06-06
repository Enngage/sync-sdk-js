import { type HttpService, type JsonValue, getDefaultHttpService } from '@kontent-ai/core-sdk';
import { describe, test } from 'vitest';
import { SyncSdkError } from '../../lib/models/core.models.js';
import { type InitQueryPayload, getSyncClient } from '../../lib/public_api.js';
import { fakeXContinuationTokenHeader } from '../integration-tests.config.js';

describe('Response validation', () => {
	test('Error should be thrown when response does not match schema and validation is enabled', async ({ expect }) => {
		await expect(async () => {
			await getSyncClient('x')
				.publicApi()
				.create({
					responseValidation: {
						enable: true,
					},
					httpService: getHttpServiceWithJsonResponse({ result: 'ok' }),
				})
				.init()
				.toPromise();
		}).rejects.toThrowError(SyncSdkError);
	});

	test('Error should not be thrown when response does not match schema but validation is disabled', async ({ expect }) => {
		await expect(
			getSyncClient('x')
				.publicApi()
				.create({
					responseValidation: {
						enable: true,
					},

					httpService: getHttpServiceWithJsonResponse({
						items: [],
						languages: [],
						taxonomies: [],
						types: [],
					} satisfies InitQueryPayload),
				})
				.init()
				.toPromise(),
		).resolves.toBeDefined();
	});
});

function getHttpServiceWithJsonResponse(fakeResponse: JsonValue): HttpService {
	return getDefaultHttpService({
		adapter: {
			requestAsync: async (options) => {
				return {
					data: fakeResponse,
					body: null,
					method: 'GET',
					requestHeaders: options.requestHeaders,
					isValidResponse: true,
					responseHeaders: [fakeXContinuationTokenHeader],
					status: 200,
					statusText: 'Ok',
					toJsonAsync: async () => fakeResponse,
					toBlobAsync: async () => {
						throw new Error('Not implemented');
					},
				};
			},
		},
	});
}
