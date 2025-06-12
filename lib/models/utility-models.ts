import type { SyncSdkError } from "./core.models.js";

/**
 * A nomadic result type that represents a success or failure of an operation.
 *
 * Ensures that consumers of this library handle both success and failure cases.
 */
export type QueryResult<TResponse> = (Success & { readonly response: TResponse }) | (Failure & { readonly response?: never });
export type PagingQueryResult<TResponse> = (Success & { readonly responses: TResponse[] }) | (Failure & { readonly responses?: never });

type Success = {
	readonly success: true;
	readonly error?: never;
};
type Failure = {
	readonly success: false;
	readonly error: SyncSdkError;
};
