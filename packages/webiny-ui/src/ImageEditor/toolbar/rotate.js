// @flow
import React from "react";
import { ReactComponent as RotateRight } from "./icons/rotateRight.svg";
import type { ImageEditorTool } from "./types";
import { IconButton } from "webiny-ui/Button";

const subMenu = ({ imageEditor, clearTool, resizeCanvas }) => {
    return (
        <ul>
            <li
                onClick={async () => {
                    await imageEditor.rotate(30);
                    resizeCanvas();
                }}
            >
                Clockwise(30)
            </li>
            <li
                onClick={async () => {
                    await imageEditor.rotate(-30);
                    resizeCanvas();
                }}
            >
                Counter-Clockwise(-30)
            </li>
            <li>
                <label>
                    Range input
                    <input
                        type="range"
                        min="-360"
                        max="360"
                        onChange={async e => {
                            await imageEditor.setAngle(parseInt(e.target.value, 10));
                            resizeCanvas();
                        }}
                    />
                </label>
            </li>
            <li onClick={clearTool}>Close</li>
        </ul>
    );
};

const tool: ImageEditorTool = {
    name: "rotate",
    icon({ imageEditor, enableTool }) {
        return (
            <IconButton
                icon={<RotateRight />}
                onClick={() => {
                    enableTool();
                    imageEditor.stopDrawingMode();
                }}
            />
        );
    },
    subMenu
};

export default tool;
