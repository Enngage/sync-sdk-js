import { describe, expect, it } from "vitest";
import { getSyncClient } from "../../lib/client/sync-client.js";
import { syncQueryPayloadSchema } from "../../lib/queries/sync-query.js";
import { getIntegrationTestConfig } from "../integration-tests.config.js";

describe("Sync paging query", async () => {
	const config = getIntegrationTestConfig();
	const client = getSyncClient(config.env.id).publicApi().create({
		baseUrl: config.env.syncBaseUrl,
	});

	const { success: initSuccess, response: initResponse } = await client.init().toPromise();

	if (!initSuccess) {
		throw new Error("Init query failed");
	}

	const { success: syncSuccess, responses: syncResponses } = await client.sync(initResponse.meta.continuationToken).toAllPromise();

	it("Sync query should be successful", () => {
		expect(syncSuccess).toBe(true);
	});

	it("There should be exactly 1 response", () => {
		expect(syncResponses?.length).toBe(1);
	});

	const syncResponse = syncResponses?.[0];

	it("Response should have a continuation token", () => {
		expect(syncResponse?.meta.continuationToken).toBeDefined();
	});

	it("Response payload should match sync query payload schema", async () => {
		const parseResult = await syncQueryPayloadSchema.safeParseAsync(syncResponse?.payload);
		expect(parseResult.error).toBeUndefined();
		expect(parseResult.success).toBeTruthy();
	});
});
