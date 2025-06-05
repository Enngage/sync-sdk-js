import { type Header, type HttpResponse, type HttpService, type JsonValue, getDefaultHttpService } from '@kontent-ai/core-sdk';
import type { ApiMode, SyncClientConfig, SyncHeaderNames, SyncResponse } from '../models/core.models.js';
import type { EmptyObject } from '../models/utility-models.js';

export async function requestAsync<TResponseData extends JsonValue | Blob, TBodyData extends JsonValue | Blob, TExtraMetadata = EmptyObject>({
	config,
	func,
	extraMetadata,
}: {
	readonly extraMetadata: (response: HttpResponse<TResponseData, TBodyData>) => TExtraMetadata;
	readonly func: (httpService: HttpService) => Promise<HttpResponse<TResponseData, TBodyData>>;
	readonly config: SyncClientConfig;
}): Promise<SyncResponse<TResponseData, TExtraMetadata>> {
	const response = await func(getHttpService(config));

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
