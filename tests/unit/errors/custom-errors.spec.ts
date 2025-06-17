import { type ErrorReason, getDefaultHttpService } from "@kontent-ai/core-sdk";
import { describe, expect, it } from "vitest";
import { getSyncClient } from "../../../lib/public_api.js";

class CustomError extends Error {}

describe("Handling of custom errors", async () => {
	const { success, error } = await getSyncClient("x")
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

	it("Success should be false", () => {
		expect(success).toBe(false);
	});

	it("Error should be returned as unknown", () => {
		expect(error?.reason).toBe<ErrorReason>("unknown");
	});

	it("Original error should be propagated and be of proper type", () => {
		if (error?.reason === "unknown") {
			expect(error.originalError).toBeInstanceOf(CustomError);
		} else {
			throw new Error("Error should be returned as unknown");
		}
	});
});
