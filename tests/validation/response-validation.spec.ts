import { type HttpService, type JsonValue, getDefaultHttpService } from '@kontent-ai/core-sdk';
import { describe, test } from 'vitest';
import { type InitQueryPayload, type SyncSdkError, getSyncClient } from '../../lib/public_api.js';
import { fakeXContinuationTokenHeader } from '../integration-tests.config.js';

describe('Response validation', () => {
	test('Error should be returned when response does not match schema and validation is enabled', async ({ expect }) => {
		const { success, error } = await getSyncClient('x')
			.publicApi()
			.create({
				responseValidation: {
					enable: true,
				},
				httpService: getHttpServiceWithJsonResponse({ result: 'ok' }),
			})
			.init()
			.toPromise();

		expect(success).toBe(false);
		expect(error).toBeDefined();
		expect(error?.errorType).toStrictEqual<Pick<SyncSdkError, 'errorType'>['errorType']>('validation');
	});

	test('Error should not be returned when response does not match schema but validation is disabled', async ({ expect }) => {
		const { success, error } = await getSyncClient('x')
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
			.toPromise();

		expect(success).toBe(true);
		expect(error).toBeUndefined();
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
