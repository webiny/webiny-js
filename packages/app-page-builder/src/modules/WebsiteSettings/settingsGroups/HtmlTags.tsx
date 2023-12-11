import React from "react";
import { css } from "emotion";
import { Bind } from "@webiny/form";
import { AddPbWebsiteSettings } from "../AddPbWebsiteSettings";
import { CodeEditor } from "@webiny/ui/CodeEditor";
import { Typography } from "@webiny/ui/Typography";

const inputStyle = css({
    "& span": {
        color: "var(--mdc-theme-text-primary-on-background)"
    },
    "& .ace_editor": {
        marginTop: "8px",
        maxHeight: "200px",
        fontSize: 16,

        ".ace_info": {
            background: "none"
        }
    }
});

type CodeEditorInputProps = {
    name: string;
    label: string;
    description: string;
};

const CodeEditorInput = ({ name, label, description }: CodeEditorInputProps) => {
    return (
        <div className={inputStyle}>
            <Typography use={"subtitle1"}>{label}</Typography>
            <Bind name={name}>
                <CodeEditor mode="html" theme="chrome" description={description} />
            </Bind>
        </div>
    );
};

const { Group, Element } = AddPbWebsiteSettings;

export const HtmlTags = () => {
    return (
        <Group name={"htmlTags"} label={"HTML Tags"}>
            <Element>
                <CodeEditorInput
                    name="htmlTags.header"
                    label="Header tags"
                    description="HTML tags and scripts that will be added before the closing </head> tag. (Supported tags: <script>, <meta>)"
                />
            </Element>
            <Element>
                <CodeEditorInput
                    name="htmlTags.footer"
                    label="Footer tags"
                    description="HTML tags and scripts that will be added before the closing </body> tag. (Supported tags: <script>)"
                />
            </Element>
        </Group>
    );
};
