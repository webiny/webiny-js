import React from "react";
import { EditorConfig } from "~/editor";
import { useActiveElement } from "~/editor";
import { Input } from "@webiny/ui/Input";
import type { PbEditorElement } from "~/types";
import { useInputBinding } from "./useInputBinding";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";

const { Ui } = EditorConfig;

export interface OnElementTypeProps {
    elementType: string;
    children: React.ReactNode;
}

const OnElementType = ({ elementType, children }: OnElementTypeProps) => {
    const [element] = useActiveElement();

    if (element?.type === elementType) {
        return <>{children}</>;
    }

    return null;
};

export interface ElementInputProps {
    elementType: string;
    inputName: string;
    label: string;
}

export const ElementBinding = ({ elementType, inputName, label }: ElementInputProps) => {
    return (
        <Ui.Sidebar.Element
            name={`elementInput:${elementType}:${inputName}`}
            group={"dataSettings"}
            element={
                <OnElementType elementType={elementType}>
                    <ElementInputUi inputName={inputName} label={label} />
                </OnElementType>
            }
        />
    );
};

interface ElementInputUiProps {
    inputName: string;
    label: string;
}

const ElementInputUi = ({ inputName, label }: ElementInputUiProps) => {
    const [element] = useActiveElement<PbEditorElement>();
    const { binding, onChange } = useInputBinding(element, inputName);
    const value = binding ? binding.getSource() : "";

    return (
        <>
            <DelayedOnChange value={value} onChange={onChange}>
                {({ value, onChange }) => {
                    // @ts-expect-error TODO
                    return <Input label={label} value={value} onChange={onChange} />;
                }}
            </DelayedOnChange>
        </>
    );
};
