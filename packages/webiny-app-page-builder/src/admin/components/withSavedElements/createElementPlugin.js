// @flow
import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { registerPlugins, getPlugins } from "webiny-plugins";
import Title from "./Title";

type Element = {
    id: string,
    name: string,
    type: string,
    content: Object,
    preview: {
        src: string
    }
};

export default (el: Element) => {
    const rootPlugin = getPlugins("pb-page-element").find(pl => pl.elementType === el.content.type);
    if (!rootPlugin) {
        return;
    }

    const name = "saved-element-" + el.id;

    registerPlugins({
        name,
        title: el.name,
        type: "pb-page-element",
        elementType: name,
        target: rootPlugin.target,
        toolbar: {
            title({ refresh }) {
                return <Title plugin={name} title={el.name} id={el.id} refresh={refresh} />;
            },
            group: "pb-page-element-group-saved",
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
