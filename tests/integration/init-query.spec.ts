import { describe, expect, it } from 'vitest';
import { getSyncClient } from '../../lib/client/sync-client.js';
import { initQueryPayloadSchema } from '../../lib/queries/init-query.js';
import { getIntegrationTestConfig } from '../integration-tests.config.js';

describe('Init query', async () => {
	const config = getIntegrationTestConfig();
	const client = getSyncClient(config.env.id).publicApi().create({
		baseUrl: config.env.syncBaseUrl,
	});

	const { data } = await client.init().toPromise();

	it('Response payload should match schema', async () => {
		const parseResult = await initQueryPayloadSchema.safeParseAsync(data?.payload);
		expect(parseResult.error).toBeUndefined();
		expect(parseResult.success).toBeTruthy();
	});

	it('Response should contain empty array of items', () => {
		expect(data?.payload.items).toEqual([]);
	});

	it('Response should contain empty array of taxonomies', () => {
		expect(data?.payload.taxonomies).toEqual([]);
	});

	it('Response should contain empty array of types', () => {
		expect(data?.payload.types).toEqual([]);
	});

	it('Response should contain empty array of languages', () => {
		expect(data?.payload.languages).toEqual([]);
	});

	it('Response should contain continuation token', () => {
		expect(data?.meta.continuationToken).toBeDefined();
		expect(typeof data?.meta.continuationToken).toBe('string');
		expect(data?.meta.continuationToken?.length).toBeGreaterThan(0);
	});
});
