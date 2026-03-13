import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms/plugins/index.js";
import { ErrorResponse, ListErrorResponse, ListResponse, Response } from "@webiny/handler-graphql";
import type { CmsContext, CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import {
    cancelScheduleSchema,
    createScheduleSchema,
    getScheduleSchema,
    listScheduleSchema,
    updateScheduleSchema
} from "~/graphql/schema.js";
import { createZodError } from "@webiny/utils";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler/features/ListScheduledActions";
import {
    type IScheduleActionPayload,
    ScheduleEntryActionUseCase
} from "~/features/ScheduleEntryAction/index.js";
import { CancelScheduledEntryActionUseCase } from "~/features/CancelScheduledEntryAction/index.js";
import { ActionMapper } from "~/graphql/ActionMapper.js";

const typeMap = {
    publish: "Publish",
    unpublish: "Unpublish"
} as const;

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
    return new CmsGraphQLSchemaPlugin<CmsContext>({
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
                publishOn: DateTime
                unpublishOn: DateTime
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

            type CmsCreateScheduleResponse {
                data: CmsScheduleRecord
                error: CmsError
            }

            type CmsUpdateScheduleResponse {
                data: CmsScheduleRecord
                error: CmsError
            }

            type CmsCancelScheduleResponse {
                data: Boolean
                error: CmsError
            }

            input CmsListSchedulesWhereInput {
                targetId: ID
                title_contains: String
                title_not_contains: String
                type: CmsScheduleRecordType
                scheduledBy: ID
                scheduledFor: DateTime
                scheduledFor_gte: DateTime
                scheduledFor_lte: DateTime
            }

            enum CmsListSchedulesSorter {
                title_ASC
                title_DESC
                scheduledFor_ASC
                scheduledFor_DESC
            }

            extend type Query {
                getCmsSchedule(modelId: String!, id: ID!): CmsGetScheduleResponse!
                listCmsSchedules(
                    modelId: String!
                    where: CmsListSchedulesWhereInput
                    sort: [CmsListSchedulesSorter!]
                    limit: Int
                    after: String
                ): CmsListSchedulesResponse!
            }

            extend type Mutation {
                createCmsSchedule(
                    modelId: String!
                    id: ID!
                    immediately: Boolean
                    scheduleFor: DateTime
                    type: CmsScheduleRecordType!
                ): CmsCreateScheduleResponse!
                updateCmsSchedule(
                    modelId: String!
                    id: ID!
                    immediately: Boolean
                    scheduleFor: DateTime
                    type: CmsScheduleRecordType!
                ): CmsUpdateScheduleResponse!
                cancelCmsSchedule(modelId: String!, id: ID!): CmsCancelScheduleResponse!
            }
        `,
        resolvers: {
            Query: {
                async getCmsSchedule(_, args, context) {
                    return resolve(async () => {
                        const validated = await getScheduleSchema.safeParseAsync(args);
                        if (validated.error) {
                            throw createZodError(validated.error);
                        }

                        const listActions = context.container.resolve(ListScheduledActionsUseCase);

                        const actions = await listActions.execute<IScheduleActionPayload>({
                            where: { namespace: `Cms/Entry/${args.modelId}`, targetId: args.id }
                        });

                        if (actions.isFail()) {
                            return new ErrorResponse({
                                code: actions.error.code,
                                message: actions.error.message
                            });
                        }

                        const { items } = actions.value;

                        if (!items.length) {
                            return null;
                        }

                        return ActionMapper.fromScheduledAction(items[0]);
                    });
                },
                async listCmsSchedules(_, args, context) {
                    return resolveList(async () => {
                        const validated = await listScheduleSchema.safeParseAsync(args);
                        if (validated.error) {
                            throw createZodError(validated.error);
                        }

                        const listActions = context.container.resolve(ListScheduledActionsUseCase);

                        const { type, ...where } = validated.data.where ?? {};

                        if (type) {
                            // @ts-expect-error
                            where["actionType"] = typeMap[type];
                        }

                        const actions = await listActions.execute<IScheduleActionPayload>({
                            where: { ...where, namespace: `Cms/Entry/${args.modelId}` },
                            sort: validated.data.sort,
                            limit: validated.data.limit,
                            after: validated.data.after
                        });

                        if (actions.isFail()) {
                            throw actions.error;
                        }

                        return {
                            data: actions.value.items.map(item =>
                                ActionMapper.fromScheduledAction(item)
                            ),
                            meta: actions.value.meta
                        };
                    });
                }
            },
            Mutation: {
                async createCmsSchedule(_, args, context) {
                    return resolve(async () => {
                        const validated = await createScheduleSchema.safeParseAsync(args);
                        if (validated.error) {
                            throw createZodError(validated.error);
                        }

                        const data = validated.data;

                        const scheduleEntry = context.container.resolve(ScheduleEntryActionUseCase);
                        const result = await scheduleEntry.execute({
                            modelId: data.modelId,
                            targetId: data.id,
                            scheduleFor: data.scheduleFor?.toISOString(),
                            immediately: data.immediately,
                            actionType: typeMap[data.type]
                        });

                        if (result.isFail()) {
                            throw result.error;
                        }

                        return ActionMapper.fromScheduledAction(result.value);
                    });
                },
                async updateCmsSchedule(_, args, context) {
                    return resolve(async () => {
                        const validated = await updateScheduleSchema.safeParseAsync(args);
                        if (validated.error) {
                            throw createZodError(validated.error);
                        }

                        const data = validated.data;

                        const scheduleEntry = context.container.resolve(ScheduleEntryActionUseCase);
                        const result = await scheduleEntry.execute({
                            modelId: data.modelId,
                            targetId: data.id,
                            scheduleFor: data.scheduleFor?.toISOString(),
                            immediately: data.immediately,
                            actionType: typeMap[data.type]
                        });

                        if (result.isFail()) {
                            throw result.error;
                        }

                        return ActionMapper.fromScheduledAction(result.value);
                    });
                },
                async cancelCmsSchedule(_, args, context) {
                    return resolve(async () => {
                        const validated = await cancelScheduleSchema.safeParseAsync(args);
                        if (validated.error) {
                            throw createZodError(validated.error);
                        }

                        const cancelEntryAction = context.container.resolve(
                            CancelScheduledEntryActionUseCase
                        );

                        const res = await cancelEntryAction.execute(validated.data.id);

                        if (res.isFail()) {
                            throw res.error;
                        }

                        return true;
                    });
                }
            }
        }
    });
};
