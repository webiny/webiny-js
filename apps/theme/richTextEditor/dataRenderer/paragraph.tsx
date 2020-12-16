import React from "react";
import { RTEDataBlockRendererPlugin } from "../../types";
import { BlockType } from "./index";

export default () =>
    ({
        type: "rte-data-block-renderer",
        name: "rte-data-block-renderer-paragraph",
        blockType: BlockType.paragraph,
        render(block) {
            return <p dangerouslySetInnerHTML={{ __html: block.data.text }} />;
        }
    } as RTEDataBlockRendererPlugin);
