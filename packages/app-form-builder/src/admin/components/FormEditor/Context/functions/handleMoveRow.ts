import { FbFormModel, DropDestination, DropSource } from "~/types";
import { moveRow, moveRowBetween, getContainerLayout } from "./index";

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
        /* 
            This condition should cover such cases:
            1) When we move rows in scope of one Step;
            2) When we move rows in scope of one Condition Group.
            ----------------------------------------------------------------
        */
        const { sourceContainer } = getContainerLayout({ data, source, destination });
        if (sourceContainer) {
            moveRow({
                sourceRow,
                destinationRow,
                sourceContainer
            });
        }
    } else {
        /* 
            This condition should cover such cases:
            1) When we move rows in scope of two different Steps
            2) When we move rows in scope of two different Condition Groups.
            ----------------------------------------------------------------
        */
        const { sourceContainer, destinationContainer } = getContainerLayout({
            data,
            source,
            destination
        });
        moveRowBetween({
            sourceContainer,
            destinationContainer,
            sourceRow,
            destinationRow
        });
    }
};
