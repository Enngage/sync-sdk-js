import { type Header, type HttpResponse, type HttpService, type JsonValue, getDefaultHttpService } from '@kontent-ai/core-sdk';
import type { SyncClientConfig, SyncResponse } from '../models/core.models.js';

export async function requestAsync<TResponseData extends JsonValue | Blob, TBodyData extends JsonValue | Blob>({
	config,
	func,
}: { readonly func: (httpService: HttpService) => Promise<HttpResponse<TResponseData, TBodyData>>; readonly config: SyncClientConfig }): Promise<
	SyncResponse<TResponseData>
> {
	const response = await func(getHttpService(config));

	return {
		payload: response.data,
		meta: {
			responseHeaders: response.adapterResponse.responseHeaders,
			status: response.adapterResponse.status,
			continuationToken: extractContinuationToken(response.adapterResponse.responseHeaders),
		},
	};
}

export function getEndpointUrl({ environmentId, path }: { readonly environmentId: string; readonly path: string }): string {
	return `https://deliver.devkontentmasters.com/v2/${removeDuplicateSlashes(`${environmentId}/${path}`)}`;
	// return `https://deliver.kontent.ai/v2/${removeDuplicateSlashes(`${environmentId}/${path}`)}`;
}

function removeDuplicateSlashes(path: string): string {
	return path.replace(/\/+/g, '/');
}

function getHttpService(config: SyncClientConfig) {
	return config.httpService ?? getDefaultHttpService({ retryStrategy: config.retryStrategy });
}

function extractContinuationToken(responseHeaders: readonly Header[]): string | undefined {
	return responseHeaders.find((header) => header.name.toLowerCase() === 'x-continuation'.toLowerCase())?.value;
}
