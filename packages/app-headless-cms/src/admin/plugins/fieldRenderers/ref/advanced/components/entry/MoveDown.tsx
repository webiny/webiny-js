import React from "react";
import { ButtonLink } from "./elements/ButtonLink";
import { ReactComponent as MoveDownIcon } from "./assets/move-down.svg";
import { Tooltip } from "@webiny/ui/Tooltip";

interface Props {
    onClick: (ev: React.MouseEvent) => void;
}

export const MoveDown: React.VFC<Props> = ({ onClick }) => {
    return (
        <ButtonLink onClick={onClick} maxWidth={"100px"}>
            <Tooltip content={"Shift+Click to move to bottom"} placement={"top"}>
                <MoveDownIcon /> Move Down
            </Tooltip>
        </ButtonLink>
    );
};
