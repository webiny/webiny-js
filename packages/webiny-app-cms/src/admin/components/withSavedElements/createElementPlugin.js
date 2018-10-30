// @flow
import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { addPlugin, getPlugin } from "webiny-app/plugins";
import { updateChildPaths } from "webiny-app-cms/editor/utils";
import RenderElement from "webiny-app-cms/render/components/Element";
import Title from "./Title";

type Element = {
    id: string,
    name: string,
    type: string,
    content: Object,
    keywords: Array<string>
};

export default (el: Element) => {
    const rootPlugin = getPlugin(el.content.type);
    if (!rootPlugin) {
        return;
    }

    const previewContent = cloneDeep(el.content);
    updateChildPaths(previewContent);

    addPlugin({
        name: "cms-saved-element-" + el.id,
        type: "cms-element",
        target: rootPlugin.target,
        toolbar: {
            title() {
                return <Title title={el.name} onDelete={() => {}} />;
            },
            group: "cms-element-group-saved",
            preview() {
                return <RenderElement element={previewContent} />;
            }
        },
        settings: rootPlugin ? rootPlugin.settings : [],
        create() {
            return cloneDeep(el.content);
        }
    });
};
