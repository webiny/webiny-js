import { FbFormStep } from "~/types";
interface MoveRowParams {
    sourceRow: number;
    destinationRow: number;
    sourceContainer: FbFormStep;
}

export default ({ sourceContainer, sourceRow, destinationRow }: MoveRowParams) => {
    sourceContainer.layout =
        sourceRow < destinationRow
            ? [
                  ...sourceContainer.layout.slice(0, sourceRow),
                  ...sourceContainer.layout.slice(sourceRow + 1, destinationRow),
                  sourceContainer.layout[sourceRow],
                  ...sourceContainer.layout.slice(destinationRow)
              ]
            : [
                  ...sourceContainer.layout.slice(0, destinationRow),
                  sourceContainer.layout[sourceRow],
                  ...sourceContainer.layout.slice(destinationRow, sourceRow),
                  ...sourceContainer.layout.slice(sourceRow + 1)
              ];
};
