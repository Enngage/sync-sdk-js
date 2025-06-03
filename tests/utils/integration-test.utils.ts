import { getDefaultHttpService, isKontent404Error } from '@kontent-ai/core-sdk';
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
	await deleteEntityAsync(config.urls.contentItem(item.codename));
	await deleteEntityAsync(config.urls.contentType(type.codename));
	await deleteEntityAsync(config.urls.taxonomy(taxonomy.codename));
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
	await createContentItemAndVariantAsync(item, type, language, element);
	await renameLanguageAsync(language);
	await createTaxonomyAsync(taxonomy);
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
		url: config.urls.language(language.codename),
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
		url: config.urls.taxonomies,
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
		url: config.urls.contentTypes,
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

async function deleteEntityAsync(url: string): Promise<void> {
	await skip404ErrorsAsync(async () => {
		await httpService.requestAsync<SharedEntityData, null>({
			url: url,
			body: null,
			method: 'DELETE',
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
		url: config.urls.contentItems,
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
		url: config.urls.languageVariant(item.codename, language.codename),
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
		url: config.urls.publish(item.codename, language.codename),
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
