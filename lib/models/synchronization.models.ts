import type { SyncClientTypes } from './core.models.js';

export type ChangeType = 'changed' | 'deleted';

export type DeltaObject<TData> = {
	readonly change_type: ChangeType;
	readonly timestamp: string;
	readonly data: TData;
};

export type ContentItemSystem<TSyncApiTypes extends SyncClientTypes> = {
	readonly id: string;
	readonly collection: TSyncApiTypes['collectionCodenames'];
	readonly codename: string;
	readonly name: string;
	readonly type: TSyncApiTypes['typeCodenames'];
	readonly language: TSyncApiTypes['languageCodenames'];
	readonly last_modified: string;
	readonly workflow?: TSyncApiTypes['workflowCodenames'];
	readonly workflow_step?: TSyncApiTypes['workflowStepCodenames'];
};

export type ContentTypeSystem<TSyncApiTypes extends SyncClientTypes> = {
	readonly id: string;
	readonly codename: TSyncApiTypes['typeCodenames'];
	readonly name: string;
	readonly last_modified: string;
};

export type LanguageSystem<TSyncApiTypes extends SyncClientTypes> = {
	readonly id: string;
	readonly codename: TSyncApiTypes['languageCodenames'];
	readonly name: string;
};

export type TaxonomySystem<TSyncApiTypes extends SyncClientTypes> = {
	readonly id: string;
	readonly codename: TSyncApiTypes['taxonomyCodenames'];
	readonly name: string;
	readonly last_modified: string;
};

export type ContentItemDeltaObject<TSyncApiTypes extends SyncClientTypes> = DeltaObject<{
	readonly system: ContentItemSystem<TSyncApiTypes>;
}>;

export type ContentTypeDeltaObject<TSyncApiTypes extends SyncClientTypes> = DeltaObject<{
	readonly system: ContentTypeSystem<TSyncApiTypes>;
}>;

export type LanguageDeltaObject<TSyncApiTypes extends SyncClientTypes> = DeltaObject<{
	readonly system: LanguageSystem<TSyncApiTypes>;
}>;

export type TaxonomyDeltaObject<TSyncApiTypes extends SyncClientTypes> = DeltaObject<{
	readonly system: TaxonomySystem<TSyncApiTypes>;
}>;
