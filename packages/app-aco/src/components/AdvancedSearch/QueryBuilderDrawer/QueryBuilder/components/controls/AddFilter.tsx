import React from "react";

import { ReactComponent as AddIcon } from "@material-design-icons/svg/round/add_circle_outline.svg";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";

import { AddFilterInner } from "../../Querybuilder.styled";

interface AddFilterProps {
    onClick: () => void;
}

export const AddFilter = ({ onClick }: AddFilterProps) => {
    return (
        <AddFilterInner>
            <Tooltip content={"Add new condition"} placement={"bottom"}>
                <IconButton label={"Add new condition"} icon={<AddIcon />} onClick={onClick} />
            </Tooltip>
        </AddFilterInner>
    );
};
