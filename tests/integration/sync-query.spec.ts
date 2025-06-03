import { describe, expect, it, suite } from 'vitest';
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

	suite.concurrent('Type delta object', async () => {
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

	suite.concurrent('Taxonomy delta object', async () => {
		const deltaTaxonomyObject = await pollSyncApiAsync({
			client,
			token,
			getDeltaObject: (response) => response.payload.taxonomies.find((m) => m.data.system.codename === syncData.taxonomy.codename),
			retryAttempt: 0,
			maxRetries,
			pollWaitInMs,
		});

		it('Response payload should match schema', async () => {
			const parseResult = await validationSchemas.taxonomyDeltaObject.safeParseAsync(deltaTaxonomyObject);
			expect(parseResult.error).toBeUndefined();
			expect(parseResult.success).toBeTruthy();
		});
	});

	suite.concurrent('Item delta object', async () => {
		const deltaItemObject = await pollSyncApiAsync({
			client,
			token,
			getDeltaObject: (response) => response.payload.items.find((m) => m.data.system.codename === syncData.item.codename),
			retryAttempt: 0,
			maxRetries,
			pollWaitInMs,
		});

		it('Response payload should match schema', async () => {
			const parseResult = await validationSchemas.itemDeltaObject.safeParseAsync(deltaItemObject);
			expect(parseResult.error).toBeUndefined();
			expect(parseResult.success).toBeTruthy();
		});
	});

	suite.concurrent('Language delta object', async () => {
		const deltaLanguageObject = await pollSyncApiAsync({
			client,
			token,
			getDeltaObject: (response) => response.payload.languages.find((m) => m.data.system.codename === syncData.language.codename),
			retryAttempt: 0,
			maxRetries,
			pollWaitInMs,
		});

		it('Response payload should match schema', async () => {
			const parseResult = await validationSchemas.languageDeltaObject.safeParseAsync(deltaLanguageObject);
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
	readonly taxonomyDeltaObject: z.ZodObject;
	readonly itemDeltaObject: z.ZodObject;
	readonly languageDeltaObject: z.ZodObject;
} {
	return {
		typeDeltaObject: z.strictObject({
			change_type: z.literal('changed'),
			timestamp: z.string(),
			data: z.strictObject({
				system: z.strictObject({
					name: z.literal(syncData.type.name),
					id: z.string(),
					codename: z.literal(syncData.type.codename),
					last_modified: z.string(),
				}),
			}),
		}),
		taxonomyDeltaObject: z.strictObject({
			change_type: z.literal('changed'),
			timestamp: z.string(),
			data: z.strictObject({
				system: z.strictObject({
					name: z.literal(syncData.taxonomy.name),
					id: z.string(),
					codename: z.literal(syncData.taxonomy.codename),
					last_modified: z.string(),
				}),
			}),
		}),
		itemDeltaObject: z.strictObject({
			change_type: z.literal('changed'),
			timestamp: z.string(),
			data: z.strictObject({
				system: z.strictObject({
					name: z.literal(syncData.item.name),
					id: z.string(),
					codename: z.literal(syncData.item.codename),
					last_modified: z.string(),
					language: z.literal(syncData.language.codename),
					type: z.literal(syncData.type.codename),
					collection: z.string(),
					sitemap_locations: z.array(z.string()),
					workflow: z.string(),
					workflow_step: z.string(),
				}),
			}),
		}),
		languageDeltaObject: z.strictObject({
			change_type: z.literal('changed'),
			timestamp: z.string(),
			data: z.strictObject({
				system: z.strictObject({
					name: z.literal(syncData.language.name),
					id: z.string(),
					codename: z.literal(syncData.language.codename),
				}),
			}),
		}),
	};
}
