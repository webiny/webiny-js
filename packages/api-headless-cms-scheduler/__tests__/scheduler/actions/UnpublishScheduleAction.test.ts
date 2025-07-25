import { createMockService } from "~tests/mocks/service.js";
import { createMockGetIdentity } from "~tests/mocks/getIdentity.js";
import { createMockScheduleModel } from "~tests/mocks/scheduleModel.js";
import { createMockCms } from "~tests/mocks/cms.js";
import { createMockTargetModel } from "~tests/mocks/targetModel.js";
import { UnpublishScheduleAction } from "~/scheduler/actions/UnpublishScheduleAction.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { ScheduleRecord } from "~/scheduler/ScheduleRecord.js";
import { type IScheduleEntryValues, ScheduleType } from "~/scheduler/types.js";
import {
    createScheduleRecordId,
    createScheduleRecordIdWithVersion
} from "~/scheduler/createScheduleRecordId.js";
import { mockClient } from "aws-sdk-client-mock";
import { dateToISOString } from "~/scheduler/dates.js";
import { CreateScheduleCommand, SchedulerClient } from "@webiny/aws-sdk/client-scheduler/index.js";
import { SchedulerService } from "~/service/SchedulerService.js";
import { createMockFetcher } from "~tests/mocks/fetcher.js";

describe("UnpublishScheduleAction", () => {
    const service = createMockService();
    const fetcher = createMockFetcher();
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
            cms,
            fetcher
        });

        const result = await action.schedule({
            input: {
                immediately: true,
                type: ScheduleType.unpublish
            },
            targetId: "target-id#0002",
            scheduleRecordId: createScheduleRecordIdWithVersion(`target-id#0002`)
        });

        expect(result).toBeInstanceOf(ScheduleRecord);
        expect(result).toEqual({
            id: createScheduleRecordIdWithVersion(`target-id#0002`),
            targetId: "target-id#0002",
            model: targetModel,
            scheduledBy: getIdentity(),
            dateOn: expect.any(Date),
            publishOn: undefined,
            unpublishOn: expect.any(Date),
            type: ScheduleType.unpublish,
            title: "Test Entry"
        });
    });

    it("should unpublish an entry immediately if the scheduleOn is in the past", async () => {
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
            cms,
            fetcher
        });

        const scheduleOn = new Date(Date.now() - 1000000);
        const result = await action.schedule({
            input: {
                scheduleOn,
                type: ScheduleType.unpublish
            },
            targetId: "target-id#0002",
            scheduleRecordId: createScheduleRecordIdWithVersion(`target-id#0002`)
        });

        expect(result).toBeInstanceOf(ScheduleRecord);
        expect(result).toEqual({
            id: createScheduleRecordIdWithVersion(`target-id#0002`),
            targetId: "target-id#0002",
            model: targetModel,
            scheduledBy: getIdentity(),
            publishOn: undefined,
            unpublishOn: scheduleOn,
            dateOn: undefined,
            type: ScheduleType.unpublish,
            title: "Test Entry"
        });
    });

    it("should schedule an unpublish action for a future date", async () => {
        const client = mockClient(SchedulerClient);
        client.on(CreateScheduleCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const service = new SchedulerService({
            getClient: () => client,
            config: {
                roleArn: "arn:aws:iam::123456789012:role/scheduler-role",
                lambdaArn: "arn:aws:lambda:us-east-1:123456789012:function:scheduler-lambda"
            }
        });

        const scheduleOn = new Date(Date.now() + 1000000);

        const createEntryMock = jest.fn(async () => {
            const entry: Pick<CmsEntry<IScheduleEntryValues>, "id" | "values" | "savedBy"> = {
                id: createScheduleRecordIdWithVersion(`target-id#0002`),
                values: {
                    targetId: "target-id#0002",
                    type: ScheduleType.unpublish,
                    scheduledOn: dateToISOString(scheduleOn),
                    dateOn: dateToISOString(scheduleOn),
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
            cms,
            fetcher
        });

        const result = await action.schedule({
            input: {
                scheduleOn: scheduleOn,
                type: ScheduleType.unpublish
            },
            targetId: "target-id#0002",
            scheduleRecordId: createScheduleRecordIdWithVersion(`target-id#0002`)
        });

        expect(result).toBeInstanceOf(ScheduleRecord);
        expect(result).toEqual({
            id: createScheduleRecordIdWithVersion(`target-id#0002`),
            targetId: "target-id#0002",
            model: targetModel,
            scheduledBy: getIdentity(),
            publishOn: undefined,
            unpublishOn: scheduleOn,
            dateOn: scheduleOn,
            type: ScheduleType.unpublish,
            title: "Test Entry"
        });

        expect(createEntryMock).toHaveBeenCalledTimes(1);
        expect(createEntryMock).toHaveBeenCalledWith(scheduleModel, {
            id: createScheduleRecordId(`target-id#0002`),
            dateOn: undefined,
            scheduledOn: scheduleOn.toISOString(),
            scheduledBy: getIdentity(),
            targetId: "target-id#0002",
            targetModelId: "targetModel",
            title: "Test Entry",
            type: ScheduleType.unpublish
        });
    });
});
