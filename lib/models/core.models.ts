import type { AdapterResponse, CoreSdkError, HttpResponse, HttpService, JsonValue, Prettify } from "@kontent-ai/core-sdk";
import type { ZodError } from "zod/v4";
import type { InitQuery } from "../queries/init-query.js";
import type { SyncQuery } from "../queries/sync-query.js";
import type { PagingQueryResult, QueryResult } from "./utility-models.js";

export type SyncClientTypes = {
	readonly languageCodenames: string;
	readonly typeCodenames: string;
	readonly workflowCodenames: string;
	readonly workflowStepCodenames: string;
	readonly collectionCodenames: string;
	readonly taxonomyCodenames: string;
};

export type SyncResponseMeta<TExtraMetadata = unknown> = Pick<AdapterResponse, "status" | "responseHeaders"> & {
	readonly continuationToken?: string;
} & TExtraMetadata;

export type SyncResponse<TPayload, TExtraMetadata = unknown> = {
	readonly payload: TPayload;
	readonly meta: SyncResponseMeta<TExtraMetadata>;
};

export type Query<TPayload, TExtraData = unknown> = {
	toUrl(): string;
	toPromise(): Promise<QueryResult<SyncResponse<TPayload, TExtraData>>>;
};

export type PagingQuery<TPayload, TExtraData = unknown> = Query<TPayload, TExtraData> & {
	toAllPromise(): Promise<PagingQueryResult<SyncResponse<TPayload, TExtraData>>>;
};

export type ApiMode = "public" | "preview" | "secure";

export type SyncClientConfig = {
	/**
	 * The environment ID of your Kontent.ai project. Can be found under 'Project settings' in the Kontent.ai app.
	 */
	readonly environmentId: string;

	/**
	 * Delivery API key.
	 *
	 * Required for secure and preview modes.
	 */
	readonly deliveryApiKey?: string;

	/**
	 * Mode for the API.
	 *
	 * Secure mode requires a delivery API key with secure access.
	 * Preview mode requires a delivery API key with preview access.
	 * Delivery mode is used for public access.
	 */
	readonly apiMode: ApiMode;

	/**
	 * The HTTP service to use for the request. If not provided, the default HTTP service will be used.
	 *
	 * You may provide your own HTTP service implementation to customize the request behavior.
	 *
	 * See https://github.com/kontent-ai/core-sdk-js for more information regarding the HTTP service customization.
	 */
	readonly httpService?: HttpService;

	/**
	 * The base URL to use for the request. If not provided, the default base URL will be used.
	 *
	 * If provided, it will override the default base URL based on selected API mode.
	 */
	readonly baseUrl?: string;

	/**
	 * Configuration for response validation.
	 */
	readonly responseValidation?: {
		/**
		 * When enabled, the response payload will be validated against the expected Zod schema from which the types
		 * this library are based on. This ensures that you are working with the correct data types.
		 *
		 * @default false
		 */
		readonly enable: boolean;
	};
};

/**
 * Sync client instance.
 *
 * @param TSyncApiTypes - The types representing your Kontent.ai environment.
 * Can be used to narrow down the types of the response payload.
 * For example, the codenames of langauges, content types etc. can be narrowed.
 */
export type SyncClient<TSyncApiTypes extends SyncClientTypes = SyncClientTypes> = {
	readonly config: SyncClientConfig;

	/**
	 * Initializes synchronization of changes in all of the supported entities.
	 * After the initialization, you’ll get the X-Continuation token which you
	 * should store for later use in the 'sync' function.
	 */
	init(): InitQuery;

	/**
	 * Retrieve a list of delta updates to changed entities since the last synchronization.
	 *
	 * @param continuationToken - The continuation token received either from the 'init' function or from the previous 'sync' call.
	 */
	sync(continuationToken: string): SyncQuery<TSyncApiTypes>;
};

export type SyncHeaderNames = "X-Continuation";

export type CreateSyncClientOptions = Omit<SyncClientConfig, "environmentId" | "apiMode" | "deliveryApiKey">;

export type SyncSdkErrorReason = Pick<SyncSdkError, "reason">["reason"];

export type SyncSdkError =
	| CoreSdkError
	| (Pick<CoreSdkError, "message"> &
			(
				| {
						readonly reason: "validationFailed";
						readonly zodError: ZodError;
						readonly response: SuccessfulHttpResponse<JsonValue, JsonValue>;
						readonly url: string;
				  }
				| {
						readonly reason: "noResponses";
						readonly url: string;
				  }
			));

export type SuccessfulHttpResponse<TPayload extends JsonValue, TBodyData extends JsonValue> = Prettify<
	Extract<HttpResponse<TPayload, TBodyData>, { readonly success: true }>["response"]
>;

export type ResultOfSuccessfulQuery<TQuery extends Query<unknown, unknown>> = Extract<
	Awaited<ReturnType<TQuery["toPromise"]>>,
	{ readonly success: true }
>["response"];
