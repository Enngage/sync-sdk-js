import type { AdapterResponse, CoreSdkError, HttpResponse, HttpService, JsonValue } from "@kontent-ai/core-sdk";
import type { ZodError } from "zod/v4";
import type { InitQuery } from "../queries/init-query.js";
import type { SyncQuery } from "../queries/sync-query.js";
import type { QueryResult } from "./utility-models.js";

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

export type BaseQuery<TPayload, TExtraData = unknown> = {
	toUrl(): string;
	toPromise(): Promise<QueryResult<SyncResponse<TPayload, TExtraData>>>;
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

export type SyncClient<TSyncApiTypes extends SyncClientTypes = SyncClientTypes> = {
	readonly config: SyncClientConfig;

	init(): InitQuery;
	sync(continuationToken: string): SyncQuery<TSyncApiTypes>;
};

export type SyncHeaderNames = "X-Continuation";

export type CreateSyncClientOptions = Omit<SyncClientConfig, "environmentId" | "apiMode" | "deliveryApiKey">;

export type SyncSdkErrorReason = Pick<SyncSdkError, "reason">["reason"];

export type SyncSdkError =
	| CoreSdkError
	| (Pick<CoreSdkError, "message"> & {
			readonly reason: "validationFailed";
			readonly zodError: ZodError;
			readonly response: ValidResponseData<JsonValue | Blob, JsonValue | Blob>;
			readonly url: string;
	  });

export type ValidResponseData<TResponseData extends JsonValue | Blob, TBodyData extends JsonValue | Blob> = Extract<
	HttpResponse<TResponseData, TBodyData>,
	{ readonly success: true }
>["response"];
