import type { BaseQuery, SyncClient, SyncClientConfig, SyncClientTypes } from '../models/core.models.js';
import { getEndpointUrl, requestAsync } from '../utils/query.utils.js';

export type InitQueryPayload = {
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

export type InitQuery = BaseQuery<InitQueryPayload>;

export function getInitQuery<TSyncApiTypes extends SyncClientTypes>(config: SyncClientConfig): ReturnType<SyncClient<TSyncApiTypes>['init']> {
	return {
		toPromise: async () => {
			return await requestAsync<InitQueryPayload, null>({
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
