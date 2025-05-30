import type { AdapterResponse, HttpService, RetryStrategyOptions } from '@kontent-ai/core-sdk';
import type { InitQuery } from '../queries/init-query.js';
import type { SyncQuery } from '../queries/sync-query.js';

export type SyncApiTypes = {
	readonly languageCodenames: string;
	readonly typeCodenames: string;
	readonly workflowCodenames: string;
	readonly workflowStepCodenames: string;
	readonly collectionCodenames: string;
	readonly taxonomyCodenames: string;
};

export type SyncResponseMeta = Pick<AdapterResponse, 'status' | 'responseHeaders'> & { readonly continuationToken?: string };

export type SyncResponse<TPayload> = {
	readonly payload: TPayload;
	readonly meta: SyncResponseMeta;
};

export type BaseQuery<TPayload> = {
	toPromise(): Promise<SyncResponse<TPayload>>;
};

export type SyncClientConfig = {
	readonly environmentId: string;
	readonly httpService?: HttpService;
	readonly retryStrategy?: RetryStrategyOptions;
};

export type SyncClient<TSyncApiTypes extends SyncApiTypes = SyncApiTypes> = {
	readonly config: SyncClientConfig;

	init(): InitQuery;
	sync(): SyncQuery<TSyncApiTypes>;
};
