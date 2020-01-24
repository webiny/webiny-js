import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { registerPlugins, getPlugins } from "@webiny/plugins";
import { PbElement, PbEditorPageElementPlugin } from "@webiny/app-page-builder/admin/types";
import Title from "./components/Title";

export default (el: PbElement) => {
    const plugins = getPlugins("pb-page-element") as PbEditorPageElementPlugin[];
    const rootPlugin: PbEditorPageElementPlugin = plugins.find(pl => pl.elementType === el.content.type);

    if (!rootPlugin) {
        return;
    }

    const name = "saved-element-" + el.id;

    registerPlugins({
        name,
        title: el.name,
        type: "pb-editor-page-element",
        elementType: name,
        target: rootPlugin.target,
        toolbar: {
            title({ refresh }) {
                return <Title plugin={name} title={el.name} id={el.id} refresh={refresh} />;
            },
            group: "pb-editor-element-group-saved",
            preview() {
                return (
                    <img
                        src={el.preview.src}
                        alt={el.name}
                        style={{ width: 227, height: "auto", backgroundColor: "#fff" }}
                    />
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
