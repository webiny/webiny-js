import { TaskServicePlugin } from "~/plugins";

class MockTaskServicePlugin extends TaskServicePlugin {
    public override name = "mock-task-trigger-transport-plugin";
    public createService() {
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
    }
}

export const createMockTaskServicePlugin = (): TaskServicePlugin => {
    return new MockTaskServicePlugin({
        default: true
    });
};
