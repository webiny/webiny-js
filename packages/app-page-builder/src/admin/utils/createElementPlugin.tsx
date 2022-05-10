import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { plugins } from "@webiny/plugins";
import { OnCreateActions, PbEditorElement, PbEditorPageElementPlugin } from "~/types";
import Title from "./components/Title";

/**
 * TODO @ts-refactor @pavel
 * When refactoring Page Builder, we need to write better types for the elements.
 * We must remove [key: string]: any and type everything we have in the system.
 * For plugins, we must put a possibility to pass a generic to extends the base PbElement and PbEditorElement.
 */
export default (el: PbEditorElement): void => {
    const elementPlugins = plugins.byType<PbEditorPageElementPlugin>("pb-editor-page-element");
    const rootPlugin = elementPlugins.find(pl => pl.elementType === el.content?.type);

    if (!rootPlugin) {
        return;
    }

    const name = "saved-element-" + el.id;

    const plugin: PbEditorPageElementPlugin = {
        name,
        // @ts-ignore
        title: el.name,
        type: "pb-editor-page-element",
        elementType: name,
        target: rootPlugin.target,
        toolbar: {
            title({ refresh }) {
                // @ts-ignore
                return <Title plugin={name} title={el.name} id={el.id} refresh={refresh} />;
            },
            group: "pb-editor-element-group-saved",
            preview() {
                return (
                    <img
                        // @ts-ignore
                        src={el.preview.src}
                        // @ts-ignore
                        alt={el.name}
                        style={{ width: 227, height: "auto", backgroundColor: "#fff" }}
                    />
                );
            }
        },

        onCreate: OnCreateActions.SKIP,
        settings: rootPlugin ? rootPlugin.settings : [],
        // @ts-ignore
        create() {
            return cloneDeep(el.content);
        },
        render: () => {
            return null;
        }
    };
    plugins.register(plugin);
};
