import React, { useState, useEffect, createContext } from "react";
import { Typography } from "@webiny/ui/Typography";
import { Tooltip } from "@webiny/ui/Tooltip";
import { i18n } from "@webiny/app/i18n";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { NavigatorTitle } from "./StyledComponents";
import { TreeView } from "./TreeView";
import { ReactComponent as UnfoldMoreIcon } from "./assets/unfold_more_24px.svg";
import { ReactComponent as UnfoldLessIcon } from "./assets/unfold_less_24px.svg";
import { UpdateElementTreeActionEvent } from "~/editor/recoil/actions";

const t = i18n.ns("app-page-builder/editor/plugins/toolbar/navigator");

export const NavigatorContext = createContext(null);

const Navigator = () => {
    const [elementTree, setElementTree] = useState(null);
    const [expandAll, setExpandAll] = useState(false);
    const [activeElementPath, setActiveElementPath] = useState([]);
    const eventHandler = useEventActionHandler();

    const refreshElementTree = async () => {
        try {
            const elementTree = await eventHandler.getElementTree();
            setElementTree(elementTree);
        } catch (e) {}
    };
    // Update element tree
    useEffect(() => {
        eventHandler.on(UpdateElementTreeActionEvent, () => {
            refreshElementTree();
            return {};
        });
    }, []);

    // Get initial element tree.
    useEffect(() => {
        if (elementTree) {
            return;
        }
        // Load element tree.
        refreshElementTree();
    });

    return (
        <NavigatorContext.Provider
            value={{
                refresh: refreshElementTree,
                expandAll,
                activeElementPath,
                setActiveElementPath
            }}
        >
            <NavigatorTitle>
                <Typography use={"subtitle1"}>Navigator</Typography>
                <button
                    className={"action"}
                    onClick={() => {
                        setExpandAll(!expandAll);
                    }}
                >
                    <Tooltip
                        content={t`{message}`({
                            message: expandAll ? "collapse all" : "expand all"
                        })}
                    >
                        {expandAll ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                    </Tooltip>
                </button>
            </NavigatorTitle>
            {elementTree && <TreeView element={elementTree} level={0} />}
        </NavigatorContext.Provider>
    );
};

export default Navigator;
