import { $findMatchingParent } from "@lexical/utils";
import { $isRootOrShadowRoot, RangeSelection } from "lexical";
import { useDeriveValueFromSelection } from "~/hooks/useCurrentSelection";

export function useCurrentElement() {
    return useDeriveValueFromSelection(({ rangeSelection }) => {
        if (!rangeSelection) {
            return { element: null };
        }

        return { element: getNodeFromSelection(rangeSelection) };
    });
}

export function getNodeFromSelection(selection: RangeSelection) {
    const anchorNode = selection.anchor.getNode();

    const element =
        anchorNode.getKey() === "root"
            ? anchorNode
            : $findMatchingParent(anchorNode, e => {
                  const parent = e.getParent();
                  return parent !== null && $isRootOrShadowRoot(parent);
              });

    return element || anchorNode.getTopLevelElementOrThrow();
}
