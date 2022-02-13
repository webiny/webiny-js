import * as React from "react";
import { ButtonFloating } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "../assets/icons/round-add-24px.svg";

// Set "styles" inline, since no customizations are possible / needed here.
const FloatingActionButton: React.FC = props => {
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
