import { createComponentPlugin } from "@webiny/react-composition";
import React, { FC } from "react";
import {CustomRichTextEditor} from "~/components/Editor/CustomRichTextEditor";
import {RichTextEditorTag} from "~/types";

interface AddRichTextEditorProps {
    forTag: RichTextEditorTag;
    toolbarType: string;
    placeholder?: string;
    initValue?: string;
    /**
     * @description Lexical plugins
     */
    children?: React.ReactNode;
}

export const AddRichTextEditor: FC<AddRichTextEditorProps> = (
    {forTag, placeholder, toolbarType, children }) => {
    const CustomRichTextEditorPlugin = React.memo(
        createComponentPlugin(CustomRichTextEditor, Original => {
            return function CustomRichTextEditor({ tag, value, onChange }): JSX.Element {
                return (
                    <>
                        {forTag === tag ?
                        <Original toolbarType={toolbarType}
                                  tag={tag}
                                  placeholderText={placeholder}
                                  value={value}
                                  onChange={onChange}>
                            {children}
                        </Original> : null}
                    </>
                );
            };
        })
    );

    return <CustomRichTextEditorPlugin />;
};
