import React from "react";
import { RTEDataBlockRendererPlugin } from "../../types";
import { BlockType } from "./index";

export default () =>
    ({
        type: "rte-data-block-renderer",
        name: "rte-data-block-renderer-paragraph",
        blockType: BlockType.paragraph,
        render(block) {
            const props = { style: {}, className: null };

            if (block.data.textAlign) {
                props.style["textAlign"] = block.data.textAlign;
            }
            if (block.data.className) {
                props.className = block.data.className;
            }
            return <p {...props} dangerouslySetInnerHTML={{ __html: block.data.text }} />;
        }
    } as RTEDataBlockRendererPlugin);
