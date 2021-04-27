import React, { useState, useEffect, createContext } from "react";
import { Typography } from "@webiny/ui/Typography";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { NavigatorTitle } from "./StyledComponents";
import { TreeView } from "./TreeView";

export const NavigatorContext = createContext({ refresh: () => null });

const Navigator = () => {
    const [elementTree, setElementTree] = useState(null);
    const { getElementTree } = useEventActionHandler();

    const refreshElementTree = async () => {
        try {
            const elementTree = await getElementTree();
            setElementTree(elementTree);
        } catch (e) {
            console.log("Failed!");
        }
    };

    // Get initial element tree.
    useEffect(() => {
        if (elementTree) {
            return;
        }
        // Load element tree.
        refreshElementTree();
    });

    return (
        <NavigatorContext.Provider value={{ refresh: refreshElementTree }}>
            <NavigatorTitle>
                <Typography use={"subtitle1"}>Navigator</Typography>
            </NavigatorTitle>
            {elementTree && <TreeView element={elementTree} level={0} />}
        </NavigatorContext.Provider>
    );
};

export default Navigator;
