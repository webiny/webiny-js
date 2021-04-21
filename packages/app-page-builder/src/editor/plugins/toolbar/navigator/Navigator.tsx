import React, { useState, useEffect } from "react";
import { Typography } from "@webiny/ui/Typography";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { NavigatorTitle } from "./StyledComponents";
import { TreeView } from "./TreeView";

const Navigator = () => {
    const [elementTree, setElementTree] = useState(null);
    const { getElementTree } = useEventActionHandler();

    // Get initial element tree.
    useEffect(() => {
        if (elementTree) {
            return;
        }
        // Load element tree.
        (async () => {
            try {
                const elementTree = await getElementTree();
                setElementTree(elementTree);
            } catch (e) {
                console.log("Failed!");
            }
        })();
    });

    return (
        <>
            <NavigatorTitle>
                <Typography use={"subtitle1"}>Navigator</Typography>
            </NavigatorTitle>
            {elementTree && <TreeView element={elementTree} level={0} />}
        </>
    );
};

export default Navigator;
