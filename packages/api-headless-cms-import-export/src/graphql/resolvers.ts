import type { Context } from "~/types";
import { createZodError } from "@webiny/utils";
import { resolve, resolveList } from "@webiny/handler-graphql";
import zod from "zod";
import type { GenericRecord, NonEmptyArray } from "@webiny/api/types";
import { CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types";

const validateAbortExportContentEntries = zod.object({
    id: zod.string()
});

const validateGetExportContentEntries = zod.object({
    id: zod.string()
});

const validateListExportContentEntries = zod.object({
    limit: zod.number().optional().default(50),
    after: zod.string().optional()
});

const validateImportFromUrl = zod.object({
    data: zod.string().or(zod.object({}).passthrough())
});

const getValidateImportFromUrl = zod.object({
    id: zod.string()
});

const getImportFromUrl = zod.object({
    id: zod.string()
});

const importFromUrlValidation = zod.object({
    id: zod.string(),
    maxInsertErrors: zod.number().optional().default(100),
    overwrite: zod.boolean().optional().default(false)
});

const abortImportFromUrl = zod.object({
    id: zod.string()
});

const validateExportContentEntriesInput = zod.object({
    exportAssets: zod.boolean().optional().default(false),
    limit: zod.number().optional(),
    after: zod.string().optional(),
    where: zod.object({}).passthrough().optional().default({})
});
/**
 * Create export resolver for each of the models given.
 */
const createExportContentEntries = (models: NonEmptyArray<CmsModel>) => {
    return models.reduce<GenericRecord<string>>((resolvers, model) => {
        resolvers[`export${model.pluralApiName}ContentEntries`] = async (
            _: unknown,
            input: unknown,
            context: Context
        ) => {
            return resolve(async () => {
                const result = validateExportContentEntriesInput.safeParse(input);

                if (!result.success) {
                    throw createZodError(result.error);
                }

                return await context.cmsImportExport.exportContentEntries({
                    ...result.data,
                    modelId: model.modelId,
                    where: result.data.where ? (result.data.where as CmsEntryListWhere) : undefined
                });
            });
        };
        return resolvers;
    }, {});
};

export const createResolvers = (models: NonEmptyArray<CmsModel>) => {
    return {
        Query: {
            async getExportContentEntries(_: unknown, input: unknown, context: Context) {
                return resolve(async () => {
                    const result = validateGetExportContentEntries.safeParse(input);

                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    return await context.cmsImportExport.getExportContentEntries(result.data);
                });
            },
            async listExportContentEntries(_: unknown, input: unknown, context: Context) {
                return resolveList(async () => {
                    const result = validateListExportContentEntries.safeParse(input);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }
                    return await context.cmsImportExport.listExportContentEntries(result.data);
                });
            },
            async getValidateImportFromUrl(_: unknown, input: unknown, context: Context) {
                return resolve(async () => {
                    const result = getValidateImportFromUrl.safeParse(input);

                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    return await context.cmsImportExport.getValidateImportFromUrl(result.data);
                });
            },
            async getImportFromUrl(_: unknown, input: unknown, context: Context) {
                return resolve(async () => {
                    const result = getImportFromUrl.safeParse(input);

                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    return await context.cmsImportExport.getImportFromUrl(result.data);
                });
            }
        },
        Mutation: {
            ...createExportContentEntries(models),
            async abortExportContentEntries(_: unknown, input: unknown, context: Context) {
                return resolve(async () => {
                    const result = validateAbortExportContentEntries.safeParse(input);

                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    return await context.cmsImportExport.abortExportContentEntries(result.data);
                });
            },
            async validateImportFromUrl(_: unknown, input: unknown, context: Context) {
                return resolve(async () => {
                    const result = validateImportFromUrl.safeParse(input);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    return await context.cmsImportExport.validateImportFromUrl(result.data);
                });
            },
            async importFromUrl(_: unknown, input: unknown, context: Context) {
                return resolve(async () => {
                    const result = importFromUrlValidation.safeParse(input);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    return await context.cmsImportExport.importFromUrl(result.data);
                });
            },
            async abortImportFromUrl(_: unknown, input: unknown, context: Context) {
                return resolve(async () => {
                    const result = abortImportFromUrl.safeParse(input);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    return await context.cmsImportExport.abortImportFromUrl(result.data);
                });
            }
        }
    };
};
