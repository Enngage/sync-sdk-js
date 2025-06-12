import type { Override, Prettify } from "@kontent-ai/core-sdk";
import z from "zod/v4";
import type { PagingQuery, SyncClient, SyncClientConfig, SyncClientTypes, SyncHeaderNames } from "../models/core.models.js";
import type {
	ContentItemDeltaObject,
	ContentTypeDeltaObject,
	LanguageDeltaObject,
	TaxonomyDeltaObject,
} from "../schemas/synchronization.models.js";
import {
	contentItemDeltaObjectSchema,
	contentTypeDeltaObjectSchema,
	languageDeltaObjectSchema,
	taxonomyDeltaObjectSchema,
} from "../schemas/synchronization.schemas.js";
import { extractContinuationToken, getPagingQuery } from "../utils/query.utils.js";
import { getSyncEndpointUrl } from "../utils/url.utils.js";

type SyncQueryMetadata = { readonly continuationToken: string };

export const syncQueryPayloadSchema = z.readonly(
	z.object({
		items: z.array(contentItemDeltaObjectSchema),
		types: z.array(contentTypeDeltaObjectSchema),
		languages: z.array(languageDeltaObjectSchema),
		taxonomies: z.array(taxonomyDeltaObjectSchema),
	}),
);

export type SyncQueryPayload<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof syncQueryPayloadSchema>,
		{
			readonly taxonomies: readonly TaxonomyDeltaObject<TSyncApiTypes>[];
			readonly items: readonly ContentItemDeltaObject<TSyncApiTypes>[];
			readonly types: readonly ContentTypeDeltaObject<TSyncApiTypes>[];
			readonly languages: readonly LanguageDeltaObject<TSyncApiTypes>[];
		}
	>
>;

export type SyncQuery<TSyncApiTypes extends SyncClientTypes> = PagingQuery<SyncQueryPayload<TSyncApiTypes>, SyncQueryMetadata>;

export function getSyncQuery<TSyncApiTypes extends SyncClientTypes>(
	config: SyncClientConfig,
	continuationToken: string,
): ReturnType<SyncClient<TSyncApiTypes>["sync"]> {
	const url = getSyncEndpointUrl({ path: "/sync", ...config });

	const { toPromise, toAllPromise } = getPagingQuery<SyncQueryPayload<TSyncApiTypes>, null, SyncQueryMetadata>({
		config,
		url,
		continuationToken,
		extraMetadata: (response) => {
			const continuationToken = extractContinuationToken(response.adapterResponse.responseHeaders);

			if (!continuationToken) {
				throw new Error(`Invalid response: missing '${"X-Continuation" satisfies SyncHeaderNames}' header`);
			}

			return {
				continuationToken,
			};
		},
		canFetchNextResponse: (response) => {
			const isEmptyResponse =
				response.payload.items.length === 0 &&
				response.payload.types.length === 0 &&
				response.payload.languages.length === 0 &&
				response.payload.taxonomies.length === 0;

			// If response is empty, we should not fetch the next response as it indicates that there are no more changes
			if (!response.meta.continuationToken || isEmptyResponse) {
				return false;
			}

			return true;
		},
		zodSchema: syncQueryPayloadSchema,
		request: {
			url,
			body: null,
			method: "GET",
			requestHeaders: [],
		},
	});

	return {
		toUrl: () => url,
		toPromise,
		toAllPromise,
	};
}
