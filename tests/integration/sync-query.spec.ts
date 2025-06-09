import { describe, expect, it, suite } from 'vitest';
import { getSyncClient } from '../../lib/client/sync-client.js';
import { syncQueryPayloadSchema } from '../../lib/queries/sync-query.js';
import {
	contentItemDeltaObjectSchema,
	contentTypeDeltaObjectSchema,
	languageDeltaObjectSchema,
	taxonomyDeltaObjectSchema,
} from '../../lib/schemas/synchronization.schemas.js';
import { getIntegrationTestConfig } from '../integration-tests.config.js';
import { pollSyncApiAsync, prepareEnvironmentAsync, processChangesForIntegrationTestAsync } from '../utils/integration-test.utils.js';

type IntegrationSyncData = Parameters<typeof processChangesForIntegrationTestAsync>[0];

describe('Sync query', async () => {
	const config = getIntegrationTestConfig();
	const client = getSyncClient(config.env.id).publicApi().create({
		baseUrl: config.env.syncBaseUrl,
	});
	const syncData = getSyncData();
	const pollWaitInMs: number = 500;
	const maxRetries: number = 20;

	await prepareEnvironmentAsync(syncData);

	// Get initial continuation token after preparing environment & waiting until Delivery API changes are propagated
	const { data } = await client.init().toPromise();

	const token = data?.meta.continuationToken ?? 'n/a';

	it('Response payload should match schema', async () => {
		const parseResult = await syncQueryPayloadSchema.safeParseAsync(data?.payload);
		expect(parseResult.error).toBeUndefined();
		expect(parseResult.success).toBeTruthy();
	});

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
			const parseResult = await contentTypeDeltaObjectSchema.safeParseAsync(deltaTypeObject);
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
			const parseResult = await taxonomyDeltaObjectSchema.safeParseAsync(deltaTaxonomyObject);
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
			const parseResult = await contentItemDeltaObjectSchema.safeParseAsync(deltaItemObject);
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
			const parseResult = await languageDeltaObjectSchema.safeParseAsync(deltaLanguageObject);
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
