import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import "./App.scss";
import { LexicalEditorConfig } from "@webiny/lexical-editor";
import { LexicalColorPickerDropdown } from "./lexicalEditor/LexicalColorPickerDropdown";

const { FontColorAction } = LexicalEditorConfig;

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <LexicalEditorConfig>
                <FontColorAction.ColorPicker element={<LexicalColorPickerDropdown />} />
            </LexicalEditorConfig>
        </Admin>
    );
};
