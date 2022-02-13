import React from "react";
import styled from "@emotion/styled";
import { useEventActionHandler } from "../../hooks/useEventActionHandler";
import { TogglePluginActionEvent } from "../../recoil/actions";
import { ButtonFloating } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "../../assets/icons/add.svg";

const SIDEBAR_WIDTH = 300;
const BottomRight = styled("div")({
    position: "fixed",
    zIndex: 25,
    bottom: 20,
    right: 20 + SIDEBAR_WIDTH
});

const AddBlock: React.FC = () => {
    const handler = useEventActionHandler();

    const onClickHandler = () => {
        handler.trigger(
            new TogglePluginActionEvent({
                name: "pb-editor-search-blocks-bar"
            })
        );
    };
    return (
        <BottomRight>
            <ButtonFloating onClick={onClickHandler} icon={<AddIcon />} />
        </BottomRight>
    );
};

export default React.memo(AddBlock);
