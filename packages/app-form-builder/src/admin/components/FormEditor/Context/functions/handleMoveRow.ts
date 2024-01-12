import { FbFormModel, DropSource, DropDestination } from "~/types";
import { getContainerLayout } from "./index";
import moveRow from "./handleMoveRow/moveRow";
import moveRowBetween from "./handleMoveRow/moveRowBetween";

interface HandleMoveRowParams {
    data: FbFormModel;
    source: DropSource;
    destination: DropDestination;
    sourceRow: number;
    destinationRow: number;
}
// The difference between moving row between steps, step and condition group or between two condition groups:
// * When we move row between steps we are going to change property "layout" of those steps.
// * When we move row between step and condition group we are going to change property "layout" of step and the property "layout" of the Condition Group.
// * When we move row between condition groups we are going to change property "layout" of those condition groups and we don't need information about steps in which those,
// those condition groups are being stored, because we are not affecting layout of steps in this case.
export default ({
    data,
    sourceRow,
    destinationRow,
    source,
    destination
}: HandleMoveRowParams): void => {
    if (source.containerId === destination.containerId) {
        // This condition should cover such cases:
        // 1) When we move rows in scope of one Step;
        // 2) When we move rows in scope of one Condition Group
        const { sourceContainer } = getContainerLayout({ data, source, destination });
        if (sourceContainer) {
            moveRow({
                sourceRow,
                destinationRow,
                sourceContainer
            });
        }
    } else {
        // This condition should cover such cases:
        // 1) When we move rows in scope of two different Steps
        // 2) When we move rows in scope of two different Condition Groups.
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
