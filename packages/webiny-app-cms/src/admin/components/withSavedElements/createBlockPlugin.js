// @flow
import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { addPlugin } from "webiny-plugins";

type Element = {
    id: string,
    name: string,
    type: string,
    content: Object,
    keywords: Array<string>,
    preview: {
        src: string
    }
};

export default (el: Element) => {
    addPlugin({
        name: "cms-saved-block-" + el.id,
        type: "cms-block",
        tags: ["saved"],
        keywords: el.keywords || [],
        create() {
            return cloneDeep(el.content);
        },
        preview() {
            return (
                <img src={el.preview.src} alt={el.name} style={{ width: 400, height: "auto" }} />
            );
        }
    });
};
