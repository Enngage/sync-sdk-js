import type { BaseQuery, SyncClient, SyncClientConfig, SyncClientTypes } from '../models/core.models.js';
import type { ContentItemDeltaObject, ContentTypeDeltaObject, LanguageDeltaObject, TaxonomyDeltaObject } from '../models/synchronization.models.js';
import { getEndpointUrl, requestAsync } from '../utils/query.utils.js';

export type SyncQueryPayload<TSyncApiTypes extends SyncClientTypes> = {
	readonly items: readonly ContentItemDeltaObject<TSyncApiTypes>[];
	readonly types: readonly ContentTypeDeltaObject<TSyncApiTypes>[];
	readonly languages: readonly LanguageDeltaObject<TSyncApiTypes>[];
	readonly taxonomies: readonly TaxonomyDeltaObject<TSyncApiTypes>[];
};

export type SyncQuery<TSyncApiTypes extends SyncClientTypes> = BaseQuery<SyncQueryPayload<TSyncApiTypes>>;

export function getSyncQuery<TSyncApiTypes extends SyncClientTypes>(config: SyncClientConfig): ReturnType<SyncClient<TSyncApiTypes>['sync']> {
	return {
		toPromise: async () => {
			return await requestAsync<SyncQueryPayload<TSyncApiTypes>, null>({
				config,
				func: async (httpService) => {
					return await httpService.requestAsync({
						url: getEndpointUrl({ environmentId: config.environmentId, path: '/sync' }),
						body: null,
						method: 'GET',
					});
				},
			});
		},
	};
}
