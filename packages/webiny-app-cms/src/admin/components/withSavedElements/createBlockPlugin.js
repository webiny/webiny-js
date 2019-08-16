// @flow
import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { registerPlugins } from "webiny-plugins";
import { Image } from "webiny-ui/Image";

type Element = {
    id: string,
    name: string,
    type: string,
    category: string,
    content: Object,
    preview: {
        src: string,
        width: number,
        height: number
    }
};

export default (el: Element) => {
    registerPlugins({
        id: el.id,
        name: "pb-saved-block-" + el.id,
        type: "pb-block",
        title: el.name,
        category: el.category,
        tags: ["saved"],
        image: el.preview,
        create() {
            return cloneDeep({ ...el.content, source: el.id });
        },
        preview() {
            return (
                <Image
                    src={el.preview.src}
                    alt={el.name}
                    style={{ width: "100%", height: "auto" }}
                />
            );
        }
    });
};
