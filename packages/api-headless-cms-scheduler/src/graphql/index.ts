import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms/plugins/index.js";
import type { ScheduleContext } from "~/types.js";
import { ErrorResponse, ListErrorResponse, ListResponse, Response } from "@webiny/handler-graphql";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import {
    cancelScheduleSchema,
    createScheduleSchema,
    getScheduleSchema,
    listScheduleSchema,
    updateScheduleSchema
} from "~/graphql/schema.js";
import { createZodError } from "@webiny/utils";

const resolve = async (cb: () => Promise<unknown>) => {
    try {
        const result = await cb();

        return new Response(result);
    } catch (ex) {
        return new ErrorResponse(ex);
    }
};

interface IResolveListCallableResponse {
    data: unknown[];
    meta: CmsEntryMeta;
}

const resolveList = async (cb: () => Promise<IResolveListCallableResponse>) => {
    try {
        const result = await cb();

        return new ListResponse(result.data, result.meta);
    } catch (ex) {
        return new ListErrorResponse(ex);
    }
};

export const createSchedulerGraphQL = () => {
    return new CmsGraphQLSchemaPlugin<ScheduleContext>({
        /**
         * Make sure scheduler is available. No point in adding GraphQL if scheduler is unavailable for any reason.
         */
        isApplicable: context => {
            return !!context.cms?.scheduler;
        },
        typeDefs: /* GraphQL */ `
            enum CmsScheduleRecordType {
                publish
                unpublish
            }
            type CmsScheduleRecord {
                id: String!
                targetId: String!
                model: CmsContentModel!
                scheduledBy: CmsIdentity!
                publishOn: Date
                unpublishOn: Date
                type: CmsScheduleRecordType!
                title: String!
            }

            type CmsGetScheduleResponse {
                data: CmsScheduleRecord
                error: CmsError
            }

            type CmsListSchedulesResponse {
                data: [CmsScheduleRecord!]
                error: CmsError
                meta: CmsListMeta
            }

            input CmsCreateScheduleInput {
                dateOn: Date!
                type: CmsScheduleRecordType!
            }

            type CmsCreateScheduleResponse {
                data: CmsScheduleRecord
                error: CmsError
            }

            input CmsUpdateScheduleInput {
                dateOn: Date!
                type: CmsScheduleRecordType!
            }

            type CmsUpdateScheduleResponse {
                data: CmsScheduleRecord
                error: CmsError
            }

            type CmsCancelScheduleResponse {
                data: Boolean
                error: CmsError
            }

            extend type Query {
                getSchedule(modelId: String!, id: ID!): CmsGetScheduleResponse!
                listSchedules(modelId: String!): CmsListSchedulesResponse!
            }

            extend type Mutation {
                createSchedule(
                    modelId: String!
                    id: ID!
                    input: CmsCreateScheduleInput!
                ): CmsCreateScheduleResponse!
                updateSchedule(
                    modelId: String!
                    id: ID!
                    input: CmsUpdateScheduleInput!
                ): CmsUpdateScheduleResponse!
                cancelSchedule(modelId: String!, id: ID!): CmsCancelScheduleResponse!
            }
        `,
        resolvers: {
            Query: {
                async getSchedule(_, args, context) {
                    return resolve(async () => {
                        const validated = await getScheduleSchema.safeParseAsync(args);
                        if (validated.error) {
                            throw createZodError(validated.error);
                        }
                        const model = await context.cms.getModel(validated.data.modelId);
                        const scheduler = context.cms.scheduler(model);

                        return scheduler.getScheduled(validated.data.id);
                    });
                },
                async listSchedules(_, args, context) {
                    return resolveList(async () => {
                        const validated = await listScheduleSchema.safeParseAsync(args);
                        if (validated.error) {
                            throw createZodError(validated.error);
                        }
                        const model = await context.cms.getModel(validated.data.modelId);
                        const scheduler = context.cms.scheduler(model);

                        return scheduler.listScheduled({
                            where: validated.data.where,
                            sort: validated.data.sort,
                            limit: validated.data.limit,
                            after: validated.data.after
                        });
                    });
                }
            },
            Mutation: {
                async createSchedule(_, args, context) {
                    const validated = await createScheduleSchema.safeParseAsync(args);
                    if (validated.error) {
                        throw createZodError(validated.error);
                    }

                    const model = await context.cms.getModel(validated.data.modelId);
                    const scheduler = context.cms.scheduler(model);

                    return scheduler.schedule(validated.data.id, validated.data.input);
                },
                async updateSchedule(_, args, context) {
                    const validated = await updateScheduleSchema.safeParseAsync(args);
                    if (validated.error) {
                        throw createZodError(validated.error);
                    }
                    const model = await context.cms.getModel(validated.data.modelId);
                    const scheduler = context.cms.scheduler(model);

                    return scheduler.schedule(validated.data.id, validated.data.input);
                },
                async cancelSchedule(_, args, context) {
                    const validated = await cancelScheduleSchema.safeParseAsync(args);
                    if (validated.error) {
                        throw createZodError(validated.error);
                    }
                    const model = await context.cms.getModel(validated.data.modelId);
                    const scheduler = context.cms.scheduler(model);

                    return scheduler.cancel(validated.data.id);
                }
            }
        }
    });
};
