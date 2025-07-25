import { createMockService } from "~tests/mocks/service.js";
import { createMockGetIdentity } from "~tests/mocks/getIdentity.js";
import { createMockScheduleModel } from "~tests/mocks/scheduleModel.js";
import { createMockCms } from "~tests/mocks/cms.js";
import { createMockTargetModel } from "~tests/mocks/targetModel.js";
import { PublishScheduleAction } from "~/scheduler/actions/PublishScheduleAction.js";
import type { CmsEntry, CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { ScheduleRecord } from "~/scheduler/ScheduleRecord.js";
import { type IScheduleEntryValues, ScheduleType } from "~/scheduler/types.js";
import {
    createScheduleRecordId,
    createScheduleRecordIdWithVersion
} from "~/scheduler/createScheduleRecordId.js";
import { dateToISOString } from "~/scheduler/dates.js";
import { SchedulerService } from "~/service/SchedulerService.js";
import { CreateScheduleCommand, SchedulerClient } from "@webiny/aws-sdk/client-scheduler/index.js";
import { mockClient } from "aws-sdk-client-mock";
import { createMockFetcher } from "~tests/mocks/fetcher";

describe("PublishScheduleAction", () => {
    const service = createMockService();
    const fetcher = createMockFetcher();
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
            cms,
            fetcher
        });

        const result = await action.schedule({
            input: {
                immediately: true,
                type: ScheduleType.publish
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
            publishOn: expect.any(Date),
            unpublishOn: undefined,
            dateOn: expect.any(Date),
            type: ScheduleType.publish,
            title: "Test Entry"
        });
    });

    it("should publish an entry immediately if the scheduleOn is in the past", async () => {
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
            cms,
            fetcher
        });

        const scheduleOn = new Date(Date.now() - 1000000);
        const result = await action.schedule({
            input: {
                scheduleOn,
                type: ScheduleType.publish
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
            publishOn: expect.any(Date),
            unpublishOn: undefined,
            dateOn: undefined,
            type: ScheduleType.publish,
            title: "Test Entry"
        });

        expect(updateEntryMock).toHaveBeenCalledTimes(1);
        expect(updateEntryMock).toHaveBeenCalledWith(targetModel, "target-id#0002", {
            firstPublishedBy: getIdentity(),
            firstPublishedOn: scheduleOn.toISOString(),
            lastPublishedBy: getIdentity(),
            lastPublishedOn: scheduleOn.toISOString()
        });
    });

    it("should schedule a publish action for a future date", async () => {
        const client = mockClient(SchedulerClient);
        client.on(CreateScheduleCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });
        const service = new SchedulerService({
            getClient: () => client,
            config: {
                lambdaArn: "arn:aws:lambda:us-east-1:123456789012:function:my-function",
                roleArn: "arn:aws:iam::123456789012:role/my-role"
            }
        });
        const scheduleOn = new Date(Date.now() + 1000000);

        const crateEntryMock = jest.fn(async () => {
            const entry: Pick<CmsEntry<IScheduleEntryValues>, "id" | "values" | "savedBy"> = {
                id: createScheduleRecordIdWithVersion(`target-id#0002`),
                values: {
                    targetId: "target-id#0002",
                    type: ScheduleType.publish,
                    scheduledOn: dateToISOString(scheduleOn),
                    dateOn: dateToISOString(scheduleOn),
                    title: "Test Entry",
                    targetModelId: targetModel.modelId,
                    scheduledBy: getIdentity()
                },
                savedBy: getIdentity()
            };
            return entry as CmsEntry<IScheduleEntryValues>;
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
            cms,
            fetcher
        });

        const result = await action.schedule({
            input: {
                scheduleOn,
                type: ScheduleType.publish
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
            publishOn: scheduleOn,
            unpublishOn: undefined,
            dateOn: scheduleOn,
            type: ScheduleType.publish,
            title: "Test Entry"
        });

        expect(crateEntryMock).toHaveBeenCalledTimes(1);
        expect(crateEntryMock).toHaveBeenCalledWith(scheduleModel, {
            id: createScheduleRecordId(`target-id#0002`),
            dateOn: undefined,
            scheduledBy: getIdentity(),
            scheduledOn: dateToISOString(scheduleOn),
            targetId: "target-id#0002",
            targetModelId: "targetModel",
            title: "Test Entry",
            type: ScheduleType.publish
        });
    });
});
