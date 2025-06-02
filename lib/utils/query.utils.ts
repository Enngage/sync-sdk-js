import { type Header, type HttpResponse, type HttpService, type JsonValue, getDefaultHttpService } from '@kontent-ai/core-sdk';
import type { EmptyObject, SyncClientConfig, SyncHeaderNames, SyncResponse } from '../models/core.models.js';

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

export function getSyncEndpointUrl({ environmentId, path }: { readonly environmentId: string; readonly path: string }): string {
	return getEndpointUrl({ environmentId, path, baseUrl: 'https://deliver.devkontentmasters.com/v2/' });
}

export function getEndpointUrl({ environmentId, path, baseUrl }: { readonly environmentId: string; readonly path: string; readonly baseUrl: string }): string {
	return removeDuplicateSlashes(`${baseUrl}/${environmentId}/${path}`);
	// return `https://deliver.kontent.ai/v2/${removeDuplicateSlashes(`${environmentId}/${path}`)}`;
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
