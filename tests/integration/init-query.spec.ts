import { describe, expect, it } from 'vitest';
import { getSyncClient } from '../../lib/client/sync-client.js';
import { initQueryPayloadSchema } from '../../lib/queries/init-query.js';
import { getIntegrationTestConfig } from '../integration-tests.config.js';

describe('Init query', async () => {
	const config = getIntegrationTestConfig();
	const client = getSyncClient(config.env.id).publicApi().create({
		baseUrl: config.env.syncBaseUrl,
	});

	const response = await client.init().toPromise();

	it('Response payload should match schema', async () => {
		const parseResult = await initQueryPayloadSchema.safeParseAsync(response.payload);
		expect(parseResult.error).toBeUndefined();
		expect(parseResult.success).toBeTruthy();
	});

	it('Response should contain empty array of items', () => {
		expect(response.payload.items).toEqual([]);
	});

	it('Response should contain empty array of taxonomies', () => {
		expect(response.payload.taxonomies).toEqual([]);
	});

	it('Response should contain empty array of types', () => {
		expect(response.payload.types).toEqual([]);
	});

	it('Response should contain empty array of languages', () => {
		expect(response.payload.languages).toEqual([]);
	});

	it('Response should contain continuation token', () => {
		expect(response.meta.continuationToken).toBeDefined();
		expect(typeof response.meta.continuationToken).toBe('string');
		expect(response.meta.continuationToken?.length).toBeGreaterThan(0);
	});
});
