import React from "react";
import { createComponentPlugin } from "@webiny/react-composition";
import TextVariableInput from "@webiny/app-page-builder/editor/plugins/elementSettings/variable/TextVariableInput";
import { LexicalVariableInputPlugin } from "~/plugins/elementSettings/variables/LexicalVariableInputPlugin";

export const TextVariableInputPlugin = createComponentPlugin(TextVariableInput, () => {
    return function TextVariableInputPlugin({ variableId }): JSX.Element {
        return <LexicalVariableInputPlugin tag={"h1"} variableId={variableId} />;
    };
});
