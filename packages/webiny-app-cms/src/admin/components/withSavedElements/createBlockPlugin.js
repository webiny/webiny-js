// @flow
import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { addPlugin } from "webiny-plugins";

type Element = {
    id: string,
    name: string,
    type: string,
    category: string,
    content: Object,
    preview: {
        src: string
    }
};

export default (el: Element) => {
    addPlugin({
        id: el.id,
        name: "cms-saved-block-" + el.id,
        type: "cms-block",
        title: el.name,
        category: el.category,
        tags: ["saved"],
        create() {
            return cloneDeep(el.content);
        },
        preview() {
            return (
                <img src={el.preview.src} alt={el.name} style={{ width: "100%", height: "auto" }} />
            );
        }
    });
};
