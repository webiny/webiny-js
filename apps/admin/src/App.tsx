import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import "./App.scss";

import { LexicalEditorConfig as BaseConfig } from "@webiny/lexical-editor";
import { CompositionScope } from "@webiny/app-admin";

/* import { LexicalEditorConfig } from "@webiny/app-page-builder"; */
const LexicalEditorConfig = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

const PbHeadingToolbarAction = (props: React.ComponentProps<typeof BaseConfig.ToolbarElement>) => {
    return (
        <CompositionScope name={"pb.heading"}>
            <BaseConfig>
                <BaseConfig.ToolbarElement {...props} />
            </BaseConfig>
        </CompositionScope>
    );
};

const PbParagraphToolbarAction = (
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

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <CompositionScope name={"pb.paragraph"}>
                <BaseConfig>
                    <BaseConfig.ToolbarElement
                        name={"QuoteAction"}
                        element={<button>Yo!</button>}
                    />
                </BaseConfig>
            </CompositionScope>
            <LexicalEditorConfig>
                <PbHeadingToolbarAction name={"TypographyAction"} remove />
                <PbHeadingToolbarAction name={"BoldAction"} remove />
                <PbHeadingToolbarAction name={"CodeHighlightAction"} remove />
                <PbParagraphToolbarAction name={"BoldAction"} remove />
                <PbParagraphToolbarAction name={"CodeHighlightAction"} remove />
                <PbParagraphToolbarAction name={"TextAlignmentAction"} remove />
            </LexicalEditorConfig>
        </Admin>
    );
};
