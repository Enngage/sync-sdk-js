import { type ExecuteRequestOptions, type JsonValue, getDefaultHttpService } from "@kontent-ai/core-sdk";
import { describe, expect, it, test } from "vitest";
import { getSyncClient } from "../../../lib/public_api.js";
import { fakeXContinuationTokenHeader } from "../../integration-tests.config.js";

class CustomError extends Error {}

describe("Custom http service", () => {
	it("Custom http service should be used", async () => {
		const fakeResponse = { result: "ok" };

		const initResponse = await getSyncClient("x")
			.publicApi()
			.create({
				httpService: {
					requestAsync: async <TResponseData extends JsonValue, TBodyData extends JsonValue>(opts: ExecuteRequestOptions<TBodyData>) => {
						return await Promise.resolve({
							success: true,
							response: {
								data: fakeResponse as JsonValue as TResponseData,
								body: opts.body,
								method: opts.method,
								requestHeaders: opts.requestHeaders ?? [],
								adapterResponse: {
									isValidResponse: true,
									statusText: "Ok",
									responseHeaders: [fakeXContinuationTokenHeader],
									status: 200,
									toJsonAsync: async () => fakeResponse,
									toBlobAsync: async () => null,
								},
							},
						});
					},
					downloadFileAsync: () => {
						throw new Error("Not implemented");
					},
					uploadFileAsync: () => {
						throw new Error("Not implemented");
					},
				},
			})
			.init()
			.toPromise();

		expect(initResponse.response?.payload).toStrictEqual(fakeResponse);
		expect(initResponse.response?.meta.continuationToken).toStrictEqual(fakeXContinuationTokenHeader.value);
	});

	test("Error should be thrown as is when custom code causes an exception", async ({ expect }) => {
		await expect(async () => {
			await getSyncClient("x")
				.publicApi()
				.create({
					responseValidation: {
						enable: true,
					},
					httpService: getDefaultHttpService({
						adapter: {
							requestAsync: () => {
								throw new CustomError();
							},
						},
					}),
				})
				.init()
				.toPromise();
		}).rejects.toThrowError(CustomError);
	});
});
