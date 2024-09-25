import { EventBridgeEventTransportPlugin } from "./EventBridgeEventTransportPlugin";
import { StepFunctionServicePlugin } from "./StepFunctionServicePlugin";

export const createTransportPlugins = () => {
    return [
        new StepFunctionServicePlugin({ default: true }),
        new EventBridgeEventTransportPlugin()
    ];
};
