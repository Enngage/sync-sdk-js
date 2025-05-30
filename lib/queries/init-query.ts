import type { BaseQuery, SyncApiTypes, SyncClient, SyncClientConfig } from '../models/core.models.js';
import { getEndpointUrl, requestAsync } from '../utils/query.utils.js';

export type InitQueryResponseData = {
	/**
	 * Always empty array in init query
	 */
	readonly items: readonly [];
	/**
	 * Always empty array in init query
	 */
	readonly types: readonly [];
	/**
	 * Always empty array in init query
	 */
	readonly languages: readonly [];
	/**
	 * Always empty array in init query
	 */
	readonly taxonomies: readonly [];
};

export type InitQuery = BaseQuery<InitQueryResponseData>;

export function getInitQuery<TSyncApiTypes extends SyncApiTypes>(config: SyncClientConfig): ReturnType<SyncClient<TSyncApiTypes>['init']> {
	return {
		toPromise: async () => {
			return await requestAsync<InitQueryResponseData, null>({
				config,
				func: async (httpService) => {
					return await httpService.requestAsync({
						url: getEndpointUrl({ environmentId: config.environmentId, path: '/sync/init' }),
						body: null,
						method: 'POST',
					});
				},
			});
		},
	};
}
