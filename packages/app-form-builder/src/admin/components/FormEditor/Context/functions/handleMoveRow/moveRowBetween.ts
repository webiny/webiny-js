import { FbFormStep } from "~/types";

interface MoveRowBetweenParams {
    sourceContainer: FbFormStep;
    destinationContainer: FbFormStep;
    sourceRow: number;
    destinationRow: number;
}

export default ({
    sourceContainer,
    destinationContainer,
    sourceRow,
    destinationRow
}: MoveRowBetweenParams) => {
    destinationContainer.layout.splice(
        destinationRow,
        0,
        sourceContainer?.layout[sourceRow] as string[]
    );
    sourceContainer.layout = [
        ...sourceContainer.layout.slice(0, sourceRow),
        ...sourceContainer.layout.slice(sourceRow + 1)
    ];
};
