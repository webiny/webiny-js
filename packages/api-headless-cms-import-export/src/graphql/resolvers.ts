import { Context } from "~/types";
import { createZodError } from "@webiny/utils";
import { resolve } from "@webiny/handler-graphql";
import zod from "zod";
import { NonEmptyArray } from "@webiny/api/types";

const validateAbortExportContentEntries = zod.object({
    id: zod.string()
});

const validateGetExportContentEntries = zod.object({
    id: zod.string()
});

const validateImportFromUrl = zod.object({
    data: zod.string()
});

const getValidateImportFromUrl = zod.object({
    id: zod.string()
});

export const createResolvers = (models: NonEmptyArray<string>) => {
    const validateExportContentEntriesInput = zod.object({
        modelId: zod.enum(models),
        exportAssets: zod.boolean().optional().default(false),
        limit: zod.number().optional()
    });

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
            async getValidateImportFromUrl(_: unknown, input: unknown, context: Context) {
                return resolve(async () => {
                    const result = getValidateImportFromUrl.safeParse(input);

                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    return await context.cmsImportExport.getValidateImportFromUrl(result.data);
                });
            }
        },
        Mutation: {
            async exportContentEntries(_: unknown, input: unknown, context: Context) {
                return resolve(async () => {
                    const result = validateExportContentEntriesInput.safeParse(input);

                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    return await context.cmsImportExport.exportContentEntries(result.data);
                });
            },
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
            }
        }
    };
};
