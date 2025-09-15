import { beforeEach, describe, expect, it } from "vitest";
import { Handler } from "~/handler/Handler.js";
import { useHandler } from "~tests/mocks/context/useHandler.js";
import { createMockScheduleClient } from "~tests/mocks/scheduleClient.js";
import { SCHEDULE_MODEL_ID, SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER } from "~/constants.js";
import type { ScheduleContext } from "~/types.js";
import { NotFoundError } from "@webiny/handler-graphql";
import { type IScheduleEntryValues, ScheduleType } from "~/scheduler/types.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import {
    createScheduleRecordId,
    createScheduleRecordIdWithVersion
} from "~/scheduler/createScheduleRecordId.js";
import { MOCK_TARGET_MODEL_ID } from "~tests/mocks/targetModel.js";
import { dateToISOString } from "~/scheduler/dates.js";
import { UnpublishHandlerAction } from "~/handler/actions/UnpublishHandlerAction.js";
import { PublishHandlerAction } from "~/handler/actions/PublishHandlerAction.js";

const createEventScheduleRecordId = (targetId: string): string => {
    return `${createScheduleRecordIdWithVersion(targetId)}`;
};

describe("Handler", () => {
    const targetId = "target-id#0001";

    let context: ScheduleContext;

    beforeEach(async () => {
        const contextHandler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        context = await contextHandler.handler();
    });

    const createScheduleEntry = async (
        values: Omit<IScheduleEntryValues, "targetModelId">
    ): Promise<CmsEntry<IScheduleEntryValues>> => {
        const scheduleEntryManager = await context.cms.getEntryManager<IScheduleEntryValues>(
            SCHEDULE_MODEL_ID
        );
        return await scheduleEntryManager.create({
            id: createScheduleRecordId(values.targetId),
            ...values,
            targetModelId: MOCK_TARGET_MODEL_ID
        });
    };

    it("should fail to handle due to missing schedule entry", async () => {
        const handler = new Handler({
            actions: []
        });

        try {
            const result = await handler.handle({
                cms: context.cms,
                security: context.security,
                payload: {
                    [SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER]: {
                        id: createEventScheduleRecordId(targetId),
                        scheduleOn: new Date().toISOString()
                    }
                }
            });
            expect(result).toEqual("SHOULD NOT REACH HERE.");
        } catch (ex) {
            expect(ex).toBeInstanceOf(NotFoundError);
            expect(ex.message).toEqual(
                `Entry by ID "${createEventScheduleRecordId(targetId)}" not found.`
            );
            expect(ex.code).toEqual("NOT_FOUND");
        }
    });

    it("should fail to find action", async () => {
        const handler = new Handler({
            actions: [
                new UnpublishHandlerAction({
                    cms: context.cms
                })
            ]
        });

        const scheduleEntry = await createScheduleEntry({
            targetId,
            type: ScheduleType.publish,
            title: "Test Entry",
            scheduledOn: dateToISOString(new Date()),
            scheduledBy: context.security.getIdentity()
        });

        expect(scheduleEntry.entryId).toEqual(`${createScheduleRecordId(targetId)}`);

        try {
            const result = await handler.handle({
                cms: context.cms,
                security: context.security,
                payload: {
                    [SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER]: {
                        id: createEventScheduleRecordId(targetId),
                        scheduleOn: new Date().toISOString()
                    }
                }
            });
            expect(result).toEqual("SHOULD NOT REACH HERE.");
        } catch (ex) {
            expect(ex.message).toEqual(
                `No action found for schedule record ID: wby-schedule-target-id-0001#0001`
            );
        }
    });

    it("should handle action", async () => {
        const handler = new Handler({
            actions: [
                new PublishHandlerAction({
                    cms: context.cms
                })
            ]
        });

        const targetModel = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const targetEntryManager = await context.cms.getEntryManager(targetModel);

        const targetEntry = await targetEntryManager.create({
            id: "target-id",
            title: "Test Entry"
        });
        expect(targetEntry.id).toEqual(targetId);

        const scheduleModel = await context.cms.getModel(SCHEDULE_MODEL_ID);
        const scheduleEntry = await createScheduleEntry({
            targetId,
            type: ScheduleType.publish,
            title: "Test Entry",
            scheduledOn: dateToISOString(new Date()),
            scheduledBy: context.security.getIdentity()
        });

        expect(scheduleEntry.entryId).toEqual(`${createScheduleRecordId(targetId)}`);

        const scheduler = context.cms.scheduler(targetModel);

        const getScheduleEntry = await scheduler.getScheduled(createScheduleRecordId(targetId));

        expect(getScheduleEntry).toMatchObject({
            id: expect.any(String),
            targetId,
            model: targetModel,
            title: "Test Entry",
            publishOn: expect.any(Date),
            unpublishOn: undefined,
            type: ScheduleType.publish
        });

        await handler.handle({
            cms: context.cms,
            security: context.security,
            payload: {
                [SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER]: {
                    id: createEventScheduleRecordId(targetId),
                    scheduleOn: new Date().toISOString()
                }
            }
        });

        const [afterDeleteScheduledEntry] = await context.cms.getEntriesByIds(scheduleModel, [
            scheduleEntry.id
        ]);

        expect(afterDeleteScheduledEntry).toBeUndefined();

        const [afterActionTargetEntry] = await context.cms.getPublishedEntriesByIds(
            targetEntryManager.model,
            [targetId]
        );
        expect(afterActionTargetEntry).toMatchObject({
            id: targetId,
            values: {
                title: "Test Entry"
            },
            status: "published"
        });
    });

    it("should throw an error while handling action", async () => {
        const handler = new Handler({
            actions: [
                {
                    canHandle: () => true,
                    async handle(): Promise<void> {
                        throw new Error("Unknown error.");
                    }
                }
            ]
        });

        const targetEntryManager = await context.cms.getEntryManager(MOCK_TARGET_MODEL_ID);

        const targetEntry = await targetEntryManager.create({
            id: "target-id",
            title: "Test Entry"
        });
        expect(targetEntry.id).toEqual(targetId);

        const scheduleModel = await context.cms.getModel(SCHEDULE_MODEL_ID);
        const scheduleEntry = await createScheduleEntry({
            targetId,
            type: ScheduleType.publish,
            title: "Test Entry",
            scheduledOn: dateToISOString(new Date()),
            scheduledBy: context.security.getIdentity()
        });

        expect(scheduleEntry.entryId).toEqual(`${createScheduleRecordId(targetId)}`);

        try {
            const result = await handler.handle({
                cms: context.cms,
                security: context.security,
                payload: {
                    [SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER]: {
                        id: createEventScheduleRecordId(targetId),
                        scheduleOn: new Date().toISOString()
                    }
                }
            });
            expect(result).toEqual("SHOULD NOT REACH HERE.");
        } catch (ex) {
            expect(ex.message).toEqual("Unknown error.");
        }

        const afterActionErrorScheduleEntry = await context.cms.getEntryById(
            scheduleModel,
            scheduleEntry.id
        );
        expect(afterActionErrorScheduleEntry).toMatchObject({
            id: scheduleEntry.id,
            values: {
                title: "Test Entry",
                error: "Unknown error."
            }
        });
    });
});
