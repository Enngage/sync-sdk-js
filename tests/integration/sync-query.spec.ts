import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { getSyncClient } from '../../lib/public_api.js';
import { getIntegrationTestConfig } from '../integration-tests.config.js';
import { prepareEnvironmentAsync, processChangesForIntegrationTestAsync } from '../utils/integration-test.utils.js';
import { waitAsync } from '../utils/test.utils.js';

type IntegrationSyncData = Parameters<typeof processChangesForIntegrationTestAsync>[0];

describe('Sync query', async () => {
	const config = getIntegrationTestConfig();
	const client = getSyncClient({ environmentId: config.environmentId });
	const syncData = getSyncData();
	const validationSchemas = getSchemas(syncData);

	// Get initial continuation token after preparing environment
	await prepareEnvironmentAsync(syncData);

	// We are waiting an arbitrary amount of time to make sure that the changes in environment are propagated to Delivery API
	await waitForDeliveryApiAsync();

	const token = (await client.init().toPromise()).meta.continuationToken;

	// Process all changes once we have initial continuation token
	await processChangesForIntegrationTestAsync(syncData);

	// We are waiting an arbitrary amount of time to make sure that the changes in environment are propagated to Delivery API
	await waitForDeliveryApiAsync();

	// Get all changes with Sync API and compare them to the sync data
	const syncResponse = await client.sync(token).toPromise();

	describe('Type delta', () => {
		const deltaTypeObject = syncResponse.payload.types.find((m) => m.data.system.codename === syncData.type.codename);

		it('Response payload should match schema', async () => {
			const parseResult = await validationSchemas.typeDeltaObject.safeParseAsync(deltaTypeObject);
			expect(parseResult.error).toBeUndefined();
			expect(parseResult.success).toBeTruthy();
		});
	});
});

/**
 * We wait an arbitrary amount of time to make sure that the changes in environment are propagated to Delivery API
 * This is not ideal and can be improved by polling Delivery API for changes and after all changes are there
 * send Sync API init request
 */
async function waitForDeliveryApiAsync(): Promise<void> {
	await waitAsync(10000);
}

function getSyncData(): IntegrationSyncData {
	const timestamp = new Date().getTime();

	return {
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
			name: `Lang (${timestamp})`,
		},
		taxonomy: {
			codename: 'integration_test_taxonomy',
			name: `Integration taxonomy (${timestamp})`,
		},
		element: { type: 'text', name: 'Text element', codename: 'text_el', value: 'Elem value' },
	};
}

function getSchemas(syncData: IntegrationSyncData): {
	readonly typeDeltaObject: z.ZodObject;
} {
	return {
		typeDeltaObject: z.object({
			change_type: z.literal('changed'),
			timestamp: z.string(),
			data: z.object({
				system: z.object({
					name: z.literal(syncData.type.name),
					id: z.string(),
					codename: z.literal(syncData.type.codename),
					last_modified: z.string(),
				}),
			}),
		}),
	};
}
