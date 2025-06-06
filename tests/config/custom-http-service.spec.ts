import type { ExecuteRequestOptions, JsonValue } from '@kontent-ai/core-sdk';
import { describe, expect, it } from 'vitest';
import { getSyncClient } from '../../lib/public_api.js';
import { fakeXContinuationTokenHeader } from '../integration-tests.config.js';

describe('Custom http service', () => {
	it('Custom http service should be used', async () => {
		const fakeResponse = { result: 'ok' };

		const initResponse = await getSyncClient('x')
			.publicApi()
			.create({
				httpService: {
					requestAsync: async <TResponseData extends JsonValue, TBodyData extends JsonValue>(opts: ExecuteRequestOptions<TBodyData>) => {
						return {
							data: fakeResponse as JsonValue as TResponseData,
							body: opts.body,
							method: opts.method,
							requestHeaders: opts.requestHeaders ?? [],
							adapterResponse: {
								isValidResponse: true,
								statusText: 'Ok',
								responseHeaders: [fakeXContinuationTokenHeader],
								status: 200,
								toJsonAsync: async () => fakeResponse,
								toBlobAsync: async () => null,
							},
						};
					},
					downloadFileAsync: async () => {
						throw new Error('Not implemented');
					},
					uploadFileAsync: async () => {
						throw new Error('Not implemented');
					},
				},
			})
			.init()
			.toPromise();

		expect(initResponse.payload).toStrictEqual(fakeResponse);
		expect(initResponse.meta.continuationToken).toStrictEqual(fakeXContinuationTokenHeader.value);
	});
});
