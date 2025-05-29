import { getEnvironmentRequiredValue } from './test.utils.js';

const integrationEnv = {
	id: getEnvironmentRequiredValue('INTEGRATION_ENVIRONMENT_ID'),
} as const;

export function getIntegrationTestConfig() {
	return {
		environmentId: integrationEnv.id,
		urls: {},
	};
}
