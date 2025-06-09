import type { EmptyObject, Override, Prettify } from "@kontent-ai/core-sdk";
import z from "zod/v4";
import type { BaseQuery, SyncClient, SyncClientConfig, SyncClientTypes, SyncHeaderNames } from "../models/core.models.js";
import type { ContentItemDeltaObject, ContentTypeDeltaObject, LanguageDeltaObject, TaxonomyDeltaObject } from "../schemas/synchronization.models.js";
import {
	contentItemDeltaObjectSchema,
	contentTypeDeltaObjectSchema,
	languageDeltaObjectSchema,
	taxonomyDeltaObjectSchema,
} from "../schemas/synchronization.schemas.js";
import { getSyncEndpointUrl, requestAsync } from "../utils/query.utils.js";

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

export type SyncQuery<TSyncApiTypes extends SyncClientTypes> = BaseQuery<SyncQueryPayload<TSyncApiTypes>>;

export function getSyncQuery<TSyncApiTypes extends SyncClientTypes>(
	config: SyncClientConfig,
	continuationToken: string,
): ReturnType<SyncClient<TSyncApiTypes>["sync"]> {
	const url = getSyncEndpointUrl({ path: "/sync", ...config });

	return {
		toUrl: () => url,
		toPromise: async () => {
			return await requestAsync<SyncQueryPayload<TSyncApiTypes>, null, EmptyObject>({
				config,
				extraMetadata: () => ({}),
				zodSchema: syncQueryPayloadSchema,
				func: async (httpService) => {
					return await httpService.requestAsync({
						url: url,
						body: null,
						method: "GET",
						requestHeaders: [
							{
								name: "X-Continuation" satisfies SyncHeaderNames,
								value: continuationToken,
							},
						],
					});
				},
			});
		},
	};
}
