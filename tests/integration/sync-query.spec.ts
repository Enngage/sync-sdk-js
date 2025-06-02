import { describe, expect, it } from 'vitest';
import { getSyncClient } from '../../lib/public_api.js';
import { getIntegrationTestConfig } from '../integration-tests.config.js';
import { prepareEnvironmentAsync, processChangesForIntegrationTestAsync } from '../utils/integration-test.utils.js';
import { waitAsync } from '../utils/test.utils.js';

type IntegrationSyncData = Parameters<typeof processChangesForIntegrationTestAsync>[0];

describe('Sync query', async () => {
	const timestamp = new Date().toJSON();
	const syncData: IntegrationSyncData = {
		item: {
			codename: 'integration_test_item',
			name: `Integration item (${timestamp})`,
		},
		type: {
			codename: 'integration_test_type',
			name: `Integration type (${timestamp})`,
		},
		language: {
			codename: 'default',
		},
		element: { type: 'text', name: 'Text element', codename: 'text_el', value: 'Elem value' },
	};

	const config = getIntegrationTestConfig();
	const client = getSyncClient({ environmentId: config.environmentId });

	// Get initial continuation token after preparing environment
	await prepareEnvironmentAsync(syncData);

	// We are waiting an arbitrary amount of time to make sure that the changes in environment are propagated to Delivery API
	await waitForDeliveryApiAsync();

	const token = (await client.init().toPromise()).meta.continuationToken;

	it('Should return continuation token', () => {
		expect(token).toBeDefined();
	});

	// Process all changes once we have initial continuation token
	await processChangesForIntegrationTestAsync(syncData);

	// We are waiting an arbitrary amount of time to make sure that the changes in environment are propagated to Delivery API
	await waitForDeliveryApiAsync();

	// Get all changes with Sync API and compare them to the sync data
	const syncResponse = await client.sync(token).toPromise();

	console.log('SYNC RESPONSE', syncResponse.payload);

	console.log('TYPE', syncResponse.payload.types?.[0]);
	console.log('ITEM', syncResponse.payload.items?.[0]);
	console.log('LANGUAGE', syncResponse.payload.languages?.[0]);
	console.log('TAXONOMY', syncResponse.payload.taxonomies?.[0]);
});

/**
 * We wait an arbitrary amount of time to make sure that the changes in environment are propagated to Delivery API
 * This is not ideal and can be improved by polling Delivery API for changes and after all changes are there
 * send Sync API init request
 */
async function waitForDeliveryApiAsync(): Promise<void> {
	await waitAsync(10000);
}
