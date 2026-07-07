import type { TaskService } from "~/api/domain/TaskService.js";

export const createMockTaskService = (): TaskService.Interface => {
    return {
        send: async () => {
            return {
                mockedSend: true
            };
        },
        fetch: async (input: any) => {
            return {
                fetched: true,
                input
            } as any;
        }
    };
};
