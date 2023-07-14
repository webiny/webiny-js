import React from "react";
import { LexicalEditorConfig as BaseConfig } from "@webiny/lexical-editor";
import { CompositionScope } from "@webiny/react-composition";

const ParagraphFloatingToolbarAction = (
    props: React.ComponentProps<typeof BaseConfig.ToolbarElement>
) => {
    return (
        <CompositionScope name={"pb.paragraph"}>
            <BaseConfig>
                <BaseConfig.ToolbarElement {...props} />
            </BaseConfig>
        </CompositionScope>
    );
};

const ParagraphToolbarPlugin = (props: React.ComponentProps<typeof BaseConfig.Plugin>) => {
    return (
        <CompositionScope name={"pb.paragraph"}>
            <BaseConfig>
                <BaseConfig.Plugin {...props} />
            </BaseConfig>
        </CompositionScope>
    );
};

const ParagraphToolbarNode = (props: React.ComponentProps<typeof BaseConfig.Node>) => {
    return (
        <CompositionScope name={"pb.paragraph"}>
            <BaseConfig>
                <BaseConfig.Node {...props} />
            </BaseConfig>
        </CompositionScope>
    );
};

export const Paragraph = {
    FloatingToolbarAction: ParagraphFloatingToolbarAction,
    Plugin: ParagraphToolbarPlugin,
    Node: ParagraphToolbarNode
};
