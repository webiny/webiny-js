import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { ErrorResponse, ListErrorResponse, ListResponse, Response } from "@webiny/handler-graphql";
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
    type ISchedulePageActionPayload,
    SchedulePageActionUseCase
} from "~/features/SchedulePageAction/index.js";
import { CancelScheduledPageActionUseCase } from "~/features/CancelScheduledPageAction/index.js";
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
    meta: unknown;
}

const resolveList = async (cb: () => Promise<IResolveListCallableResponse>) => {
    try {
        const result = await cb();

        return new ListResponse(result.data, result.meta);
    } catch (ex) {
        return new ListErrorResponse(ex);
    }
};

export const createWbSchedulerGraphQL = () => {
    return new GraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            enum WbScheduleRecordType {
                publish
                unpublish
            }

            type WbScheduleRecord {
                id: String!
                targetId: String!
                scheduledBy: WbIdentity!
                publishOn: DateTime
                unpublishOn: DateTime
                type: WbScheduleRecordType!
                title: String!
            }

            type WbGetScheduleResponse {
                data: WbScheduleRecord
                error: WbError
            }

            type WbListSchedulesResponse {
                data: [WbScheduleRecord!]
                error: WbError
                meta: WbMeta
            }

            type WbCreateScheduleResponse {
                data: WbScheduleRecord
                error: WbError
            }

            type WbUpdateScheduleResponse {
                data: WbScheduleRecord
                error: WbError
            }

            type WbCancelScheduleResponse {
                data: Boolean
                error: WbError
            }

            input WbListSchedulesWhereInput {
                targetId: ID
                title_contains: String
                title_not_contains: String
                type: WbScheduleRecordType
                scheduledBy: ID
                scheduledFor: DateTime
                scheduledFor_gte: DateTime
                scheduledFor_lte: DateTime
            }

            enum WbListSchedulesSorter {
                title_ASC
                title_DESC
                scheduledFor_ASC
                scheduledFor_DESC
            }

            extend type WbQuery {
                getWbSchedule(id: ID!): WbGetScheduleResponse!
                listWbSchedules(
                    where: WbListSchedulesWhereInput
                    sort: [WbListSchedulesSorter!]
                    limit: Int
                    after: String
                ): WbListSchedulesResponse!
            }

            extend type WbMutation {
                createWbSchedule(
                    id: ID!
                    immediately: Boolean
                    scheduleFor: DateTime
                    type: WbScheduleRecordType!
                ): WbCreateScheduleResponse!
                updateWbSchedule(
                    id: ID!
                    immediately: Boolean
                    scheduleFor: DateTime
                    type: WbScheduleRecordType!
                ): WbUpdateScheduleResponse!
                cancelWbSchedule(id: ID!): WbCancelScheduleResponse!
            }
        `,
        resolvers: {
            WbQuery: {
                async getWbSchedule(_, args, context) {
                    return resolve(async () => {
                        const validated = await getScheduleSchema.safeParseAsync(args);
                        if (validated.error) {
                            throw createZodError(validated.error);
                        }

                        const listActions = context.container.resolve(ListScheduledActionsUseCase);

                        const actions = await listActions.execute<ISchedulePageActionPayload>({
                            where: { namespace: "Wb/Page", targetId: args.id }
                        });

                        if (actions.isFail()) {
                            throw actions.error;
                        }

                        const { items } = actions.value;

                        if (!items.length) {
                            return null;
                        }

                        return ActionMapper.fromScheduledAction(items[0]);
                    });
                },
                async listWbSchedules(_, args, context) {
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

                        const actions = await listActions.execute<ISchedulePageActionPayload>({
                            where: { ...where, namespace: "Wb/Page" },
                            // @ts-expect-error sort values are validated by Zod schema
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
            WbMutation: {
                async createWbSchedule(_, args, context) {
                    return resolve(async () => {
                        const validated = await createScheduleSchema.safeParseAsync(args);
                        if (validated.error) {
                            throw createZodError(validated.error);
                        }

                        const data = validated.data;

                        const schedulePage = context.container.resolve(SchedulePageActionUseCase);
                        const result = await schedulePage.execute({
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
                async updateWbSchedule(_, args, context) {
                    return resolve(async () => {
                        const validated = await updateScheduleSchema.safeParseAsync(args);
                        if (validated.error) {
                            throw createZodError(validated.error);
                        }

                        const data = validated.data;

                        const schedulePage = context.container.resolve(SchedulePageActionUseCase);
                        const result = await schedulePage.execute({
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
                async cancelWbSchedule(_, args, context) {
                    return resolve(async () => {
                        const validated = await cancelScheduleSchema.safeParseAsync(args);
                        if (validated.error) {
                            throw createZodError(validated.error);
                        }

                        const cancelPageAction = context.container.resolve(
                            CancelScheduledPageActionUseCase
                        );

                        const res = await cancelPageAction.execute(validated.data.id);

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
