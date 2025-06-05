import { z } from 'zod/v4';
import type { SyncClientTypes } from '../models/core.models.js';
import type { Override, Prettify } from '../models/utility-models.js';

const changeTypeSchema = z.enum(['changed', 'deleted']);

const baseDeltaObjectSchema = z.object({
	change_type: changeTypeSchema,
	timestamp: z.iso.datetime(),
});

// Content Item System
export const contentItemSystemSchema = z.readonly(
	z.object({
		id: z.string(),
		collection: z.string(),
		codename: z.string(),
		name: z.string(),
		type: z.string(),
		language: z.string(),
		last_modified: z.string(),
		workflow: z.string().optional(),
		workflow_step: z.string().optional(),
	}),
);

export type ContentItemSystem<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof contentItemSystemSchema>,
		{
			readonly collection: TSyncApiTypes['collectionCodenames'];
			readonly type: TSyncApiTypes['typeCodenames'];
			readonly language: TSyncApiTypes['languageCodenames'];
			readonly workflow?: TSyncApiTypes['workflowCodenames'];
			readonly workflow_step?: TSyncApiTypes['workflowStepCodenames'];
		}
	>
>;

// Content Type System
export const contentTypeSystemSchema = z.readonly(
	z.object({
		id: z.string(),
		codename: z.string(),
		name: z.string(),
		last_modified: z.string(),
	}),
);

export type ContentTypeSystem<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof contentTypeSystemSchema>,
		{
			readonly codename: TSyncApiTypes['typeCodenames'];
		}
	>
>;

// Language System
export const languageSystemSchema = z.readonly(
	z.object({
		id: z.string(),
		codename: z.string(),
		name: z.string(),
	}),
);

export type LanguageSystem<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof languageSystemSchema>,
		{
			readonly codename: TSyncApiTypes['languageCodenames'];
		}
	>
>;

// Taxonomy System
export const taxonomySystemSchema = z.readonly(
	z.object({
		id: z.string(),
		codename: z.string(),
		name: z.string(),
		last_modified: z.string(),
	}),
);

export type TaxonomySystem<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof taxonomySystemSchema>,
		{
			readonly codename: TSyncApiTypes['taxonomyCodenames'];
		}
	>
>;

// Delta Objects
export const contentItemDeltaObjectSchema = z.readonly(
	z.object({
		...baseDeltaObjectSchema.shape,
		data: z.readonly(
			z.object({
				system: contentItemSystemSchema,
			}),
		),
	}),
);

export type ContentItemDeltaObject<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof contentItemDeltaObjectSchema>,
		{
			readonly data: {
				readonly system: ContentItemSystem<TSyncApiTypes>;
			};
		}
	>
>;

export const contentTypeDeltaObjectSchema = z.readonly(
	z.object({
		...baseDeltaObjectSchema.shape,
		data: z.readonly(
			z.object({
				system: contentTypeSystemSchema,
			}),
		),
	}),
);

export type ContentTypeDeltaObject<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof contentTypeDeltaObjectSchema>,
		{
			readonly data: {
				readonly system: ContentTypeSystem<TSyncApiTypes>;
			};
		}
	>
>;

export const taxonomyDeltaObjectSchema = z.readonly(
	z.object({
		...baseDeltaObjectSchema.shape,
		data: z.readonly(
			z.object({
				system: taxonomySystemSchema,
			}),
		),
	}),
);

export type TaxonomyDeltaObject<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof taxonomyDeltaObjectSchema>,
		{
			readonly data: {
				readonly system: TaxonomySystem<TSyncApiTypes>;
			};
		}
	>
>;

export const languageDeltaObjectSchema = z.readonly(
	z.object({
		...baseDeltaObjectSchema.shape,
		data: z.readonly(
			z.object({
				system: languageSystemSchema,
			}),
		),
	}),
);

export type LanguageDeltaObject<TSyncApiTypes extends SyncClientTypes> = Prettify<
	Override<
		z.infer<typeof languageDeltaObjectSchema>,
		{
			readonly data: {
				readonly system: LanguageSystem<TSyncApiTypes>;
			};
		}
	>
>;
