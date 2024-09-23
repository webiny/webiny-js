import { StepFunctionTriggerTransportPlugin } from "./StepFunctionTriggerTransportPlugin";

export const createTransportPlugins = () => {
    return [
        new StepFunctionTriggerTransportPlugin()
        //    ,new EventBridgeEventTransportPlugin(),
    ];
};
