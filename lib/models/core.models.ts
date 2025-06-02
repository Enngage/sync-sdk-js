import type { AdapterResponse, HttpService, RetryStrategyOptions } from '@kontent-ai/core-sdk';
import type { InitQuery } from '../queries/init-query.js';
import type { SyncQuery } from '../queries/sync-query.js';

export type SyncClientTypes = {
	readonly languageCodenames: string;
	readonly typeCodenames: string;
	readonly workflowCodenames: string;
	readonly workflowStepCodenames: string;
	readonly collectionCodenames: string;
	readonly taxonomyCodenames: string;
};

export type SyncResponseMeta<TExtraMetadata = unknown> = Pick<AdapterResponse, 'status' | 'responseHeaders'> & {
	readonly continuationToken?: string;
} & TExtraMetadata;

export type SyncResponse<TPayload, TExtraMetadata = unknown> = {
	readonly payload: TPayload;
	readonly meta: SyncResponseMeta<TExtraMetadata>;
};

export type BaseQuery<TPayload, TExtraData = unknown> = {
	toPromise(): Promise<SyncResponse<TPayload, TExtraData>>;
};

export type SyncClientConfig = {
	/**
	 * The environment ID of your Kontent.ai project. Can be found under 'Project settings' in the Kontent.ai app.
	 */
	readonly environmentId: string;

	/**
	 * The HTTP service to use for the request. If not provided, the default HTTP service will be used.
	 *
	 * You may provide your own HTTP service implementation to customize the request behavior.
	 *
	 * See https://github.com/kontent-ai/core-sdk-js for more information regarding the HTTP service customization.
	 */
	readonly httpService?: HttpService;

	/**
	 * The retry strategy to use for the request. If not provided, the default retry strategy will be used.
	 */
	readonly retryStrategy?: RetryStrategyOptions;
};

export type SyncClient<TSyncApiTypes extends SyncClientTypes = SyncClientTypes> = {
	readonly config: SyncClientConfig;

	init(): InitQuery;
	sync(continuationToken: string): SyncQuery<TSyncApiTypes>;
};

export type SyncHeaderNames = 'X-Continuation';

export type EmptyObject = Record<string, never>;
