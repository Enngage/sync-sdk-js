import type { BaseQuery, EmptyObject, SyncClient, SyncClientConfig, SyncClientTypes, SyncHeaderNames } from '../models/core.models.js';
import type { ContentItemDeltaObject, ContentTypeDeltaObject, LanguageDeltaObject, TaxonomyDeltaObject } from '../models/synchronization.models.js';
import { getSyncEndpointUrl, requestAsync } from '../utils/query.utils.js';

export type SyncQueryPayload<TSyncApiTypes extends SyncClientTypes> = {
	/**
	 * The list of content items that have been changed or deleted.
	 */
	readonly items: readonly ContentItemDeltaObject<TSyncApiTypes>[];

	/**
	 * The list of content types that have been changed or deleted.
	 */
	readonly types: readonly ContentTypeDeltaObject<TSyncApiTypes>[];

	/**
	 * The list of languages that have been changed or deleted.
	 */
	readonly languages: readonly LanguageDeltaObject<TSyncApiTypes>[];

	/**
	 * The list of taxonomies that have been changed or deleted.
	 */
	readonly taxonomies: readonly TaxonomyDeltaObject<TSyncApiTypes>[];
};

export type SyncQuery<TSyncApiTypes extends SyncClientTypes> = BaseQuery<SyncQueryPayload<TSyncApiTypes>>;

export function getSyncQuery<TSyncApiTypes extends SyncClientTypes>(
	config: SyncClientConfig,
	continuationToken: string,
): ReturnType<SyncClient<TSyncApiTypes>['sync']> {
	const url = getSyncEndpointUrl({ path: '/sync', ...config });

	return {
		toUrl: () => url,
		toPromise: async () => {
			return await requestAsync<SyncQueryPayload<TSyncApiTypes>, null, EmptyObject>({
				config,
				extraMetadata: () => ({}),
				func: async (httpService) => {
					return await httpService.requestAsync({
						url: url,
						body: null,
						method: 'GET',
						requestHeaders: [
							{
								name: 'X-Continuation' satisfies SyncHeaderNames,
								value: continuationToken,
							},
						],
					});
				},
			});
		},
	};
}
