import * as React from "react";
import { ButtonFloating } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/outlined/add.svg";

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
            <ButtonFloating {...props} icon={<AddIcon />} />
        </div>
    );
};

export { FloatingActionButton };
