import { useEffect } from "react";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";

/**
 * This hook attaches `activeElementToJson()` function to the `window` object in development mode.
 * The function allows developers to activate an element, and print the entire element tree to console.
 */
export const useDebugUtilities = () => {
    if (process.env.NODE_ENV !== "development") {
        return;
    }

    const [activeElement] = useActiveElement();
    const { getRawElementTree } = useEventActionHandler();

    useEffect(() => {
        // @ts-expect-error This function is for debugging purposes!
        window["debug_printElementToJson"] = () => {
            getRawElementTree({ element: activeElement ?? undefined }).then(tree => {
                console.log(tree);
            });
        };

        // @ts-expect-error This function is for debugging purposes!
        window["debug_printPageContent"] = () => {
            getRawElementTree({ dereferenceBlocks: false }).then(tree => {
                console.log(tree);
            });
        };
    }, [activeElement]);
};
