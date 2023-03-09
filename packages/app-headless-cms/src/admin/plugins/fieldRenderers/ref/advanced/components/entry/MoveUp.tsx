import React from "react";
import { ButtonLink } from "./elements/ButtonLink";
import { ReactComponent as MoveUpIcon } from "./assets/move-up.svg";
import { Tooltip } from "@webiny/ui/Tooltip";

interface Props {
    onClick: (ev: React.MouseEvent) => void;
}

export const MoveUp: React.VFC<Props> = ({ onClick }) => {
    return (
        <ButtonLink onClick={onClick} maxWidth={"100px"}>
            <Tooltip content={"Shift+Click to move to top"} placement={"top"}>
                <MoveUpIcon /> Move Up
            </Tooltip>
        </ButtonLink>
    );
};
