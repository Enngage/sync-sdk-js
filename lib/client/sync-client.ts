import type { CreateSyncClientOptions, SyncClient, SyncClientConfig, SyncClientTypes } from "../models/core.models.js";
import { getInitQuery } from "../queries/init-query.js";
import { getSyncQuery } from "../queries/sync-query.js";

type GetSyncClient<TSyncApiTypes extends SyncClientTypes = SyncClientTypes> = {
	/**
	 * Use publicly available API for requests.
	 */
	publicApi: () => {
		create: (options?: CreateSyncClientOptions) => SyncClient<TSyncApiTypes>;
	};
	/**
	 * Use preview API for requests.
	 *
	 * Requires a delivery API key with preview access.
	 */
	previewApi: (deliveryApiKey: string) => {
		create: (options?: CreateSyncClientOptions) => SyncClient<TSyncApiTypes>;
	};

	/**
	 * Use secure API for requests.
	 *
	 * Requires a delivery API key with secure access.
	 */
	secureApi: (deliveryApiKey: string) => {
		create: (options?: CreateSyncClientOptions) => SyncClient<TSyncApiTypes>;
	};
};

export function getSyncClient<TSyncApiTypes extends SyncClientTypes = SyncClientTypes>(environmentId: string): GetSyncClient<TSyncApiTypes> {
	return {
		publicApi: () => {
			return withClient<TSyncApiTypes>({ apiMode: "public", environmentId });
		},
		previewApi: (deliveryApiKey: string) => {
			return withClient<TSyncApiTypes>({ apiMode: "preview", environmentId, deliveryApiKey });
		},
		secureApi: (deliveryApiKey: string) => {
			return withClient<TSyncApiTypes>({ apiMode: "secure", environmentId, deliveryApiKey });
		},
	};
}

function withClient<TSyncApiTypes extends SyncClientTypes>(requiredConfig: Pick<SyncClientConfig, "environmentId" | "apiMode" | "deliveryApiKey">) {
	return {
		create: (options?: CreateSyncClientOptions): SyncClient<TSyncApiTypes> => createSyncClient<TSyncApiTypes>({ ...requiredConfig, ...options }),
	};
}

function createSyncClient<TSyncApiTypes extends SyncClientTypes>(config: SyncClientConfig): SyncClient<TSyncApiTypes> {
	return {
		config,
		init: () => getInitQuery<TSyncApiTypes>(config),
		sync: (continuationToken: string) => getSyncQuery<TSyncApiTypes>(config, continuationToken),
	};
}
