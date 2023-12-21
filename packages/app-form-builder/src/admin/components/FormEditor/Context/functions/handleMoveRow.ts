import { FbFormModel, FbFormStep, DropSource, DropDestination } from "~/types";
import moveRow from "./handleMoveRow/moveRow";
import moveRowBetween from "./handleMoveRow/moveRowBetween";

interface HandleMoveRowParams {
    data: FbFormModel;
    source: DropSource;
    destination: DropDestination;
    sourceRow: number;
    destinationRow: number;
}

export default ({
    data,
    sourceRow,
    destinationRow,
    source,
    destination
}: HandleMoveRowParams): void => {
    if (source.containerId === destination.containerId) {
        // This condition should cover:
        // 1. When we move rows in scope of one Step;
        // 2. When we move rows in scope of one Condition Group (Condition Group yet to be implemented).
        const sourceContainer = data.steps.find(
            step => step.id === source.containerId
        ) as FbFormStep;
        moveRow({
            sourceRow,
            destinationRow,
            sourceContainer
        });
    } else {
        // This condition should cover:
        // 1. When we move rows in scope of two different Steps;
        // 2. When we move rows in scope of two different Condition Groups (Condition Group yet to be implemented).
        const sourceContainer = data.steps.find(
            step => step.id === source.containerId
        ) as FbFormStep;
        const destinationContainer = data.steps.find(
            step => step.id === destination.containerId
        ) as FbFormStep;
        moveRowBetween({
            sourceContainer,
            destinationContainer,
            sourceRow,
            destinationRow
        });
    }
};
