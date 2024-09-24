import { TaskServicePlugin } from "~/plugins";

class MockTaskTriggerTransportPlugin extends TaskServicePlugin {
    public override name = "mock-task-trigger-transport-plugin";
    public createService() {
        return {
            send: async () => {
                return {
                    mockedSend: true
                };
            }
        };
    }
}

export const createMockTaskTriggerTransportPlugin = (): TaskServicePlugin => {
    return new MockTaskTriggerTransportPlugin();
};
