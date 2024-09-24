import { TaskServicePlugin } from "~/plugins";

class MockTaskTriggerTransportPlugin extends TaskServicePlugin {
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

export const createMockTaskTriggerTransportPlugin = (): TaskServicePlugin => {
    return new MockTaskTriggerTransportPlugin({
        default: true
    });
};
