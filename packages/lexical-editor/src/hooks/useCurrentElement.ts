import { $findMatchingParent } from "@lexical/utils";
import { $isRootOrShadowRoot } from "lexical";
import { useDeriveValueFromSelection } from "~/hooks/useCurrentSelection";

export function useCurrentElement() {
    return useDeriveValueFromSelection(({ rangeSelection }) => {
        if (!rangeSelection) {
            return { element: null };
        }
        const anchorNode = rangeSelection.anchor.getNode();

        const element =
            anchorNode.getKey() === "root"
                ? anchorNode
                : $findMatchingParent(anchorNode, e => {
                      const parent = e.getParent();
                      return parent !== null && $isRootOrShadowRoot(parent);
                  });

        return { element: element || anchorNode.getTopLevelElementOrThrow() };
    });
}
