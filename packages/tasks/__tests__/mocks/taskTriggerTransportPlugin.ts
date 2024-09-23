import { TaskTriggerTransportPlugin } from "~/plugins";

class MockTaskTriggerTransportPlugin extends TaskTriggerTransportPlugin {
    public override name = "mock-task-trigger-transport-plugin";
    public createTransport() {
        return {
            send: async () => {
                return {
                    mockedSend: true
                };
            }
        };
    }
}

export const createMockTaskTriggerTransportPlugin = (): TaskTriggerTransportPlugin => {
    return new MockTaskTriggerTransportPlugin();
};
