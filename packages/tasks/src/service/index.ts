import { EventBridgeEventTransportPlugin } from "./EventBridgeEventTransportPlugin";
import { StepFunctionServicePlugin } from "./StepFunctionServicePlugin";

export const createServicePlugins = () => {
    return [
        new StepFunctionServicePlugin({ default: true }),
        new EventBridgeEventTransportPlugin()
    ];
};

export * from "./createService";
