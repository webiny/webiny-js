import React, { useEffect } from "react";
import { WebinyListPlugin } from "@webiny/lexical-editor/plugins/WebinyListPLugin/WebinyListPlugin";
import {
    ClickableLinkPlugin,
    CodeHighlightPlugin,
    FloatingLinkEditorPlugin,
    LinkPlugin,
    StaticToolbar
} from "@webiny/lexical-editor";
import { CompositionScope } from "@webiny/react-composition";
import { LexicalEditor } from "@webiny/app-admin/components/LexicalEditor";

export const LexicalCmsEditor = (props: React.ComponentProps<typeof LexicalEditor>) => {
    useEffect(() => {
        console.log("has theme", props.theme);
    }, [props.theme]);

    return (
        <LexicalEditor
            {...props}
            staticToolbar={
                <CompositionScope name={"cms"}>
                    <StaticToolbar />
                </CompositionScope>
            }
            tag={"p"}
            placeholder={props?.placeholder || "Enter your text here..."}
            styles={{
                backgroundColor: "#fff",
                border: "1px solid #e1e1e1",
                padding: "10px 14px",
                minHeight: 200,
                maxHeight: 350
            }}
        >
            <LinkPlugin />
            <WebinyListPlugin />
            <CodeHighlightPlugin />
            <ClickableLinkPlugin />
            <FloatingLinkEditorPlugin anchorElem={document.body} />
        </LexicalEditor>
    );
};
