import React, { useCallback } from "react";
import useUpdateHandlers from "@webiny/app-page-builder/editor/plugins/elementSettings/useUpdateHandlers";
import { PbEditorElement } from "@webiny/app-page-builder/types";
import { useRenderer } from "@webiny/app-page-builder-elements";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { LexicalEditor } from "~/LexicalEditor";

interface LexicalTextEditorProps {
    text: string;
    type: "heading" | "paragraph";
}

const DATA_NAMESPACE = "data.text";

export const LexicalTextEditor = ({ text, type }: LexicalTextEditorProps) => {
    const { getElement } = useRenderer();
    const element = getElement();

    const { getUpdateValue } = useUpdateHandlers({
        element: element as PbEditorElement,
        dataNamespace: DATA_NAMESPACE
    });

    const onChange = useCallback(
        (value: string) => {
            getUpdateValue(DATA_NAMESPACE)(value);
        },
        [getUpdateValue]
    );

    if (!element) {
        return null;
    }

    return (
        <DelayedOnChange value={text} onChange={onChange}>
            {({ value, onChange }) => (
                <LexicalEditor type={type} value={value} onChange={onChange} />
            )}
        </DelayedOnChange>
    );
};
