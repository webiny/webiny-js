import React from "react";
import { EditorConfig } from "~/BaseEditor/index.js";
import { TextInputRenderer } from "~/inputRenderers/TextInput.js";
import { NumberInputRenderer } from "~/inputRenderers/NumberInput.js";
import { BooleanInputRenderer } from "~/inputRenderers/BooleanInput.js";
import { TextareaInputRenderer } from "~/inputRenderers/TextareaInput.js";
import { LexicalInputRenderer } from "~/inputRenderers/LexicalInput/LexicalInput.js";
import { DefaultLexicalConfig } from "~/inputRenderers/LexicalInput/DefaultLexicalConfig.js";
import { SlotInputRenderer } from "~/inputRenderers/SlotInput.js";
import { GridLayoutInputRenderer } from "~/inputRenderers/GridLayoutInput.js";
import { SelectInputRenderer } from "~/inputRenderers/SelectInput.js";
import { FileInputRenderer } from "~/inputRenderers/FileInput.js";
import { FragmentSelectorInputRenderer } from "~/inputRenderers/FragmentSelectorInput.js";
import { ObjectInputRenderer } from "~/inputRenderers/ObjectInput/ObjectInputRenderer.js";

export const ElementInputRenderers = () => {
    return (
        <>
            <EditorConfig.ElementInput.Renderer
                name={"Webiny/Slot"}
                component={SlotInputRenderer}
            />
            <EditorConfig.ElementInput.Renderer
                name={"Webiny/Input"}
                component={TextInputRenderer}
            />
            <EditorConfig.ElementInput.Renderer
                name={"Webiny/Select"}
                component={SelectInputRenderer}
            />
            <EditorConfig.ElementInput.Renderer
                name={"Webiny/Textarea"}
                component={TextareaInputRenderer}
            />
            <EditorConfig.ElementInput.Renderer
                name={"Webiny/Number"}
                component={NumberInputRenderer}
            />
            {/* Configure Lexical Editor*/}
            <DefaultLexicalConfig />
            <EditorConfig.ElementInput.Renderer
                name={"Webiny/Lexical"}
                component={LexicalInputRenderer}
            />
            <EditorConfig.ElementInput.Renderer
                name={"Webiny/Switch"}
                component={BooleanInputRenderer}
            />
            <EditorConfig.ElementInput.Renderer
                name={"Webiny/GridLayout"}
                component={GridLayoutInputRenderer}
            />
            <EditorConfig.ElementInput.Renderer
                name={"Webiny/FileManager"}
                component={FileInputRenderer}
            />
            <EditorConfig.ElementInput.Renderer
                name={"Webiny/FragmentSelector"}
                component={FragmentSelectorInputRenderer}
            />
            <EditorConfig.ElementInput.Renderer
                name={"Webiny/Object"}
                component={ObjectInputRenderer}
            />
        </>
    );
};
