import { getDefaultHttpService } from "@kontent-ai/core-sdk";
import { describe, expect, it } from "vitest";
import type { SyncHeaderNames } from "../../../lib/models/core.models.js";
import { type SyncClientTypes, type SyncQueryPayload, getSyncClient } from "../../../lib/public_api.js";

type TokenWithResponse = {
	readonly token: string;
	readonly response: SyncQueryPayload<SyncClientTypes>;
};

describe("Paging", async () => {
	const tokensWithResponses: readonly TokenWithResponse[] = [
		getTokenWithResponse("a", false),
		getTokenWithResponse("b", false),
		getTokenWithResponse("c", false),
		getTokenWithResponse("d", true),
	];

	const httpService = getDefaultHttpService({
		adapter: {
			requestAsync: async (data) => {
				const continuationToken = data.requestHeaders?.find(
					(header) => header.name.toLowerCase() === ("X-Continuation" satisfies SyncHeaderNames).toLowerCase(),
				)?.value;

				if (!continuationToken) {
					throw new Error("Continuation must be provided in all request headers");
				}

				const tokenWithResponseIndex = tokensWithResponses.findIndex(
					(tokenWithResponse) => tokenWithResponse.token === continuationToken,
				);

				const tokenWithResponse = tokensWithResponses.find((tokenWithResponse) => tokenWithResponse.token === continuationToken);

				const nextTokenWithResponseIndex = tokenWithResponseIndex + 1;
				const nextTokenWithResponse =
					tokensWithResponses.length > nextTokenWithResponseIndex ? tokensWithResponses[nextTokenWithResponseIndex] : undefined;

				return await Promise.resolve({
					isValidResponse: true,
					responseHeaders: [
						{
							name: "X-Continuation" satisfies SyncHeaderNames,
							// use next token if available, otherwise use the current token
							value: nextTokenWithResponse ? nextTokenWithResponse.token : continuationToken,
						},
					],
					status: 200,
					toJsonAsync: async () => Promise.resolve(tokenWithResponse?.response ?? {}),
					toBlobAsync: () => {
						throw new Error("Not implemented");
					},
					statusText: "Ok",
				});
			},
		},
	});

	const { success, responses } = await getSyncClient("x")
		.publicApi()
		.create({ httpService })
		.sync(tokensWithResponses[0].token)
		.toAllPromise();

	it("Should be successful", () => {
		expect(success).toBe(true);
	});

	it(`Should return '${tokensWithResponses.length}' responses`, () => {
		expect(responses?.length).toBe(tokensWithResponses.length);
	});

	for (const [index, tokenWithResponse] of tokensWithResponses.entries()) {
		const response = responses?.[index];

		it(`Received payload on index ${index} should be equal to the provided response on the same index`, () => {
			expect(response?.payload).toStrictEqual(tokenWithResponse.response);
		});

		// The last token should be the same as the last token in the list, otherwise it should be the next token
		const expectedToken =
			tokensWithResponses.length > index + 1 ? tokensWithResponses[index + 1].token : tokensWithResponses.at(-1)?.token;

		it(`Received continuation token on index ${index} should be equal to next token if available, otherwise the last token`, () => {
			expect(response?.meta.continuationToken).toStrictEqual(expectedToken);
		});
	}
});

function getTokenWithResponse(token: string, isLast: boolean): TokenWithResponse {
	return {
		token,
		response: getSyncQueryPayload(token, isLast),
	};
}

function getSyncQueryPayload(token: string, isLast: boolean): SyncQueryPayload<SyncClientTypes> {
	if (isLast) {
		return {
			items: [],
			languages: [],
			taxonomies: [],
			types: [],
		};
	}

	return {
		items: [],
		languages: [
			{
				change_type: "changed",
				data: {
					system: {
						id: token,
						name: token,
						codename: token,
					},
				},
				timestamp: "2021-01-01T00:00:00.000Z",
			},
		],
		taxonomies: [],
		types: [],
	};
}
