import React, { useRef, useState } from "react";
import { Value } from "slate";
import { Editor } from "slate-react";
import { getPlugins } from "@webiny/plugins";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { PbRenderSlateEditorPlugin } from "@webiny/app-page-builder/types";

const SlateEditor = props => {
    const { theme } = usePageBuilder();
    const plugins = useRef(
        (getPlugins("pb-render-slate-editor") as PbRenderSlateEditorPlugin[]).map(pl => pl.slate)
    );
    const [value] = useState(Value.fromJSON(props.value || {}));

    return (
        <Editor
            readOnly={true}
            autoCorrect={false}
            spellCheck={false}
            plugins={plugins.current}
            // @ts-ignore TS is complaining for some reason
            value={value}
            theme={theme}
        />
    );
};

export default SlateEditor;
