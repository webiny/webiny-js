// @flow
import React from "react";
import { RotateRightIcon } from "./icons";
import type { ImageEditorTool } from "./types";
import { IconButton } from "webiny-ui/Button";

const subMenu = ({ imageEditor, clearTool }) => {
    return (
        <ul>
            <li
                onClick={() => {
                    imageEditor.rotate(30);
                }}
            >
                Clockwise(30)
            </li>
            <li
                onClick={() => {
                    imageEditor.rotate(-30);
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
                        onChange={e => {
                            imageEditor.setAngle(parseInt(e.target.value, 10)).catch(() => {});
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
    icon: () => <RotateRightIcon />,
    subMenu,
    onClick: imageEditor => {
        imageEditor.startDrawingMode();
    }
};

export default tool;
