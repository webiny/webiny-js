import React from "react";
import { LexicalHtmlRenderer } from "@webiny/lexical-editor";
import type { ComponentPropsWithChildren } from "@webiny/website-builder-react";

type TextWithDropzoneProps = ComponentPropsWithChildren<{
    title: string;
    content: string;
}>;

export const TextWithDropzone = ({ inputs }: TextWithDropzoneProps) => {
    return (
        <div className={"p-6"}>
            <h1>{(inputs.title || "Split Block").toUpperCase()}</h1>
            <div style={{ display: "flex", flexDirection: "row", gap: 8, padding: 5 }}>
                <div style={{ flexBasis: "50%", textAlign: "justify" }}>
                    <LexicalHtmlRenderer value={inputs.content} theme={{}} />
                </div>
                <div style={{ flexBasis: "50%" }}>{inputs.children}</div>
            </div>
        </div>
    );
};
