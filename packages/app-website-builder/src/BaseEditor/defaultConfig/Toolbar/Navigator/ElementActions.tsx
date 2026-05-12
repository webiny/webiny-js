import React from "react";
import { Tooltip, Tree } from "@webiny/admin-ui";
import { ReactComponent as VisibilityNone } from "@webiny/icons/visibility_off.svg";
import { useStyles } from "~/BaseEditor/hooks/useStyles.js";

export const ElementActions = ({ elementId }: { elementId: string }) => {
    const { styles, onChange } = useStyles(elementId);
    const isVisible = styles.display !== "none";

    const unhideElement = () => {
        onChange(({ styles }) => {
            styles.set("display", "flex");
        });
    };

    if (isVisible) {
        return null;
    }

    return (
        <div className={"flex"}>
            <Tooltip
                trigger={
                    <Tree.Item.Icon
                        size={"sm"}
                        className={"cursor-pointer"}
                        element={<VisibilityNone />}
                        label={"This element is hidden."}
                        onClick={unhideElement}
                    />
                }
                content={"This element is hidden. Click to unhide."}
            />
        </div>
    );
};
