import React from "react";
import File from "./File";
import { getPlugins, getPlugin } from "webiny-plugins";
import invariant from "invariant";

export default function renderFile({ file, selected, onClick }) {
    const plugins = getPlugins("file-manager-file-type");

    let render = null;
    for (let i = 0; i < plugins.length; i++) {
        let plugin = plugins[i];
        if (Array.isArray(plugin.types) && plugin.types.includes(file.type)) {
            render = plugin.render;
        }
    }

    if (!render) {
        render = getPlugin("file-manager-file-type-default");
        invariant(render, `Missing default "file-manager-file-type" plugin.`);
        if (render) {
            render = render.render;
        }
    }

    return (
        <File key={file.src} file={file} selected={selected} onClick={onClick}>
            {render(file)}
        </File>
    );
}
