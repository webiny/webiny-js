import { EventBridgeEventTransportPlugin } from "./EventBridgeEventTransportPlugin.js";
import { StepFunctionServicePlugin } from "./StepFunctionServicePlugin.js";

export const createServicePlugins = () => {
    return [
        new StepFunctionServicePlugin({ default: true }),
        new EventBridgeEventTransportPlugin()
    ];
};

export * from "./createService.js";
