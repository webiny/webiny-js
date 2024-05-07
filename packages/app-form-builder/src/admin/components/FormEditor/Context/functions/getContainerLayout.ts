import { FbFormModel, FbFormStep, DropDestination, DropSource } from "~/types";

interface ContainerLayoutParams {
    data: FbFormModel;
    destination: DropDestination;
    source: DropSource;
}
/*
    This is a helper function that gets layout from the container based on its type.
    * If "source" or "destination" is Condition Group then it would take layout from the settings of the Condition Group field.
    * If "source" or "destination" is Step that it would take layout from the step itself.
*/
export default (params: ContainerLayoutParams) => {
    const { data, destination, source } = params;

    const sourceContainer =
        source.containerType === "conditionGroup"
            ? (data.fields.find(field => field._id === source.containerId)?.settings as FbFormStep)
            : (data.steps.find(step => step.id === source.containerId) as FbFormStep);

    const destinationContainer =
        destination.containerType === "conditionGroup"
            ? (data.fields.find(field => field._id === destination.containerId)
                  ?.settings as FbFormStep)
            : (data.steps.find(step => step.id === destination.containerId) as FbFormStep);

    return {
        sourceContainer,
        destinationContainer
    };
};
