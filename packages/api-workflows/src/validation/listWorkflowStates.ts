import zod from "zod";
import type {
    CmsEntryListSortAsc,
    CmsEntryListSortDesc
} from "@webiny/api-headless-cms/types/index.js";
import { WorkflowStateRecordState } from "~/context/abstractions/WorkflowState.js";

const datePreprocess = (input: unknown) => {
    if (typeof input == "string" || input instanceof Date) {
        return new Date(input);
    }
    return undefined;
};

export const listWorkflowStatesValidation = zod
    .object({
        where: zod
            .object({
                app: zod.string().optional(),
                app_in: zod.array(zod.string()).optional(),
                workflowId: zod.string().optional(),
                workflowId_in: zod.array(zod.string()).optional(),
                targetId: zod.string().optional(),
                targetId_in: zod.array(zod.string()).optional(),
                targetRevisionId: zod.string().optional(),
                targetRevisionId_in: zod.array(zod.string()).optional(),
                state: zod.nativeEnum(WorkflowStateRecordState).optional(),
                state_in: zod.array(zod.nativeEnum(WorkflowStateRecordState)).optional(),
                createdOn_gte: zod.preprocess(datePreprocess, zod.date().optional()),
                createdOn_lte: zod.preprocess(datePreprocess, zod.date().optional()),
                savedOn_gte: zod.preprocess(datePreprocess, zod.date().optional()),
                savedOn_lte: zod.preprocess(datePreprocess, zod.date().optional()),
                createdBy: zod.string().optional(),
                savedBy: zod.string().optional()
            })
            .optional(),
        limit: zod.number().min(1).max(10000).optional(),
        sort: zod
            .array(
                zod
                    .string()
                    .min(1, "Sort array cannot contain empty values.")
                    .transform(value => {
                        const [field, order] = value.split("_");
                        if (order.toLowerCase() === "desc") {
                            return `${field}_DESC` as CmsEntryListSortDesc;
                        }
                        return `${field}_ASC` as CmsEntryListSortAsc;
                    })
            )
            .optional(),
        after: zod
            .string()
            .optional()
            .nullish()
            .transform(value => {
                return value || undefined;
            })
    })
    .optional();
