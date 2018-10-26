import React from "react";
import { graphql } from "react-apollo";
import { get } from "dot-prop-immutable";
import cloneDeep from "lodash/cloneDeep";
import { addPlugin, getPlugin } from "webiny-app/plugins";
import { listElements } from "webiny-app-cms/admin/graphql/pages";
import { updateChildPaths } from "webiny-app-cms/editor/utils";
import RenderElement from "webiny-app-cms/render/components/Element";
import { ReactComponent as DeleteIcon } from "webiny-app-cms/editor/assets/icons/delete.svg";

export const createElementPlugin = el => {
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
        element: {
            title: el.name,
            group: "cms-element-group-saved",
            settings: rootPlugin ? rootPlugin.element.settings : [],
            shiftButton: {
                icon: <DeleteIcon/>,
                onClick: () => console.log("DELETE ELEMENT"),
                label: "Delete"
            }
        },
        create() {
            return cloneDeep(el.content);
        },
        preview() {
            return <RenderElement element={previewContent} />;
        }
    });
};

export const withSavedElements = graphql(listElements, {
    props: ({ data }) => {
        if (data.loading) {
            return { elements: null };
        }

        const elements = get(data, "cms.elements.data");
        elements.filter(el => el.type === "element").forEach(createElementPlugin);

        return { elements };
    }
});
