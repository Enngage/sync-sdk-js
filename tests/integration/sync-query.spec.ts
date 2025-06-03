import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { getSyncClient } from '../../lib/public_api.js';
import { getIntegrationTestConfig } from '../integration-tests.config.js';
import { pollSyncApiAsync, prepareEnvironmentAsync, processChangesForIntegrationTestAsync } from '../utils/integration-test.utils.js';

type IntegrationSyncData = Parameters<typeof processChangesForIntegrationTestAsync>[0];

describe('Sync query', async () => {
	const config = getIntegrationTestConfig();
	const client = getSyncClient({ environmentId: config.environmentId });
	const syncData = getSyncData();
	const validationSchemas = getSchemas(syncData);
	const pollWaitInMs: number = 500;
	const maxRetries: number = 20;

	// Get initial continuation token after preparing environment
	await prepareEnvironmentAsync(syncData);

	const token = (await client.init().toPromise()).meta.continuationToken;

	// Process all changes once we have initial continuation token
	await processChangesForIntegrationTestAsync(syncData);

	describe('Type delta', async () => {
		const deltaTypeObject = await pollSyncApiAsync({
			client,
			token,
			getDeltaObject: (response) => response.payload.types.find((m) => m.data.system.codename === syncData.type.codename),
			retryAttempt: 0,
			maxRetries,
			pollWaitInMs,
		});

		it('Response payload should match schema', async () => {
			const parseResult = await validationSchemas.typeDeltaObject.safeParseAsync(deltaTypeObject);
			expect(parseResult.error).toBeUndefined();
			expect(parseResult.success).toBeTruthy();
		});
	});
});

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
