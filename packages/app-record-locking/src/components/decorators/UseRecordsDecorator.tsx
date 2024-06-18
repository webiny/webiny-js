import { useRecords } from "@webiny/app-aco";

/**
 * When record locking mechanism is checking for records equality, it compares record `id` and `savedOn`.
 * When you're updating ACO cache, you're just passing the new content entry value(s), and sometimes you might
 * be doing it without the `savedOn`, and that causes record locking to keep its old state.
 *
 * This decorator ensures that calls to `updateRecordInCache` always include a `savedOn` timestamp.
 */
export const UseRecordsDecorator = useRecords.createDecorator(baseHook => {
    return (folderId?: string) => {
        const hook = baseHook(folderId);

        return {
            ...hook,
            updateRecordInCache(record: any) {
                hook.updateRecordInCache({
                    ...record,
                    savedOn: new Date().toISOString()
                });
            }
        };
    };
});
