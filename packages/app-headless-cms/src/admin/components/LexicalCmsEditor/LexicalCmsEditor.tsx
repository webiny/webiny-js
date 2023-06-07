import React from "react";
import { WebinyListPlugin } from "@webiny/lexical-editor/plugins/WebinyListPLugin/WebinyListPlugin";
import {
    ClickableLinkPlugin,
    CodeHighlightPlugin,
    FloatingLinkEditorPlugin,
    LinkPlugin,
    StaticToolbar
} from "@webiny/lexical-editor";
import { RichTextEditorProps } from "@webiny/lexical-editor/types";
import { CompositionScope } from "@webiny/react-composition";
import { LexicalEditor } from "@webiny/app-admin/components/LexicalEditor";
import { usePageElements } from "@webiny/app-page-builder-elements";

export const LexicalCmsEditor = (props: Omit<RichTextEditorProps, "theme">) => {
    const { theme } = usePageElements();

    return (
        <LexicalEditor
            {...props}
            theme={theme}
            value={JSON.stringify(props.value)}
            onChange={(jsonString: string) => {
                if (props?.onChange) {
                    props?.onChange(JSON.parse(jsonString));
                }
            }}
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
