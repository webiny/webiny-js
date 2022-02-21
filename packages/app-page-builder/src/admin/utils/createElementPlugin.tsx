import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { plugins } from "@webiny/plugins";
import { PbEditorElement, PbEditorPageElementPlugin } from "~/types";
import Title from "./components/Title";

export default (el: PbEditorElement) => {
    const elementPlugins = plugins.byType<PbEditorPageElementPlugin>("pb-editor-page-element");
    const rootPlugin = elementPlugins.find(pl => pl.elementType === el.content.type);

    if (!rootPlugin) {
        return;
    }

    const name = "saved-element-" + el.id;

    const plugin: PbEditorPageElementPlugin = {
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
        },
        /**
         * Must define as null because TS is complaining
         * Verify that render can be null/undefined
         * TODO @ts-refactor
         */
        render: null
    };
    plugins.register(plugin);
};
