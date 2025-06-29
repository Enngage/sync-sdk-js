import { describe, expect, it } from "vitest";
import { getSyncClient } from "../../../lib/public_api.js";

describe("Verifies config setup", () => {
	it("Endpoint should use preview base url", () => {
		expect(new URL(getSyncClient("x").previewApi("y").create().init().toUrl()).href).toContain(
			"https://preview-deliver.kontent.ai/v2/",
		);
	});

	it("Endpoint should use public base url", () => {
		expect(new URL(getSyncClient("x").publicApi().create().init().toUrl()).href).toContain("https://deliver.kontent.ai/v2/");
	});

	it("Secure mode should use public base url", () => {
		expect(new URL(getSyncClient("x").secureApi("y").create().init().toUrl()).href).toContain("https://deliver.kontent.ai/v2/");
	});

	it("Custom base url should overwrite all API modes", () => {
		const customBaseUrl = "https://custom.com";

		expect(
			new URL(
				getSyncClient("x")
					.publicApi()
					.create({
						baseUrl: customBaseUrl,
					})
					.init()
					.toUrl(),
			).origin,
		).toEqual(customBaseUrl);

		expect(
			new URL(
				getSyncClient("x")
					.previewApi("y")
					.create({
						baseUrl: customBaseUrl,
					})
					.init()
					.toUrl(),
			).origin,
		).toEqual(customBaseUrl);

		expect(
			new URL(
				getSyncClient("x")
					.secureApi("y")
					.create({
						baseUrl: customBaseUrl,
					})
					.init()
					.toUrl(),
			).origin,
		).toEqual(customBaseUrl);
	});
});
