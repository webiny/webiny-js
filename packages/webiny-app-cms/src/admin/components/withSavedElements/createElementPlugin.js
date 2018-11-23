// @flow
import React from "react";
import { css } from "emotion";
import cloneDeep from "lodash/cloneDeep";
import { addPlugin, getPlugin } from "webiny-app/plugins";
import { updateChildPaths } from "webiny-app-cms/editor/utils";
import RenderElement from "webiny-app-cms/render/components/Element";
import Title from "./Title";
import AutoScale from "./AutoScale";

type Element = {
    id: string,
    name: string,
    type: string,
    content: Object,
    keywords: Array<string>
};

const autoScale = css({
    height: "auto",
    maxHeight: 260,
    overflow: "hidden"
});

export default (el: Element) => {
    const rootPlugin = getPlugin(el.content.type);
    if (!rootPlugin) {
        return;
    }

    const previewContent = cloneDeep(el.content);
    updateChildPaths(previewContent);

    const name = "cms-saved-element-" + el.id;

    addPlugin({
        name,
        type: "cms-element",
        target: rootPlugin.target,
        toolbar: {
            title({ refresh }) {
                return <Title plugin={name} title={el.name} id={el.id} onDelete={refresh}/>;
            },
            group: "cms-element-group-saved",
            preview() {
                return (
                    <div className={autoScale}>
                        <AutoScale maxWidth={276} maxHeight={276}>
                            <RenderElement element={previewContent} />
                        </AutoScale>
                    </div>
                );
            }
        },
        onCreate: "skip",
        settings: rootPlugin ? rootPlugin.settings : [],
        create() {
            return cloneDeep(el.content);
        }
    });
};
