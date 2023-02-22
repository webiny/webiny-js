import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { LexicalEditorPlugin } from "@webiny/lexical-editor-pb-element";
import "./App.scss";

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <LexicalEditorPlugin />
        </Admin>
    );
};
