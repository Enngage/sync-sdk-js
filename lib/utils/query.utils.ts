import { type Header, type HttpResponse, type HttpService, type JsonValue, getDefaultHttpService } from '@kontent-ai/core-sdk';
import type { ZodType } from 'zod/v4';
import { type ApiMode, type SyncClientConfig, type SyncHeaderNames, type SyncResponse, SyncSdkError } from '../models/core.models.js';
import type { EmptyObject } from '../models/utility-models.js';

export async function requestAsync<TResponseData extends JsonValue | Blob, TBodyData extends JsonValue | Blob, TExtraMetadata = EmptyObject>({
	config,
	func,
	extraMetadata,
	zodSchema,
}: {
	readonly extraMetadata: (response: HttpResponse<TResponseData, TBodyData>) => TExtraMetadata;
	readonly func: (httpService: HttpService) => Promise<HttpResponse<TResponseData, TBodyData>>;
	readonly config: SyncClientConfig;
	readonly zodSchema: ZodType<TResponseData>;
}): Promise<SyncResponse<TResponseData, TExtraMetadata>> {
	const response = await func(getHttpService(config));

	if (config.responseValidation?.enable) {
		await validateResponseAsync(response.data, zodSchema);
	}

	return {
		payload: response.data,
		meta: {
			responseHeaders: response.adapterResponse.responseHeaders,
			status: response.adapterResponse.status,
			continuationToken: extractContinuationToken(response.adapterResponse.responseHeaders),
			...extraMetadata(response),
		},
	};
}

async function validateResponseAsync<TResponseData extends JsonValue | Blob>(data: TResponseData, zodSchema: ZodType<TResponseData>): Promise<void> {
	const validateResult = await zodSchema.safeParseAsync(data);

	if (!validateResult.success) {
		throw new SyncSdkError('Response data does not match the expected schema', validateResult.error);
	}
}

export function getSyncEndpointUrl({
	environmentId,
	path,
	baseUrl,
	apiMode,
}: { readonly path: string } & Pick<SyncClientConfig, 'baseUrl' | 'environmentId' | 'apiMode'>): string {
	return getEndpointUrl({ environmentId, path, baseUrl: baseUrl ?? getDefaultBaseUrlForApiMode(apiMode) });
}

export function getEndpointUrl({ environmentId, path, baseUrl }: { readonly environmentId: string; readonly path: string; readonly baseUrl: string }): string {
	return removeDuplicateSlashes(`${baseUrl}/${environmentId}/${path}`);
}

export function removeDuplicateSlashes(path: string): string {
	return path.replace(/\/+/g, '/');
}

export function extractContinuationToken(responseHeaders: readonly Header[]): string | undefined {
	return responseHeaders.find((header) => header.name.toLowerCase() === ('X-Continuation' satisfies SyncHeaderNames).toLowerCase())?.value;
}

function getHttpService(config: SyncClientConfig) {
	return config.httpService ?? getDefaultHttpService({ retryStrategy: config.retryStrategy });
}

function getDefaultBaseUrlForApiMode(apiMode: ApiMode): string {
	if (apiMode === 'preview') {
		return 'https://preview-deliver.kontent.ai';
	}

	return 'https://deliver.kontent.ai';
}
