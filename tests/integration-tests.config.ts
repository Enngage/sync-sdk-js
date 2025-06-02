import { getEndpointUrl } from '../lib/utils/query.utils.js';
import { getEnvironmentRequiredValue } from './utils/test.utils.js';

const integrationEnv = {
	id: getEnvironmentRequiredValue('INTEGRATION_ENVIRONMENT_ID'),
	mapiKey: getEnvironmentRequiredValue('INTEGRATION_MANAGEMENT_API_KEY'),
} as const;

export function getIntegrationTestConfig() {
	const languageVariantUrl = (itemCodename: string, languageCodename: string) =>
		getMapiEndpointUrl({ environmentId: integrationEnv.id, path: `/items/codename/${itemCodename}/variants/codename/${languageCodename}` });

	return {
		environmentId: integrationEnv.id,
		mapiKey: integrationEnv.mapiKey,
		urls: {
			contentType: (codename: string) => getMapiEndpointUrl({ environmentId: integrationEnv.id, path: `/types/codename/${codename}` }),
			taxonomy: (codename: string) => getMapiEndpointUrl({ environmentId: integrationEnv.id, path: `/taxonomies/codename/${codename}` }),
			contentItem: (codename: string) => getMapiEndpointUrl({ environmentId: integrationEnv.id, path: `/items/codename/${codename}` }),
			language: (codename: string) => getMapiEndpointUrl({ environmentId: integrationEnv.id, path: `/languages/codename/${codename}` }),
			languageVariant: languageVariantUrl,
			publish: (itemCodename: string, languageCodename: string) => `${languageVariantUrl(itemCodename, languageCodename)}/publish`,
			contentTypes: getMapiEndpointUrl({ environmentId: integrationEnv.id, path: '/types' }),
			taxonomies: getMapiEndpointUrl({ environmentId: integrationEnv.id, path: '/taxonomies' }),
			contentItems: getMapiEndpointUrl({ environmentId: integrationEnv.id, path: '/items' }),
		},
	};
}

export function getMapiEndpointUrl({ environmentId, path }: { readonly environmentId: string; readonly path: string }): string {
	// return getEndpointUrl({ environmentId, path, baseUrl: 'https://manage.kontent.ai/v2/projects/' });
	return getEndpointUrl({ environmentId, path, baseUrl: 'https://manage.devkontentmasters.com/v2/projects/' });
}
