import React, { useRef, useState } from "react";
import { Value } from "slate";
import { Editor } from "slate-react";
import { getPlugins } from "@webiny/plugins";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { PbRenderSlateEditorPlugin } from "@webiny/app-page-builder/types";

const SlateEditor = props => {
    const { theme } = usePageBuilder();
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
