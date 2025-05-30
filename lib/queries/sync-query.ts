import type { BaseQuery, SyncApiTypes, SyncClient, SyncClientConfig } from '../models/core.models.js';
import type { ContentItemDeltaObject, ContentTypeDeltaObject, LanguageDeltaObject, TaxonomyDeltaObject } from '../models/synchronization.models.js';
import { getEndpointUrl, requestAsync } from '../utils/query.utils.js';

export type SyncQueryResponseData<TSyncApiTypes extends SyncApiTypes> = {
	readonly items: readonly ContentItemDeltaObject<TSyncApiTypes>[];
	readonly types: readonly ContentTypeDeltaObject<TSyncApiTypes>[];
	readonly languages: readonly LanguageDeltaObject<TSyncApiTypes>[];
	readonly taxonomies: readonly TaxonomyDeltaObject<TSyncApiTypes>[];
};

export type SyncQuery<TSyncApiTypes extends SyncApiTypes> = BaseQuery<SyncQueryResponseData<TSyncApiTypes>>;

export function getSyncQuery<TSyncApiTypes extends SyncApiTypes>(config: SyncClientConfig): ReturnType<SyncClient<TSyncApiTypes>['sync']> {
	return {
		toPromise: async () => {
			return await requestAsync<SyncQueryResponseData<TSyncApiTypes>, null>({
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
