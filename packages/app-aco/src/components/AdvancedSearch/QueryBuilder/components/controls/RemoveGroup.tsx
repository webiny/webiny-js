import React from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/round/delete.svg";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";

interface RemoveGroupProps {
    onClick: () => void;
}

export const RemoveGroup = ({ onClick }: RemoveGroupProps) => {
    return (
        <Tooltip content={"Remove group"} placement={"bottom"}>
            <IconButton label={"Remove group"} icon={<DeleteIcon />} onClick={onClick} />
        </Tooltip>
    );
};
