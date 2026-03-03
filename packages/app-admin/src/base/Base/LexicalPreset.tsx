import React from "react";
import { LexicalEditorConfig } from "@webiny/lexical-editor/components/LexicalEditorConfig/LexicalEditorConfig.js";
import { FloatingLinkEditorPlugin } from "@webiny/lexical-editor";
import { AdminConfig } from "../../config/AdminConfig.js";
import { LexicalTheme } from "~/config/AdminConfig/LexicalTheme.js";
import { LexicalLinkForm } from "~/components/index.js";

const { Color, Typography } = LexicalTheme;

export const LexicalPreset = () => {
    return (
        <>
            <AdminConfig>
                {/* Colors */}
                <Color id={"color1"} label="Primary color" value={"var(--wa-theme-color1)"} />
                <Color id={"color2"} label="Secondary color" value={"var(--wa-theme-color2)"} />
                <Color id={"color3"} label="Regular color" value={"var(--wa-theme-color3)"} />
                {/* Typography */}
                <Typography.Heading
                    id={"heading1"}
                    label={"Heading 1"}
                    tag={"h1"}
                    className={"wa-heading-1"}
                />
                <Typography.Heading
                    id={"heading2"}
                    label={"Heading 2"}
                    tag={"h2"}
                    className={"wa-heading-2"}
                />
                <Typography.Heading
                    id={"heading3"}
                    label={"Heading 3"}
                    tag={"h3"}
                    className={"wa-heading-3"}
                />

                <Typography.Paragraph
                    id={"paragraph1"}
                    label={"Paragraph"}
                    tag={"p"}
                    className={"wa-paragraph-1"}
                />

                <Typography.Quote
                    id={"quote"}
                    label={"Quote"}
                    tag={"blockquote"}
                    className={"wa-blockquote-1"}
                />
                <Typography.List
                    id={"list1"}
                    label={"Unordered list"}
                    tag={"ul"}
                    className={"wa-unordered-list-1"}
                />
                <Typography.List
                    id={"list2"}
                    label={"Ordered list"}
                    tag={"ol"}
                    className={"wa-ordered-list-1"}
                />
            </AdminConfig>
            <LexicalEditorConfig>
                <LexicalEditorConfig.Plugin
                    name={"floatingLinkEditor"}
                    element={<FloatingLinkEditorPlugin LinkForm={LexicalLinkForm} />}
                />
            </LexicalEditorConfig>
        </>
    );
};
