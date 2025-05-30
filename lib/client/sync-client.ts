import type { SyncApiTypes, SyncClient, SyncClientConfig } from '../models/core.models.js';
import { getInitQuery } from '../queries/init-query.js';
import { getSyncQuery } from '../queries/sync-query.js';

export function getSyncClient<TSyncApiTypes extends SyncApiTypes>(config: SyncClientConfig): SyncClient<TSyncApiTypes> {
	return {
		config,
		init: () => getInitQuery<TSyncApiTypes>(config),
		sync: () => getSyncQuery<TSyncApiTypes>(config),
	};
}
