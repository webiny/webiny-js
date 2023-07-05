import React from "react";
import { LexicalEditorConfig as BaseConfig } from "@webiny/lexical-editor";
import { CompositionScope } from "@webiny/react-composition";

const HeadingToolbarAction = (props: React.ComponentProps<typeof BaseConfig.ToolbarElement>) => {
    return (
        <CompositionScope name={"pb.heading"}>
            <BaseConfig>
                <BaseConfig.ToolbarElement {...props} />
            </BaseConfig>
        </CompositionScope>
    );
};

const HeadingToolbarPlugin = (props: React.ComponentProps<typeof BaseConfig.Plugin>) => {
    return (
        <CompositionScope name={"pb.heading"}>
            <BaseConfig>
                <BaseConfig.Plugin {...props} />
            </BaseConfig>
        </CompositionScope>
    );
};

const HeadingToolbarNode = (props: React.ComponentProps<typeof BaseConfig.Node>) => {
    return (
        <CompositionScope name={"pb.heading"}>
            <BaseConfig>
                <BaseConfig.Node {...props} />
            </BaseConfig>
        </CompositionScope>
    );
};

export const Heading = {
    ToolbarAction: HeadingToolbarAction,
    Plugin: HeadingToolbarPlugin,
    Node: HeadingToolbarNode
};
