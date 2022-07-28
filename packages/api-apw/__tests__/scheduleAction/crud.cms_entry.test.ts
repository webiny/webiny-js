import useHandler from "./useHandler";
import { ApwContentTypes } from "~/types";
import {
    ApwScheduleAction,
    ApwScheduleActionCrud,
    ApwScheduleActionTypes
} from "~/scheduler/types";

const ONE_MINUTE = 1000 * 60;
const TIME_SEPARATOR = ":";

const getIsoStringTillMinutes = (datetime: string): string => {
    // "2022-03-08T05:41:13.230Z"
    return datetime.slice(0, datetime.lastIndexOf(TIME_SEPARATOR));
};

const MODEL_ID = "testModelId";

const EXPECTED_APW_SCHEDULED_ACTION_DATA = expect.objectContaining({
    datetime: expect.stringMatching(/^20/),
    type: ApwContentTypes.CMS_ENTRY,
    action: ApwScheduleActionTypes.PUBLISH,
    entryId: expect.any(String),
    modelId: MODEL_ID
});

describe("Schedule action CRUD Test - CMS Entry type", () => {
    const { handler } = useHandler();

    test("Should able to create, update, list, get and delete schedule action items", async () => {
        const context = await handler();
        const scheduleActionCrud: ApwScheduleActionCrud = context.scheduleAction;
        /**
         * Let's create one schedule action item.
         */
        const scheduledAction = await scheduleActionCrud.create({
            datetime: new Date().toISOString(),
            action: ApwScheduleActionTypes.PUBLISH,
            type: ApwContentTypes.CMS_ENTRY,
            entryId: "62303be79cfe6e0009d8d9cf#0001",
            modelId: MODEL_ID
        });
        expect(scheduledAction).toEqual({
            id: expect.any(String),
            createdOn: expect.stringMatching(/^20/),
            savedOn: expect.stringMatching(/^20/),
            createdBy: expect.any(Object),
            tenant: expect.any(String),
            locale: expect.any(String),
            data: EXPECTED_APW_SCHEDULED_ACTION_DATA
        });

        /**
         * Should able to get schedule action item by id.
         */
        const getItemResult = await scheduleActionCrud.get(scheduledAction.id);
        expect(getItemResult).toEqual({
            id: expect.any(String),
            createdOn: expect.stringMatching(/^20/),
            savedOn: expect.stringMatching(/^20/),
            createdBy: expect.any(Object),
            tenant: expect.any(String),
            locale: expect.any(String),
            data: EXPECTED_APW_SCHEDULED_ACTION_DATA
        });

        /**
         * Should able to list schedule action items.
         */
        const [listItemResult, meta] = await scheduleActionCrud.list({ where: {} });
        expect(listItemResult).toEqual([
            {
                id: expect.any(String),
                createdOn: expect.stringMatching(/^20/),
                savedOn: expect.stringMatching(/^20/),
                createdBy: expect.any(Object),
                tenant: expect.any(String),
                locale: expect.any(String),
                data: EXPECTED_APW_SCHEDULED_ACTION_DATA
            }
        ]);
        expect(meta).toEqual({
            hasMoreItems: false,
            totalCount: 1,
            cursor: expect.any(String)
        });

        /**
         * Doing partial update should return an error.
         */
        let updateItemResultWithError;
        try {
            // @ts-ignore
            updateItemResultWithError = await scheduleActionCrud.update(scheduledAction.id, {
                action: ApwScheduleActionTypes.UNPUBLISH
            });
        } catch (e) {
            expect(e.message).toBe("Validation failed.");
            expect(updateItemResultWithError).toBe(undefined);
        }

        /**
         * Should able to update a schedule action item.
         */
        const updateItemResult = await scheduleActionCrud.update(scheduledAction.id, {
            datetime: new Date().toISOString(),
            action: ApwScheduleActionTypes.UNPUBLISH,
            type: ApwContentTypes.CMS_ENTRY,
            entryId: "62303be79cfe6e0009d8d9cf#0001",
            modelId: MODEL_ID
        });
        expect(updateItemResult).toEqual({
            id: expect.any(String),
            createdOn: expect.stringMatching(/^20/),
            savedOn: expect.stringMatching(/^20/),
            createdBy: expect.any(Object),
            tenant: expect.any(String),
            locale: expect.any(String),
            data: EXPECTED_APW_SCHEDULED_ACTION_DATA
        });

        /**
         * Should able to delete a schedule action item by id.
         */
        const deleteItemResult = await scheduleActionCrud.delete(scheduledAction.id);
        expect(deleteItemResult).toBe(true);

        /**
         * Should not be able to get schedule action item by id.
         */
        const notFoundResult = await scheduleActionCrud.get(scheduledAction.id);
        expect(notFoundResult).toBe(null);

        /**
         * Should return empty list in case of no schedule action items.
         */
        const [listItemEmptyResult, listItemEmptyMeta] = await scheduleActionCrud.list({
            where: {}
        });
        expect(listItemEmptyResult).toEqual([]);
        expect(listItemEmptyMeta).toEqual({
            hasMoreItems: false,
            totalCount: 0,
            cursor: null
        });
    });

    test("Should able to sort schedule action items by datetime", async () => {
        const context = await handler();
        const scheduleActionCrud: ApwScheduleActionCrud = context.scheduleAction;
        /**
         * Let's create five schedule action item.
         */
        const scheduledActions = [];
        for (let i = 0; i < 5; i++) {
            const now = new Date().getTime() + 1000;
            const scheduledAction = await scheduleActionCrud.create({
                datetime: new Date(now).toISOString(),
                action: ApwScheduleActionTypes.PUBLISH,
                type: ApwContentTypes.CMS_ENTRY,
                entryId: "62303be79cfe6e0009d8d9cf#0001",
                modelId: MODEL_ID
            });
            scheduledActions.push(scheduledAction);
        }

        /**
         * Should able to list schedule action items.
         */
        const [listItemResult, meta] = await scheduleActionCrud.list({ where: {} });
        expect(listItemResult).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    createdOn: expect.stringMatching(/^20/),
                    savedOn: expect.stringMatching(/^20/),
                    createdBy: expect.any(Object),
                    tenant: expect.any(String),
                    locale: expect.any(String),
                    data: EXPECTED_APW_SCHEDULED_ACTION_DATA
                })
            ])
        );
        expect(meta).toEqual({
            hasMoreItems: false,
            totalCount: 5,
            cursor: expect.any(String)
        });
        /**
         * Sorted by datetime(ISO string) in ascending order.
         */
        for (let i = 0; i < listItemResult.length - 1; i++) {
            const currentItem = listItemResult[i];
            const nextItem = listItemResult[i + 1];
            expect(currentItem.data.datetime < nextItem.data.datetime).toBe(true);
        }

        /**
         * Should able to list schedule action items in descending order of datetime.
         */
        const [listItemDescendingResult, listItemDescendingMeta] = await scheduleActionCrud.list({
            where: {},
            sort: ["datetime_DESC"]
        });
        expect(listItemDescendingResult).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    createdOn: expect.stringMatching(/^20/),
                    savedOn: expect.stringMatching(/^20/),
                    createdBy: expect.any(Object),
                    tenant: expect.any(String),
                    locale: expect.any(String),
                    data: EXPECTED_APW_SCHEDULED_ACTION_DATA
                })
            ])
        );
        expect(listItemDescendingMeta).toEqual({
            hasMoreItems: false,
            totalCount: 5,
            cursor: expect.any(String)
        });

        /**
         * Sorted by datetime(ISO string) in ascending order.
         */
        for (let i = 0; i < listItemDescendingResult.length - 1; i++) {
            const currentItem = listItemDescendingResult[i];
            const nextItem = listItemDescendingResult[i + 1];
            expect(currentItem.data.datetime > nextItem.data.datetime).toBe(true);
        }
    });

    test("Should able to get all schedule action items with same datetime", async () => {
        const context = await handler();
        const scheduleActionCrud: ApwScheduleActionCrud = context.scheduleAction;
        /**
         * Let's create five schedule action item.
         */
        const scheduledActions: ApwScheduleAction[] = [];
        for (let i = 0; i < 5; i++) {
            let now = new Date().getTime();
            if (i % 2 === 0) {
                now += ONE_MINUTE;
            }
            const scheduledAction = await scheduleActionCrud.create({
                datetime: new Date(now).toISOString(),
                action: ApwScheduleActionTypes.PUBLISH,
                type: ApwContentTypes.CMS_ENTRY,
                entryId: "62303be79cfe6e0009d8d9cf#0001",
                modelId: MODEL_ID
            });
            scheduledActions.push(scheduledAction);
        }

        const [firstAction, secondAction] = scheduledActions;
        const firstDateTime = getIsoStringTillMinutes(firstAction.data.datetime);
        const secondDateTime = getIsoStringTillMinutes(secondAction.data.datetime);

        /**
         * Should able to list schedule action items by datetime.
         */
        const [listItemFirstDateResult] = await scheduleActionCrud.list({
            where: { datetime_startsWith: firstDateTime }
        });
        expect(listItemFirstDateResult).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    createdOn: expect.stringMatching(/^20/),
                    savedOn: expect.stringMatching(/^20/),
                    createdBy: expect.any(Object),
                    tenant: expect.any(String),
                    locale: expect.any(String),
                    data: EXPECTED_APW_SCHEDULED_ACTION_DATA
                })
            ])
        );
        expect(listItemFirstDateResult.length).toBe(3);

        /**
         * Should able to list schedule action items datetime.
         */
        const [listItemSecondDateResult] = await scheduleActionCrud.list({
            where: { datetime_startsWith: secondDateTime }
        });
        expect(listItemSecondDateResult).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    createdOn: expect.stringMatching(/^20/),
                    savedOn: expect.stringMatching(/^20/),
                    createdBy: expect.any(Object),
                    tenant: expect.any(String),
                    locale: expect.any(String),
                    data: EXPECTED_APW_SCHEDULED_ACTION_DATA
                })
            ])
        );
        expect(listItemSecondDateResult.length).toBe(2);
    });

    test("Should able to get and update current  schedule action item", async () => {
        const context = await handler();
        const scheduleActionCrud: ApwScheduleActionCrud = context.scheduleAction;
        /**
         * Let's create two schedule action item.
         */
        const TOTAL = 2;
        const scheduledActions: ApwScheduleAction[] = [];
        for (let i = 0; i < TOTAL; i++) {
            let now = new Date().getTime();
            if (i % 2 === 0) {
                now += ONE_MINUTE;
            }
            const scheduledAction = await scheduleActionCrud.create({
                datetime: new Date(now).toISOString(),
                action: ApwScheduleActionTypes.PUBLISH,
                type: ApwContentTypes.CMS_ENTRY,
                entryId: "62303be79cfe6e0009d8d9cf#0001",
                modelId: MODEL_ID
            });
            scheduledActions.push(scheduledAction);
        }

        /**
         * Should able to list schedule action items by datetime.
         */
        const [listItemResult] = await scheduleActionCrud.list({
            where: {}
        });
        expect(listItemResult).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    createdOn: expect.stringMatching(/^20/),
                    savedOn: expect.stringMatching(/^20/),
                    createdBy: expect.any(Object),
                    tenant: expect.any(String),
                    locale: expect.any(String),
                    data: EXPECTED_APW_SCHEDULED_ACTION_DATA
                })
            ])
        );
        expect(listItemResult.length).toBe(TOTAL);

        /**
         * Should return null as currentTask
         */
        const currentTaskNull = await scheduleActionCrud.getCurrentTask();
        expect(currentTaskNull).toBe(null);

        const [firstAction, secondAction] = scheduledActions;

        /**
         * Let's set the currentTask for the very first time.
         */
        await scheduleActionCrud.updateCurrentTask(firstAction);

        /**
         * Now we should have it.
         */
        const currentTaskFirstAction = await scheduleActionCrud.getCurrentTask();
        if (currentTaskFirstAction) {
            expect(currentTaskFirstAction.id).toBe(firstAction.id);
        }

        /**
         * Let's set the currentTask for the very first time.
         */
        await scheduleActionCrud.updateCurrentTask(secondAction);

        /**
         * Now we should have it.
         */
        const currentTaskSecondAction = await scheduleActionCrud.getCurrentTask();
        if (currentTaskSecondAction) {
            expect(currentTaskSecondAction.id).toBe(secondAction.id);
        }

        /**
         * Let's delete the current task.
         */
        const deleteCurrentTask = await scheduleActionCrud.deleteCurrentTask();
        expect(deleteCurrentTask).toBe(true);

        /**
         * Now we should not have it.
         */
        const currentTaskNoTasks = await scheduleActionCrud.getCurrentTask();
        expect(currentTaskNoTasks).toBe(null);
    });

    test("Validation should fail when modelId is not sent", async () => {
        const context = await handler();
        const scheduleActionCrud: ApwScheduleActionCrud = context.scheduleAction;

        let ex: Error | null = null;

        try {
            await scheduleActionCrud.create({
                datetime: new Date().toISOString(),
                action: ApwScheduleActionTypes.PUBLISH,
                type: ApwContentTypes.CMS_ENTRY,
                entryId: "62303be79cfe6e0009d8d9cf#0001"
            });
        } catch (er) {
            ex = er;
        }
        /**
         * Let's create one schedule action item.
         */
        expect(ex).toBeInstanceOf(Error);
        expect(ex?.message).toEqual("Validation failed.");
    });
});
