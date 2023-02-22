import React from "react";
import { createComponentPlugin } from "@webiny/react-composition";
import RichVariableInput from "@webiny/app-page-builder/editor/plugins/elementSettings/variable/RichVariableInput";
import { LexicalVariableInputPlugin } from "~/plugins/elementSettings/variables/LexicalVariableInputPlugin";

export const RichVariableInputPlugin = createComponentPlugin(RichVariableInput, () => {
    return function RichVariableInputPlugin({ variableId }) {
        return <LexicalVariableInputPlugin tag={"p"} variableId={variableId} />;
    };
});
