import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { TogglePluginActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import styled from "@emotion/styled";
import { togglePlugin } from "@webiny/app-page-builder/editor/actions";
import { ButtonFloating } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-page-builder/editor/assets/icons/add.svg";

const BottomRight = styled("div")({
    position: "fixed",
    zIndex: 25,
    bottom: 20,
    right: 20
});

const AddBlock = () => {
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
