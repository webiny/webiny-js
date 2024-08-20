import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { ElementInput } from "~/inputs/ElementInput";

export const elementInputs = {
    text: new ElementInput<string>({
        name: "text",
        translatable: true,
        getDefaultValue: element => {
            return element.data.text.data.text;
        }
    }),
    /**
     * `tag` is an element input which exists for backwards compatibility with older rich-text implementations.
     */
    tag: new ElementInput<string>({
        name: "tag",
        getDefaultValue: element => {
            return element.data.text.desktop.tag;
        }
    })
};

export const HeadingRenderer = createRenderer<unknown, typeof elementInputs>(
    () => {
        const { getInputValues } = useRenderer();
        const inputs = getInputValues<typeof elementInputs>();
        const __html = inputs.text || "";
        const tag = inputs.tag || "h1";

        return React.createElement(tag, {
            dangerouslySetInnerHTML: { __html }
        });
    },
    { inputs: elementInputs }
);
