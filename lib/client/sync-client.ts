import type { SyncClient, SyncClientConfig, SyncClientTypes } from '../models/core.models.js';
import { getInitQuery } from '../queries/init-query.js';
import { getSyncQuery } from '../queries/sync-query.js';

export function getSyncClient<TSyncApiTypes extends SyncClientTypes>(config: SyncClientConfig): SyncClient<TSyncApiTypes> {
	return {
		config,
		init: () => getInitQuery<TSyncApiTypes>(config),
		sync: (continuationToken: string) => getSyncQuery<TSyncApiTypes>(config, continuationToken),
	};
}
