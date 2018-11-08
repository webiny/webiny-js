// @flow
import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { addPlugin } from "webiny-app/plugins";
import { updateChildPaths } from "webiny-app-cms/editor/utils";

type Element = {
    id: string,
    name: string,
    type: string,
    content: Object,
    keywords: Array<string>
};

export default (el: Element) => {
    const previewContent = cloneDeep(el.content);
    updateChildPaths(previewContent);

    addPlugin({
        name: "cms-saved-block-" + el.id,
        type: "cms-block",
        tags: ["saved"],
        keywords: el.keywords || [],
        create() {
            return cloneDeep(el.content);
        }
    });
};
