import { useMemo } from "react";
import { $findMatchingParent } from "@lexical/utils";
import { $isRootOrShadowRoot } from "lexical";
import { useCurrentSelection } from "~/hooks/useCurrentSelection";

export function useCurrentElement() {
    const { rangeSelection } = useCurrentSelection();

    const element = useMemo(() => {
        if (!rangeSelection) {
            return null;
        }
        const anchorNode = rangeSelection.anchor.getNode();
        const element =
            anchorNode.getKey() === "root"
                ? anchorNode
                : $findMatchingParent(anchorNode, e => {
                      const parent = e.getParent();
                      return parent !== null && $isRootOrShadowRoot(parent);
                  });

        return element || anchorNode.getTopLevelElementOrThrow();
    }, [rangeSelection]);

    return { element };
}
