import React from "react";
import { createDecorator } from "@webiny/react-composition";
import { RichVariableInput } from "@webiny/app-page-builder/editor/plugins/elementSettings/variable/RichVariableInput";
import { LexicalVariableInputPlugin } from "~/plugins/elementSettings/variables/LexicalVariableInputPlugin";
import { useVariable } from "@webiny/app-page-builder/hooks/useVariable";
import { isValidLexicalData } from "@webiny/lexical-editor";

export const RichVariableInputPlugin = createDecorator(RichVariableInput, Original => {
    return function RichVariableInputPlugin({ variableId }) {
        const { value } = useVariable(variableId);
        if (!isValidLexicalData(value)) {
            return <Original variableId={variableId} />;
        }
        return <LexicalVariableInputPlugin tag={"p"} variableId={variableId} />;
    };
});
