import React from "react";
import { MoverWrapper } from "./StyledComponents";
import { ReactComponent as ArrowUpwardIcon } from "./assets/arrow_upward_24px.svg";
import { ReactComponent as ArrowDownwardIcon } from "./assets/arrow_downward_24px.svg";
import { useBlockMover } from "./useBlockMover";

const BLOCK = "block";

type MoverProps = {
    type: string;
    id: string;
};
const BlockMover: React.FunctionComponent<MoverProps> = ({ type, id }) => {
    const { moveUp, moveDown, canMoveUp, canMoveDown } = useBlockMover(id);

    if (type !== BLOCK) {
        return null;
    }

    return (
        <MoverWrapper>
            <button disabled={!canMoveUp()} onClick={moveUp}>
                <ArrowUpwardIcon />
            </button>
            <button disabled={!canMoveDown()} onClick={moveDown}>
                <ArrowDownwardIcon />
            </button>
        </MoverWrapper>
    );
};

export default BlockMover;
