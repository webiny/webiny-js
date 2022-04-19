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

const EXPECTED_APW_SCHEDULED_ACTION_DATA = expect.objectContaining({
    datetime: expect.stringMatching(/^20/),
    type: "page",
    action: "publish",
    entryId: expect.any(String)
});

describe("Schedule action CRUD Test", () => {
    const { handler } = useHandler();

    test("Should able to create, update, list, get and delete  schedule action items", async () => {
        const context = await handler();
        const scheduleActionCrud: ApwScheduleActionCrud = context.scheduleAction;
        /**
         * Let's create one schedule action item.
         */
        const scheduledAction = await scheduleActionCrud.create({
            datetime: new Date().toISOString(),
            action: ApwScheduleActionTypes.PUBLISH,
            type: ApwContentTypes.PAGE,
            entryId: "62303be79cfe6e0009d8d9cf#0001"
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
        let [listItemResult, meta] = await scheduleActionCrud.list({ where: {} });
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
        let updateItemResult;
        try {
            // @ts-ignore
            updateItemResult = await scheduleActionCrud.update(scheduledAction.id, {
                action: ApwScheduleActionTypes.UNPUBLISH
            });
        } catch (e) {
            expect(e.message).toBe("Validation failed.");
            expect(updateItemResult).toBe(undefined);
        }

        /**
         * Should able to update a schedule action item.
         */
        updateItemResult = await scheduleActionCrud.update(scheduledAction.id, {
            datetime: new Date().toISOString(),
            action: ApwScheduleActionTypes.UNPUBLISH,
            type: ApwContentTypes.PAGE,
            entryId: "62303be79cfe6e0009d8d9cf#0001"
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
        [listItemResult, meta] = await scheduleActionCrud.list({ where: {} });
        expect(listItemResult).toEqual([]);
        expect(meta).toEqual({
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
                type: ApwContentTypes.PAGE,
                entryId: "62303be79cfe6e0009d8d9cf#0001"
            });
            scheduledActions.push(scheduledAction);
        }

        /**
         * Should able to list schedule action items.
         */
        let [listItemResult, meta] = await scheduleActionCrud.list({ where: {} });
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
        [listItemResult, meta] = await scheduleActionCrud.list({
            where: {},
            sort: "datetime_DESC"
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
                type: ApwContentTypes.PAGE,
                entryId: "62303be79cfe6e0009d8d9cf#0001"
            });
            scheduledActions.push(scheduledAction);
        }

        const [firstAction, secondAction] = scheduledActions;
        const firstDateTime = getIsoStringTillMinutes(firstAction.data.datetime);
        const secondDateTime = getIsoStringTillMinutes(secondAction.data.datetime);

        /**
         * Should able to list schedule action items by datetime.
         */
        let [listItemResult] = await scheduleActionCrud.list({
            where: { datetime_startsWith: firstDateTime }
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
        expect(listItemResult.length).toBe(3);

        /**
         * Should able to list schedule action items datetime.
         */
        [listItemResult] = await scheduleActionCrud.list({
            where: { datetime_startsWith: secondDateTime }
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
        expect(listItemResult.length).toBe(2);
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
                type: ApwContentTypes.PAGE,
                entryId: "62303be79cfe6e0009d8d9cf#0001"
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
        let currentTask = await scheduleActionCrud.getCurrentTask();
        expect(currentTask).toBe(null);

        const [firstAction, secondAction] = scheduledActions;

        /**
         * Let's set the currentTask for the very first time.
         */
        await scheduleActionCrud.updateCurrentTask(firstAction);

        /**
         * Now we should have it.
         */
        currentTask = await scheduleActionCrud.getCurrentTask();
        if (currentTask) {
            expect(currentTask.id).toBe(firstAction.id);
        }

        /**
         * Let's set the currentTask for the very first time.
         */
        await scheduleActionCrud.updateCurrentTask(secondAction);

        /**
         * Now we should have it.
         */
        currentTask = await scheduleActionCrud.getCurrentTask();
        if (currentTask) {
            expect(currentTask.id).toBe(secondAction.id);
        }

        /**
         * Let's delete the current task.
         */
        const deleteCurrentTask = await scheduleActionCrud.deleteCurrentTask();
        expect(deleteCurrentTask).toBe(true);

        /**
         * Now we should not have it.
         */
        currentTask = await scheduleActionCrud.getCurrentTask();
        expect(currentTask).toBe(null);
    });
});
