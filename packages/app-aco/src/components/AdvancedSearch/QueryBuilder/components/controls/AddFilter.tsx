import React from "react";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/round/add_circle_outline.svg";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";

interface AddFilterProps {
    onClick: () => void;
}

export const AddFilter = ({ onClick }: AddFilterProps) => {
    return (
        <Tooltip content={"Add filter"} placement={"bottom"}>
            <IconButton label={"Add filter"} icon={<AddIcon />} onClick={onClick} />
        </Tooltip>
    );
};
