import { ITaskService, TaskServicePlugin } from "@webiny/tasks/plugins/TaskServicePlugin";

class MockTaskServicePlugin extends TaskServicePlugin {
    public override name = "tasks.mockTaskService";

    public override createService(): ITaskService {
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
    }
}

export const createMockTaskServicePlugin = () => {
    return [
        new MockTaskServicePlugin({
            default: true
        })
    ];
};
