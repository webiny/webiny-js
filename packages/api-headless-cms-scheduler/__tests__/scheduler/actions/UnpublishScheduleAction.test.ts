import { createMockService } from "~tests/mocks/service.js";
import { createMockGetIdentity } from "~tests/mocks/getIdentity.js";
import { createMockScheduleModel } from "~tests/mocks/scheduleModel.js";
import { createMockCms } from "~tests/mocks/cms.js";
import { createMockTargetModel } from "~tests/mocks/targetModel.js";
import { UnpublishScheduleAction } from "~/scheduler/actions/UnpublishScheduleAction.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { ScheduleRecord } from "~/scheduler/ScheduleRecord.js";
import type { IScheduleEntryValues } from "~/scheduler/types.js";
import { createScheduleRecordId } from "~/scheduler/createScheduleRecordId.js";

describe("UnpublishScheduleAction", () => {
    const service = createMockService();
    const getIdentity = createMockGetIdentity();
    const scheduleModel = createMockScheduleModel();
    const targetModel = createMockTargetModel();

    it("should unpublish an entry immediately if input.immediately is true", async () => {
        const cms = createMockCms({
            async getEntryById<T>() {
                return {
                    values: {
                        title: "Test Entry",
                        savedBy: getIdentity()
                    }
                } as CmsEntry<T>;
            },
            async unpublishEntry() {
                return {
                    savedBy: getIdentity(),
                    savedOn: new Date().toISOString()
                } as CmsEntry;
            }
        });

        const action = new UnpublishScheduleAction({
            service,
            getIdentity,
            targetModel,
            scheduleModel,
            cms
        });

        const result = await action.schedule({
            input: {
                immediately: true,
                type: "unpublish"
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
            publishOn: undefined,
            unpublishOn: expect.any(Date),
            type: "unpublish",
            title: "Test Entry"
        });
    });

    it("should unpublish an entry immediately if the dateOn is in the past", async () => {
        const cms = createMockCms({
            async getEntryById<T>() {
                return {
                    values: {
                        title: "Test Entry",
                        savedBy: getIdentity()
                    }
                } as CmsEntry<T>;
            },
            async unpublishEntry() {
                return {
                    savedBy: getIdentity(),
                    savedOn: new Date().toISOString()
                } as CmsEntry;
            }
        });

        const action = new UnpublishScheduleAction({
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
                type: "unpublish"
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
            publishOn: undefined,
            unpublishOn: dateOn,
            type: "unpublish",
            title: "Test Entry"
        });
    });

    it("should schedule an unpublish action for a future date", async () => {
        const serviceCreate = jest.fn(async () => {});
        const service = createMockService({
            create: serviceCreate
        });
        const dateOn = new Date(Date.now() + 1000000);

        const createEntryMock = jest.fn(async () => {
            // @ts-expect-error
            const entry: CmsEntry<IScheduleEntryValues> = {
                id: createScheduleRecordId(`target-id#0002`),
                values: {
                    targetId: "target-id#0002",
                    type: "unpublish",
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
            createEntry: createEntryMock,
            async getEntryById<T>() {
                return {
                    values: {
                        title: "Test Entry",
                        savedBy: getIdentity()
                    }
                } as CmsEntry<T>;
            },
            async unpublishEntry() {
                return {
                    savedBy: getIdentity(),
                    savedOn: new Date().toISOString()
                } as CmsEntry;
            }
        });

        const action = new UnpublishScheduleAction({
            service,
            getIdentity,
            targetModel,
            scheduleModel,
            cms
        });

        const result = await action.schedule({
            input: {
                dateOn,
                type: "unpublish"
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
            publishOn: undefined,
            unpublishOn: dateOn,
            type: "unpublish",
            title: "Test Entry"
        });

        expect(createEntryMock).toHaveBeenCalledTimes(1);
        expect(createEntryMock).toHaveBeenCalledWith(scheduleModel, {
            id: createScheduleRecordId(`target-id#0002`),
            dateOn: dateOn.toISOString(),
            scheduledBy: getIdentity(),
            targetId: "target-id#0002",
            targetModelId: "targetModel",
            title: "Test Entry",
            type: "unpublish"
        });
    });
});
