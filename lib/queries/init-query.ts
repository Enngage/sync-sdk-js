import { z } from "zod/v4";
import type { Query, SyncClient, SyncClientConfig, SyncClientTypes, SyncHeaderNames } from "../models/core.models.js";
import { extractContinuationToken, getQuery } from "../utils/query.utils.js";
import { getSyncEndpointUrl } from "../utils/url.utils.js";

type InitQueryMetadata = { readonly continuationToken: string };

export const initQueryPayloadSchema = z.readonly(
	z.object({
		items: z.array(z.never()),
		types: z.array(z.never()),
		languages: z.array(z.never()),
		taxonomies: z.array(z.never()),
	}),
);

export type InitQueryPayload = z.infer<typeof initQueryPayloadSchema>;

export type InitQuery = Query<InitQueryPayload, InitQueryMetadata>;

export function getInitQuery<TSyncApiTypes extends SyncClientTypes>(
	config: SyncClientConfig,
): ReturnType<SyncClient<TSyncApiTypes>["init"]> {
	const url = getSyncEndpointUrl({ path: "/sync/init", ...config });

	const { toPromise } = getQuery<InitQueryPayload, null, InitQueryMetadata>({
		config,
		url,
		zodSchema: initQueryPayloadSchema,
		continuationToken: undefined,
		extraMetadata: (response) => {
			const continuationToken = extractContinuationToken(response.adapterResponse.responseHeaders);

			if (!continuationToken) {
				throw new Error(`Invalid response: missing '${"X-Continuation" satisfies SyncHeaderNames}' header`);
			}

			return {
				continuationToken,
			};
		},
		request: {
			url,
			body: null,
			method: "POST",
		},
	});

	return {
		toUrl: () => url,
		toPromise,
	};
}
