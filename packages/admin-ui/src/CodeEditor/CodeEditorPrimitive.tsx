import React, { useMemo } from "react";
import type { EditorProps } from "@monaco-editor/react";
import MonacoEditor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { makeDecoratable } from "~/utils";

interface CodeEditorPrimitiveProps extends Partial<EditorProps> {
    disabled?: boolean;
}

const monacoOptions: editor.IEditorConstructionOptions = {
    domReadOnly: true,
    readOnly: true,
    minimap: {
        enabled: false
    }
};

const DecoratableCodeEditorPrimitive = ({
    value,
    disabled,
    options: optionsInput,
    ...rest
}: CodeEditorPrimitiveProps) => {
    const options = useMemo((): editor.IDiffEditorConstructionOptions => {
        return {
            ...monacoOptions,
            ...optionsInput,
            domReadOnly: disabled === undefined ? monacoOptions.domReadOnly : disabled,
            readOnly: disabled === undefined ? monacoOptions.readOnly : disabled
        };
    }, [disabled]);
    return (
        <MonacoEditor
            height={"calc(100vh - 400px)"}
            {...rest}
            language={"json"}
            defaultValue={value}
            options={options}
        />
    );
};

const CodeEditorPrimitive = makeDecoratable("CodeEditorPrimitive", DecoratableCodeEditorPrimitive);

export { CodeEditorPrimitive, type CodeEditorPrimitiveProps };
