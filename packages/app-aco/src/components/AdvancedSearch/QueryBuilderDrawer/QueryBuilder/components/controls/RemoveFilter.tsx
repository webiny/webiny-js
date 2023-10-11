import React from "react";

import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";

interface RemoveFilterProps {
    onClick: () => void;
}

export const RemoveFilter = ({ onClick }: RemoveFilterProps) => {
    return (
        <Tooltip content={"Remove filter"} placement={"bottom"}>
            <IconButton label={"Remove filter"} icon={<DeleteIcon />} onClick={onClick} />
        </Tooltip>
    );
};
