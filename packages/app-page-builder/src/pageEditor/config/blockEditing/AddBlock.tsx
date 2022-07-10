import React from "react";
import styled from "@emotion/styled";
import { ButtonFloating } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "~/editor/assets/icons/add.svg";
import { blocksBrowserStateAtom } from "~/pageEditor/config/blockEditing/state";
import { useRecoilState } from "recoil";

const SIDEBAR_WIDTH = 300;
const BottomRight = styled("div")({
    position: "fixed",
    zIndex: 25,
    bottom: 20,
    right: 20 + SIDEBAR_WIDTH
});

const AddBlock: React.FC = () => {
    const [, setBlocksBrowserState] = useRecoilState(blocksBrowserStateAtom);

    const onClickHandler = () => {
        setBlocksBrowserState(true);
    };

    return (
        <BottomRight>
            <ButtonFloating onClick={onClickHandler} icon={<AddIcon />} />
        </BottomRight>
    );
};

export default React.memo(AddBlock);
