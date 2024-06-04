import { Context } from "~/types";
import { createZodError } from "@webiny/utils";
import { resolve } from "@webiny/handler-graphql";
import zod from "zod";

const validateAbortExportContentEntries = zod.object({
    id: zod.string()
});

export const createResolvers = (models: [string, ...string[]]) => {
    const validateExportContentEntriesInput = zod.object({
        modelId: zod.enum(models)
    });

    return {
        Mutation: {
            async startExportContentEntries(_: unknown, input: unknown, context: Context) {
                return resolve(async () => {
                    const result = validateExportContentEntriesInput.safeParse(input);

                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    return await context.cmsImportExport.startExportContentEntries(result.data);
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
            }
        }
    };
};
