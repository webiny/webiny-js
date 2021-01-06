import React from "react";
import classNames from "classnames";
import { RTEDataBlockRendererPlugin } from "../../types";

export default () =>
    ({
        type: "rte-data-block-renderer",
        name: "rte-data-block-renderer-paragraph",
        outputType: "react",
        blockType: "paragraph",
        render(block) {
            const props = { style: {}, className: null };

            if (block.data.textAlign) {
                props.style["textAlign"] = block.data.textAlign;
            }
            if (block.data.className) {
                props.className = block.data.className;
            }
            return (
                <p
                    {...props}
                    className={classNames("rte-block-paragraph", props.className)}
                    dangerouslySetInnerHTML={{ __html: block.data.text }}
                />
            );
        }
    } as RTEDataBlockRendererPlugin);
