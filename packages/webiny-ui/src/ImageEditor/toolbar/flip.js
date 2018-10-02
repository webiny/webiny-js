// @flow
import React from "react";
import type { ImageEditorTool } from "./types";
import { ReactComponent as FlipIcon } from "./icons/flip.svg";

import { IconButton, ButtonDefault } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";

const subMenu = ({ imageEditor, clearTool }) => {
    return (
        <React.Fragment>
            <div>
                <ButtonDefault onClick={() => imageEditor.flipX()}>FlipX</ButtonDefault>
                <ButtonDefault onClick={() => imageEditor.flipY()}>FlipY</ButtonDefault>
            </div>
            <div>
                <ButtonDefault onClick={() => imageEditor.resetFlip()}>Reset</ButtonDefault>
            </div>
        </React.Fragment>
    );
};

const tool: ImageEditorTool = {
    name: "flip",
    icon({ imageEditor, enableTool }) {
        return (
            <Tooltip placement={"bottom"} content={"Flip"}>
                <IconButton
                    icon={<FlipIcon />}
                    onClick={() => {
                        enableTool();
                        imageEditor.stopDrawingMode();
                    }}
                />
            </Tooltip>
        );
    },
    subMenu
};

export default tool;
