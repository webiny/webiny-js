import {
    ITaskTriggerTransport,
    TaskTriggerTransportPlugin
} from "@webiny/tasks/plugins/TaskTriggerTransportPlugin";

class MockTaskTriggerTransportPlugin extends TaskTriggerTransportPlugin {
    public override name = "tasks.mockTaskTriggerTransport";

    override createTransport(): ITaskTriggerTransport {
        return {
            async send() {
                return {
                    Entries: [],
                    $metadata: {},
                    FailedEntryCount: 0
                };
            }
        };
    }
}

export const createMockTaskTriggerTransportPlugin = () => {
    return [new MockTaskTriggerTransportPlugin()];
};
