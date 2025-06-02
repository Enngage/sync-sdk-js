import type { BaseQuery, SyncClient, SyncClientConfig, SyncClientTypes, SyncHeaderNames } from '../models/core.models.js';
import { extractContinuationToken, getSyncEndpointUrl, requestAsync } from '../utils/query.utils.js';

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

type InitQueryExtraData = { readonly continuationToken: string };

export type InitQuery = BaseQuery<InitQueryPayload, InitQueryExtraData>;

export function getInitQuery<TSyncApiTypes extends SyncClientTypes>(config: SyncClientConfig): ReturnType<SyncClient<TSyncApiTypes>['init']> {
	return {
		toPromise: async () => {
			return await requestAsync<InitQueryPayload, null, InitQueryExtraData>({
				config,
				extraMetadata: (response) => {
					const continuationToken = extractContinuationToken(response.adapterResponse.responseHeaders);

					if (!continuationToken) {
						throw new Error(`Invalid response: missing '${'X-Continuation' satisfies SyncHeaderNames}' header`);
					}

					return {
						continuationToken,
					};
				},
				func: async (httpService) => {
					return await httpService.requestAsync({
						url: getSyncEndpointUrl({ environmentId: config.environmentId, path: '/sync/init' }),
						body: null,
						method: 'POST',
					});
				},
			});
		},
	};
}
