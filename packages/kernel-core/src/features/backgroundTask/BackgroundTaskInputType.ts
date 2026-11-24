import { InputType } from "~/features/events/InputType.js";
import type { IInputType } from "~/features/events/InputType.js";
import { BackgroundTaskInputHandler } from "./BackgroundTaskInputHandler.js";

export interface IBackgroundTaskEvent {
    webinyTaskId: string;
    webinyTaskDefinitionId: string;
    tenant: string;
    endpoint: string;
    executionName: string;
    stateMachineId: string;
    delay?: number;
}

class BackgroundTaskInputTypeImpl implements IInputType<IBackgroundTaskEvent> {
    matches(input: any): input is IBackgroundTaskEvent {
        // The Step Functions / EventBridge transport delivers the task wrapped as
        // `{ name: "background-task", payload: { webinyTaskId, ... } }` (see the bg-task SFN ASL
        // definition in project-aws). Unwrap `payload` if present; also accept an already-flat input
        // defensively so direct invokes still work.
        const e = input?.payload ?? input;
        return !!(e?.webinyTaskId && e?.webinyTaskDefinitionId && e?.tenant);
    }

    getHandlerAbstraction() {
        return BackgroundTaskInputHandler;
    }
}

export const BackgroundTaskInputType = InputType.createImplementation({
    implementation: BackgroundTaskInputTypeImpl,
    dependencies: []
});
