import React, { useMemo, useRef, useState } from "react";
import { Value } from "slate";
import { Editor } from "slate-react";
import { getPlugins } from "@webiny/plugins";
import { PbRenderSlateEditorPlugin, PbThemePlugin } from "@webiny/app-page-builder/types";

const SlateEditor = props => {
    const theme = useMemo(
        () => Object.assign({}, ...getPlugins("pb-theme").map((pl: PbThemePlugin) => pl.theme)),
        []
    );

    const plugins = useRef(
        getPlugins<PbRenderSlateEditorPlugin>("pb-render-slate-editor").map(pl => pl.slate)
    );
    const [value] = useState(Value.fromJSON(props.value || {}));

    return React.createElement<any>(Editor, {
        readOnly: true,
        autoCorrect: false,
        spellCheck: false,
        plugins: plugins.current,
        value,
        theme
    });
};

export default SlateEditor;
