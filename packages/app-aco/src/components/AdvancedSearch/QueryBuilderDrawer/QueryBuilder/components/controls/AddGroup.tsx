import React from "react";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/round/add_circle_outline.svg";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";

interface AddGroupProps {
    onClick: () => void;
}

export const AddGroup = ({ onClick }: AddGroupProps) => {
    return (
        <Tooltip content={"Add group"} placement={"bottom"}>
            <IconButton label={"Add group"} icon={<AddIcon />} onClick={onClick} />
        </Tooltip>
    );
};
