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

type InitQueryMetadata = { readonly continuationToken: string };

export type InitQuery = BaseQuery<InitQueryPayload, InitQueryMetadata>;

export function getInitQuery<TSyncApiTypes extends SyncClientTypes>(config: SyncClientConfig): ReturnType<SyncClient<TSyncApiTypes>['init']> {
	const url = getSyncEndpointUrl({ path: '/sync/init', ...config });

	return {
		toUrl: () => url,
		toPromise: async () => {
			return await requestAsync<InitQueryPayload, null, InitQueryMetadata>({
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
						url: url,
						body: null,
						method: 'POST',
					});
				},
			});
		},
	};
}
