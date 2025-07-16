import { createMockService } from "~tests/mocks/service.js";
import { createMockGetIdentity } from "~tests/mocks/getIdentity.js";
import { createMockScheduleModel } from "~tests/mocks/scheduleModel.js";
import { createMockCms } from "~tests/mocks/cms.js";
import { createMockTargetModel } from "~tests/mocks/targetModel.js";
import { PublishScheduleAction } from "~/scheduler/actions/PublishScheduleAction.js";
import type { CmsEntry, CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { ScheduleRecord } from "~/scheduler/ScheduleRecord.js";
import type { IScheduleEntryValues } from "~/scheduler/types.js";
import { createScheduleRecordId } from "~/scheduler/createScheduleRecordId.js";

describe("PublishScheduleAction", () => {
    const service = createMockService();
    const getIdentity = createMockGetIdentity();
    const scheduleModel = createMockScheduleModel();
    const targetModel = createMockTargetModel();

    it("should schedule a publish action immediately", async () => {
        const cms = createMockCms({
            async getEntryById<T>() {
                return {
                    values: {
                        title: "Test Entry",
                        savedBy: getIdentity()
                    }
                } as CmsEntry<T>;
            },
            async publishEntry() {
                return {
                    savedBy: getIdentity(),
                    savedOn: new Date().toISOString()
                } as CmsEntry;
            }
        });

        const action = new PublishScheduleAction({
            service,
            getIdentity,
            targetModel,
            scheduleModel,
            cms
        });

        const result = await action.schedule({
            input: {
                immediately: true,
                type: "publish"
            },
            targetId: "target-id#0002",
            scheduleRecordId: createScheduleRecordId(`target-id#0002`)
        });

        expect(result).toBeInstanceOf(ScheduleRecord);
        expect(result).toEqual({
            id: createScheduleRecordId(`target-id#0002`),
            targetId: "target-id#0002",
            model: targetModel,
            scheduledBy: getIdentity(),
            publishOn: expect.any(Date),
            unpublishOn: undefined,
            type: "publish",
            title: "Test Entry"
        });
    });

    it("should publish an entry immediately if the dateOn is in the past", async () => {
        const updateEntryMock = jest.fn(async <T = CmsEntryValues>() => {
            return {} as CmsEntry<T>;
        });
        const cms = createMockCms({
            updateEntry: updateEntryMock,
            async getEntryById<T>() {
                return {
                    values: {
                        title: "Test Entry",
                        savedBy: getIdentity()
                    }
                } as CmsEntry<T>;
            },
            async publishEntry() {
                return {
                    savedBy: getIdentity(),
                    savedOn: new Date().toISOString()
                } as CmsEntry;
            }
        });

        const action = new PublishScheduleAction({
            service,
            getIdentity,
            targetModel,
            scheduleModel,
            cms
        });

        const dateOn = new Date(Date.now() - 1000000);
        const result = await action.schedule({
            input: {
                dateOn,
                type: "publish"
            },
            targetId: "target-id#0002",
            scheduleRecordId: createScheduleRecordId(`target-id#0002`)
        });

        expect(result).toBeInstanceOf(ScheduleRecord);
        expect(result).toEqual({
            id: createScheduleRecordId(`target-id#0002`),
            targetId: "target-id#0002",
            model: targetModel,
            scheduledBy: getIdentity(),
            publishOn: dateOn,
            unpublishOn: undefined,
            type: "publish",
            title: "Test Entry"
        });

        expect(updateEntryMock).toHaveBeenCalledTimes(1);
        expect(updateEntryMock).toHaveBeenCalledWith(targetModel, "target-id#0002", {
            firstPublishedBy: getIdentity(),
            firstPublishedOn: dateOn.toISOString(),
            lastPublishedBy: getIdentity(),
            lastPublishedOn: dateOn.toISOString()
        });
    });

    it("should schedule a publish action for a future date", async () => {
        const serviceCreate = jest.fn(async () => {});
        const service = createMockService({
            create: serviceCreate
        });
        const dateOn = new Date(Date.now() + 1000000);

        const crateEntryMock = jest.fn(async () => {
            // @ts-expect-error
            const entry: CmsEntry<IScheduleEntryValues> = {
                id: createScheduleRecordId(`target-id#0002`),
                values: {
                    targetId: "target-id#0002",
                    type: "publish",
                    dateOn: dateOn.toISOString(),
                    title: "Test Entry",
                    targetModelId: targetModel.modelId,
                    scheduledBy: getIdentity()
                },
                savedBy: getIdentity()
            };
            return entry;
        });
        const cms = createMockCms({
            // @ts-expect-error
            createEntry: crateEntryMock,
            async getEntryById<T>() {
                return {
                    values: {
                        title: "Test Entry",
                        savedBy: getIdentity()
                    }
                } as CmsEntry<T>;
            },
            async publishEntry() {
                return {
                    savedBy: getIdentity(),
                    savedOn: new Date().toISOString()
                } as CmsEntry;
            }
        });

        const action = new PublishScheduleAction({
            service,
            getIdentity,
            targetModel,
            scheduleModel,
            cms
        });

        const result = await action.schedule({
            input: {
                dateOn,
                type: "publish"
            },
            targetId: "target-id#0002",
            scheduleRecordId: createScheduleRecordId(`target-id#0002`)
        });

        expect(result).toBeInstanceOf(ScheduleRecord);
        expect(result).toEqual({
            id: createScheduleRecordId(`target-id#0002`),
            targetId: "target-id#0002",
            model: targetModel,
            scheduledBy: getIdentity(),
            publishOn: dateOn,
            unpublishOn: undefined,
            type: "publish",
            title: "Test Entry"
        });

        expect(crateEntryMock).toHaveBeenCalledTimes(1);
        expect(crateEntryMock).toHaveBeenCalledWith(scheduleModel, {
            id: createScheduleRecordId(`target-id#0002`),
            dateOn: dateOn.toISOString(),
            scheduledBy: getIdentity(),
            targetId: "target-id#0002",
            targetModelId: "targetModel",
            title: "Test Entry",
            type: "publish"
        });
    });
});
