import { type EmptyObject, type Header, type HttpResponse, type HttpService, type JsonValue, getDefaultHttpService } from "@kontent-ai/core-sdk";
import type { ZodError, ZodType } from "zod/v4";
import type { ApiMode, SyncClientConfig, SyncHeaderNames, SyncResponse } from "../models/core.models.js";
import type { Result } from "../models/utility-models.js";

type ResponseInnerData<TResponseData extends JsonValue | Blob, TBodyData extends JsonValue | Blob> = Extract<
	HttpResponse<TResponseData, TBodyData>,
	{ success: true }
>["data"];

export async function requestAsync<TResponseData extends JsonValue | Blob, TBodyData extends JsonValue | Blob, TExtraMetadata = EmptyObject>({
	config,
	func,
	extraMetadata,
	zodSchema,
}: {
	readonly extraMetadata: (response: ResponseInnerData<TResponseData, TBodyData>) => TExtraMetadata;
	readonly func: (httpService: HttpService) => Promise<HttpResponse<TResponseData, TBodyData>>;
	readonly config: SyncClientConfig;
	readonly zodSchema: ZodType<TResponseData>;
}): Promise<Result<SyncResponse<TResponseData, TExtraMetadata>>> {
	const { success, data, error } = await func(getHttpService(config));

	if (!success) {
		return {
			success: false,
			error: {
				errorType: "core",
				...error,
			},
		};
	}

	if (config.responseValidation?.enable) {
		const { isValid, error: validationError } = await validateResponseAsync(data.responseData, zodSchema);
		if (!isValid) {
			return {
				success: false,
				error: {
					errorType: "validation",
					...validationError,
				},
			};
		}
	}

	return {
		success: true,
		data: {
			payload: data.responseData,
			meta: {
				responseHeaders: data.adapterResponse.responseHeaders,
				status: data.adapterResponse.status,
				continuationToken: extractContinuationToken(data.adapterResponse.responseHeaders),
				...extraMetadata(data),
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
