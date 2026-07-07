import type { TaskService } from "@webiny/background-tasks/api/domain/TaskService";

export const createMockTaskService = (): TaskService.Interface => {
    return {
        async send() {
            return {
                Entries: [],
                $metadata: {},
                FailedEntryCount: 0
            };
        },
        async fetch(input: any) {
            return {
                fetched: true,
                input
            } as any;
        }
    };
};
