import { describe, expect, it } from 'vitest';
import { getSyncClient } from '../../lib/client/sync-client.js';
import { getIntegrationTestConfig } from '../integration-tests.config.js';

describe('Integration tests', () => {
	describe('Init query', async () => {
		const config = getIntegrationTestConfig();
		const client = getSyncClient({ environmentId: config.environmentId });

		const response = await client.init().toPromise();

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
});
