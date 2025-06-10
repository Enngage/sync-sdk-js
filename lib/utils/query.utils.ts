import { type EmptyObject, type Header, type HttpResponse, type HttpService, type JsonValue, getDefaultHttpService } from "@kontent-ai/core-sdk";
import type { ZodError, ZodType } from "zod/v4";
import type { ApiMode, SyncClientConfig, SyncHeaderNames, SyncResponse, ValidResponseData } from "../models/core.models.js";
import type { QueryResult } from "../models/utility-models.js";

export async function requestAsync<TResponseData extends JsonValue | Blob, TBodyData extends JsonValue | Blob, TExtraMetadata = EmptyObject>({
	config,
	func,
	url,
	extraMetadata,
	zodSchema,
}: {
	readonly extraMetadata: (response: ValidResponseData<TResponseData, TBodyData>) => TExtraMetadata;
	readonly func: (httpService: HttpService) => Promise<HttpResponse<TResponseData, TBodyData>>;
	readonly config: SyncClientConfig;
	readonly url: string;
	readonly zodSchema: ZodType<TResponseData>;
}): Promise<QueryResult<SyncResponse<TResponseData, TExtraMetadata>>> {
	const { success, response, error } = await func(getHttpService(config));

	if (!success) {
		return {
			success: false,
			error,
		};
	}

	if (config.responseValidation?.enable) {
		const { isValid, error: validationError } = await validateResponseAsync(response.data, zodSchema);
		if (!isValid) {
			return {
				success: false,
				error: {
					message: `Failed to validate response schema for url '${url}'`,
					reason: "validationFailed",
					zodError: validationError,
					response,
					url,
				},
			};
		}
	}

	return {
		success: true,
		response: {
			payload: response.data,
			meta: {
				responseHeaders: response.adapterResponse.responseHeaders,
				status: response.adapterResponse.status,
				continuationToken: extractContinuationToken(response.adapterResponse.responseHeaders),
				...extraMetadata(response),
			},
		},
	};
}

async function validateResponseAsync<TResponseData extends JsonValue | Blob>(
	data: TResponseData,
	zodSchema: ZodType<TResponseData>,
): Promise<
	| {
			readonly isValid: true;
			readonly error?: never;
	  }
	| {
			readonly isValid: false;
			readonly error: ZodError;
	  }
> {
	const validateResult = await zodSchema.safeParseAsync(data);

	if (validateResult.success) {
		return {
			isValid: true,
		};
	}

	return {
		isValid: false,
		error: validateResult.error,
	};
}

export function getSyncEndpointUrl({
	environmentId,
	path,
	baseUrl,
	apiMode,
}: { readonly path: string } & Pick<SyncClientConfig, "baseUrl" | "environmentId" | "apiMode">): string {
	return getEndpointUrl({
		environmentId,
		path,
		baseUrl: baseUrl ?? getDefaultBaseUrlForApiMode(apiMode),
	});
}

export function getEndpointUrl({ environmentId, path, baseUrl }: { readonly environmentId: string; readonly path: string; readonly baseUrl: string }): string {
	return removeDuplicateSlashes(`${baseUrl}/${environmentId}/${path}`);
}

export function removeDuplicateSlashes(path: string): string {
	return path.replace(/\/+/g, "/");
}

export function extractContinuationToken(responseHeaders: readonly Header[]): string | undefined {
	return responseHeaders.find((header) => header.name.toLowerCase() === ("X-Continuation" satisfies SyncHeaderNames).toLowerCase())?.value;
}

function getHttpService(config: SyncClientConfig) {
	return config.httpService ?? getDefaultHttpService();
}

function getDefaultBaseUrlForApiMode(apiMode: ApiMode): string {
	if (apiMode === "preview") {
		return "https://preview-deliver.kontent.ai";
	}

	return "https://deliver.kontent.ai";
}
