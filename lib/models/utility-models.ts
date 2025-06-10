import type { SyncSdkError } from "./core.models.js";

/**
 * A nomadic result type that represents a success or failure of an operation.
 *
 * Ensures that consumers of this library handle both success and failure cases.
 */
export type QueryResult<TData> = Success<TData> | Failure<SyncSdkError>;

type Success<TData> = {
	readonly success: true;
	readonly response: TData;
	readonly error?: never;
};
type Failure<TError> = {
	readonly success: false;
	readonly response?: never;
	readonly error: TError;
};
