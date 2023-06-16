import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import "./App.scss";
import { PbLexicalEditorPlugin } from "./LexicalEditor/PbLexicalEditorPlugin";
import { CmsLexicalEditorPlugin } from "./LexicalEditor/CmsLexicalEditorPlugin";

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <CmsLexicalEditorPlugin />
            <PbLexicalEditorPlugin />
        </Admin>
    );
};
