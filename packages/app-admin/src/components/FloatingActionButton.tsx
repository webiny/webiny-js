import * as React from "react";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";

interface FloatingActionButtonProps {
    children: React.ReactNode;
}

// Set "styles" inline, since no customizations are possible / needed here.
const FloatingActionButton = (props: FloatingActionButtonProps) => {
    return (
        <div
            style={{
                position: "absolute",
                bottom: 20,
                right: 20
            }}
        >
            <IconButton {...props} icon={<AddIcon />} />
        </div>
    );
};

export { FloatingActionButton };
