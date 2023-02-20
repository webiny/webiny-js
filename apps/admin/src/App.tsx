import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import "./App.scss";
import { LexicalEditorPlugin } from "@webiny/lexical-editor-pb-element";
export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <LexicalEditorPlugin />
        </Admin>
    );
};
