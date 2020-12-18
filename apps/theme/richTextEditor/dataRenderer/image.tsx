import React from "react";
import { RTEDataBlockRendererPlugin } from "../../types";
import { BlockType } from "./index";

const defaultStyle = { maxWidth: "100%" };

export default () =>
    ({
        type: "rte-data-block-renderer",
        name: "rte-data-block-renderer-image",
        blockType: BlockType.image,
        render(block) {
            return <img style={defaultStyle} alt={block.data.caption} src={block.data.file.src} />;
        }
    } as RTEDataBlockRendererPlugin);
