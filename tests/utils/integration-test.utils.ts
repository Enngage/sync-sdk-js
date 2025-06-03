import { getDefaultHttpService, isKontent404Error } from '@kontent-ai/core-sdk';
import type { SyncClient, SyncClientTypes, SyncQueryPayload, SyncResponse } from '../../lib/public_api.js';
import { getIntegrationTestConfig } from '../integration-tests.config.js';

type ElementChangeEntityData = { readonly value: string } & ElementData;

type SharedEntityData = {
	readonly codename: string;
	readonly name: string;
};

type ElementData = { readonly type: 'text' } & SharedEntityData;

type LanguageVariantData = {
	readonly elements: readonly {
		readonly element: {
			readonly codename: string;
		};
		readonly value: string;
	}[];
};

const config = getIntegrationTestConfig();
const httpService = getDefaultHttpService({
	requestHeaders: [
		{
			name: 'Authorization',
			value: `Bearer ${config.mapiKey}`,
		},
	],
});

export async function prepareEnvironmentAsync({ item, type, taxonomy }: Parameters<typeof processChangesForIntegrationTestAsync>[0]): Promise<void> {
	await Promise.all([
		deleteEntityAndWaitUntilPropagatedToDeliveryApiAsync({
			deleteUrl: config.mapiUrls.taxonomy(taxonomy.codename),
			deliveryGetUrl: config.deliveryUrls.taxonomy(taxonomy.codename),
		}),
		deleteEntityAndWaitUntilPropagatedToDeliveryApiAsync({
			deleteUrl: config.mapiUrls.contentItem(item.codename),
			deliveryGetUrl: config.deliveryUrls.contentItem(item.codename),
		}),
	]);

	await deleteEntityAndWaitUntilPropagatedToDeliveryApiAsync({
		deleteUrl: config.mapiUrls.contentType(type.codename),
		deliveryGetUrl: config.deliveryUrls.contentType(type.codename),
	});
}

export async function processChangesForIntegrationTestAsync({
	item,
	type,
	element,
	language,
	taxonomy,
}: {
	readonly type: SharedEntityData;
	readonly element: ElementChangeEntityData;
	readonly item: SharedEntityData;
	readonly language: SharedEntityData;
	readonly taxonomy: SharedEntityData;
}): Promise<void> {
	await createContentTypeAsync(type, element);

	await Promise.all([createTaxonomyAsync(taxonomy), renameLanguageAsync(language), createContentItemAndVariantAsync(item, type, language, element)]);
}

export async function pollSyncApiAsync<T>({
	token,
	client,
	getDeltaObject,
	retryAttempt,
	maxRetries,
	pollWaitInMs,
}: {
	readonly client: SyncClient<SyncClientTypes>;
	readonly pollWaitInMs: number;
	readonly token: string;
	readonly getDeltaObject: (response: SyncResponse<SyncQueryPayload<SyncClientTypes>>) => T | undefined;
	readonly retryAttempt: number;
	readonly maxRetries: number;
}): Promise<T | undefined> {
	if (retryAttempt >= maxRetries) {
		return undefined;
	}

	const syncResponse = await client.sync(token).toPromise();

	const data = await getDeltaObject(syncResponse);

	if (!data) {
		// if data is not available, wait & try again
		await waitAsync(pollWaitInMs);
		return await pollSyncApiAsync({ client, getDeltaObject, token, retryAttempt: retryAttempt + 1, maxRetries, pollWaitInMs });
	}

	return data;
}

export async function waitUntilDeliveryEntityIsDeletedAsync({
	fetchEntityUrl,
	retryAttempt,
	maxRetries,
	pollWaitInMs,
}: {
	readonly pollWaitInMs: number;
	readonly fetchEntityUrl: string;
	readonly retryAttempt: number;
	readonly maxRetries: number;
}): Promise<void> {
	if (retryAttempt >= maxRetries) {
		return;
	}

	try {
		const response = await httpService.requestAsync({
			url: fetchEntityUrl,
			body: null,
			method: 'GET',
		});

		if (response.adapterResponse.isValidResponse) {
			// if response is valid, it means the deleted entity has not been propagated to delivery API yet
			// so we wait & try again
			await waitAsync(pollWaitInMs);
			return await waitUntilDeliveryEntityIsDeletedAsync({ fetchEntityUrl, retryAttempt: retryAttempt + 1, maxRetries, pollWaitInMs });
		}
	} catch (error) {
		if (isKontent404Error(error)) {
			// if entity is not found, it means it has been deleted
			return;
		}

		throw error;
	}
}
async function renameLanguageAsync(language: SharedEntityData): Promise<void> {
	await httpService.requestAsync<
		SharedEntityData,
		{
			op: 'replace';
			property_name: 'name';
			value: string;
		}[]
	>({
		url: config.mapiUrls.language(language.codename),
		body: [
			{
				op: 'replace',
				property_name: 'name',
				value: language.name,
			},
		],
		method: 'PATCH',
	});
}

async function createTaxonomyAsync(taxonomy: SharedEntityData): Promise<void> {
	await httpService.requestAsync<SharedEntityData, SharedEntityData & { terms: [] }>({
		url: config.mapiUrls.taxonomies,
		body: {
			codename: taxonomy.codename,
			name: taxonomy.name,
			terms: [],
		},
		method: 'POST',
	});
}

async function createContentTypeAsync(type: SharedEntityData, element: ElementChangeEntityData): Promise<void> {
	await httpService.requestAsync<
		SharedEntityData,
		SharedEntityData & {
			readonly elements: readonly ElementData[];
		}
	>({
		url: config.mapiUrls.contentTypes,
		body: {
			codename: type.codename,
			name: type.name,
			elements: [
				{
					codename: element.codename,
					name: element.name,
					type: element.type,
				},
			],
		},
		method: 'POST',
	});
}

function waitAsync(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deleteEntityAndWaitUntilPropagatedToDeliveryApiAsync({
	deleteUrl,
	deliveryGetUrl,
}: { readonly deleteUrl: string; readonly deliveryGetUrl: string }): Promise<void> {
	await skip404ErrorsAsync(async () => {
		await httpService.requestAsync<SharedEntityData, null>({
			url: deleteUrl,
			body: null,
			method: 'DELETE',
		});

		await waitUntilDeliveryEntityIsDeletedAsync({
			fetchEntityUrl: deliveryGetUrl,
			maxRetries: 20,
			pollWaitInMs: 500,
			retryAttempt: 0,
		});
	});
}

async function createContentItemAndVariantAsync(
	item: SharedEntityData,
	type: SharedEntityData,
	language: SharedEntityData,
	element: ElementChangeEntityData,
): Promise<void> {
	await httpService.requestAsync<
		SharedEntityData,
		SharedEntityData & {
			readonly type: {
				readonly codename: string;
			};
		}
	>({
		url: config.mapiUrls.contentItems,
		body: {
			codename: item.codename,
			name: item.name,
			type: {
				codename: type.codename,
			},
		},
		method: 'POST',
	});

	await httpService.requestAsync<null, LanguageVariantData>({
		url: config.mapiUrls.languageVariant(item.codename, language.codename),
		body: {
			elements: [
				{
					element: {
						codename: element.codename,
					},
					value: element.value,
				},
			],
		},
		method: 'PUT',
	});

	await httpService.requestAsync<null, null>({
		url: config.mapiUrls.publish(item.codename, language.codename),
		body: null,
		method: 'PUT',
	});
}

async function skip404ErrorsAsync<T>(fn: () => Promise<T>): Promise<T | undefined> {
	try {
		return await fn();
	} catch (error) {
		if (isKontent404Error(error)) {
			return undefined;
		}

		throw error;
	}
}
