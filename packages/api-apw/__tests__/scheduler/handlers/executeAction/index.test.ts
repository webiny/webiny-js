import { Context } from "@webiny/api";
import { executeActionHandlerPlugins, HandlerArgs } from "~/scheduler/handlers/executeAction";
import { PayloadEventHandler } from "@webiny/handler-fastify-aws";
import { Context as BaseContext } from "@webiny/handler-fastify-aws/types";
import { HeadlessCMSGraphQL } from "~/scheduler/handlers/executeAction/plugins/HeadlessCMSGraphQL";
import { ApwContentTypes, ApwScheduleAction, ApwScheduleActionTypes } from "~/scheduler/types";

jest.mock("@webiny/handler-db", () => {
    return () => [];
});

jest.mock("aws-sdk/clients/dynamodb", () => {
    return {
        DocumentClient: class {
            get() {
                return {
                    promise: async () => {
                        return {
                            Item: null
                        };
                    }
                };
            }
        }
    };
});

const dummyActions: ApwScheduleAction[] = [
    {
        data: {
            action: ApwScheduleActionTypes.PUBLISH,
            type: ApwContentTypes.CMS_ENTRY,
            datetime: new Date().toISOString(),
            modelId: "model",
            entryId: "id#1"
        },
        locale: "en-US",
        tenant: "root",
        id: "1",
        createdBy: {
            id: "admin",
            type: "admin",
            displayName: "admin"
        },
        createdOn: new Date().toISOString()
    }
];

describe("execute action handler", () => {
    it("should not invoke lambda as there are no actions defined", async () => {
        const context = new Context({
            plugins: [
                executeActionHandlerPlugins({
                    storageOperations: {
                        list: async () => {
                            return [
                                [],
                                {
                                    hasMoreItems: false,
                                    totalCount: 0,
                                    cursor: null
                                }
                            ];
                        }
                    } as any
                }),
                new HeadlessCMSGraphQL()
            ],
            WEBINY_VERSION: "w.w.w"
        }) as unknown as BaseContext;

        const invoke = jest.fn();

        context.handlerClient = {
            invoke
        } as any;

        const [actionHandler] = context.plugins.byType<PayloadEventHandler<HandlerArgs>>(
            PayloadEventHandler.type
        ) as PayloadEventHandler<HandlerArgs>[];

        const result = await actionHandler.cb({
            context,
            request: {} as any,
            payload: {
                locale: "en-US",
                tenant: "root",
                datetime: new Date().toISOString(),
                futureDatetime: new Date().toISOString()
            },
            lambdaContext: {} as any
        });

        expect(result).toBeUndefined();
        expect(invoke).toBeCalledTimes(0);
    });

    it("should invoke lambda with items", async () => {
        const context = new Context({
            plugins: [
                executeActionHandlerPlugins({
                    storageOperations: {
                        list: async () => {
                            return [
                                dummyActions,
                                {
                                    hasMoreItems: false,
                                    totalCount: 1,
                                    cursor: null
                                }
                            ];
                        }
                    } as any
                }),
                new HeadlessCMSGraphQL()
            ],
            WEBINY_VERSION: "w.w.w"
        }) as unknown as BaseContext;

        const invoke = jest.fn(() => {
            return {
                body: {
                    ok: true
                }
            };
        });

        context.handlerClient = {
            invoke
        } as any;

        const [actionHandler] = context.plugins.byType<PayloadEventHandler<HandlerArgs>>(
            PayloadEventHandler.type
        ) as PayloadEventHandler<HandlerArgs>[];

        const result = await actionHandler.cb({
            context,
            request: {} as any,
            payload: {
                locale: "en-US",
                tenant: "root",
                datetime: new Date().toISOString(),
                futureDatetime: new Date().toISOString()
            },
            lambdaContext: {} as any
        });

        expect(result).toBeUndefined();
        expect(invoke).toBeCalledTimes(1);
    });
});
