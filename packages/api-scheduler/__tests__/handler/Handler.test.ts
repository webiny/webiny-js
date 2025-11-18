import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "~tests/mocks/context/useHandler.js";
import { createMockScheduleClient } from "~tests/mocks/scheduleClient.js";
import { SCHEDULE_MODEL_ID, SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER } from "~/constants.js";
import { type IScheduleEntryValues, ScheduleType } from "~/scheduler/types.js";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import {
    createScheduleRecordId,
    createScheduleRecordIdWithVersion
} from "~/scheduler/createScheduleRecordId.js";
import { MOCK_TARGET_MODEL_ID } from "~tests/mocks/targetModel.js";
import { dateToISOString } from "~/scheduler/dates.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { ProcessRecordsUseCase } from "~/features/ProcessRecords/ProcessRecordsUseCase.js";
import {
    ProcessRecordsUseCase as ProcessRecordsAbstraction,
    RecordAction
} from "~/features/ProcessRecords/index.js";
import { UnpublishRecordAction } from "~/features/ProcessRecords/actions/UnpublishRecordAction.js";
import { PublishRecordAction } from "~/features/ProcessRecords/actions/PublishRecordAction.js";
import { SchedulerFactory } from "~/features/Scheduler/abstractions";

const createEventScheduleRecordId = (targetId: string): string => {
    return `${createScheduleRecordIdWithVersion(targetId)}`;
};

describe("Handler", () => {
    const targetId = "target-id#0001";

    let context: CmsContext;

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
        const getModel = context.container.resolve(GetModelUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);

        const modelResult = await getModel.execute(SCHEDULE_MODEL_ID);
        const model = modelResult.value;

        const res = await createEntry.execute(model, {
            id: createScheduleRecordId(values.targetId),
            ...values,
            targetModelId: MOCK_TARGET_MODEL_ID
        });

        return res.value as CmsEntry<IScheduleEntryValues>;
    };

    it("should fail to handle due to missing schedule entry", async () => {
        const testContainer = context.container.createChildContainer();
        // Register a use case without actions
        testContainer.register(ProcessRecordsUseCase);

        // Resolve and execute
        const processRecords = testContainer.resolve(ProcessRecordsAbstraction);

        try {
            const result = await processRecords.execute({
                [SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER]: {
                    id: createEventScheduleRecordId(targetId),
                    scheduleOn: new Date().toISOString()
                }
            });

            if (result.isFail()) {
                throw result.error;
            }

            expect(result).toEqual("SHOULD NOT REACH HERE.");
        } catch (ex) {
            expect(ex.message).toEqual(
                `Entry "${createEventScheduleRecordId(targetId)}" was not found!`
            );
            expect(ex.code).toEqual("Cms/Entry/NotFound");
        }
    });

    it("should fail to find action", async () => {
        const testContainer = context.container.createChildContainer();
        // Register a use case without actions
        testContainer.register(ProcessRecordsUseCase);
        testContainer.register(UnpublishRecordAction);

        // Resolve and execute
        const processRecords = testContainer.resolve(ProcessRecordsAbstraction);

        const scheduleEntry = await createScheduleEntry({
            targetId,
            type: ScheduleType.publish,
            title: "Test Entry",
            scheduledOn: dateToISOString(new Date()),
            scheduledBy: context.security.getIdentity()
        });

        expect(scheduleEntry.entryId).toEqual(`${createScheduleRecordId(targetId)}`);

        try {
            const result = await processRecords.execute({
                [SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER]: {
                    id: createEventScheduleRecordId(targetId),
                    scheduleOn: new Date().toISOString()
                }
            });

            if (result.isFail()) {
                throw result.error;
            }

            expect(result).toEqual("SHOULD NOT REACH HERE.");
        } catch (ex) {
            expect(ex.message).toEqual(
                `No action found for schedule record ID: wby-schedule-target-id-0001#0001`
            );
        }
    });

    it("should handle action", async () => {
        const testContainer = context.container.createChildContainer();
        // Register a use case without actions
        testContainer.register(ProcessRecordsUseCase);
        testContainer.register(PublishRecordAction);

        // Resolve and execute
        const processRecords = testContainer.resolve(ProcessRecordsAbstraction);

        const targetModel = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const targetEntry = await context.cms.createEntry(targetModel, {
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

        const schedulerFactory = testContainer.resolve(SchedulerFactory);
        const scheduler = schedulerFactory.useModel(targetModel);

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

        await processRecords.execute({
            [SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER]: {
                id: createEventScheduleRecordId(targetId),
                scheduleOn: new Date().toISOString()
            }
        });

        const [afterDeleteScheduledEntry] = await context.cms.getEntriesByIds(scheduleModel, [
            scheduleEntry.id
        ]);

        expect(afterDeleteScheduledEntry).toBeUndefined();

        const [afterActionTargetEntry] = await context.cms.getPublishedEntriesByIds(targetModel, [
            targetId
        ]);
        expect(afterActionTargetEntry).toMatchObject({
            id: targetId,
            values: {
                title: "Test Entry"
            },
            status: "published"
        });
    });

    it("should throw an error while handling action", async () => {
        const testContainer = context.container.createChildContainer();
        // Register a use case without actions
        testContainer.register(ProcessRecordsUseCase);
        testContainer.registerInstance(RecordAction, {
            canHandle: () => true,
            async handle(): Promise<void> {
                throw new Error("Unknown error.");
            }
        });

        const processRecords = testContainer.resolve(ProcessRecordsAbstraction);

        const targetModel = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const targetEntry = await context.cms.createEntry(targetModel, {
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
            const result = await processRecords.execute({
                [SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER]: {
                    id: createEventScheduleRecordId(targetId),
                    scheduleOn: new Date().toISOString()
                }
            });

            if (result.isFail()) {
                throw result.error;
            }

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
