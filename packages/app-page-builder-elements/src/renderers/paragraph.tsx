import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { ElementInput } from "~/inputs/ElementInput";

export const elementInputs = {
    text: ElementInput.create<string>({
        name: "text",
        type: "richText",
        translatable: true,
        getDefaultValue: ({ element }) => {
            return element.data.text.data.text;
        }
    })
};

/**
 * This renderer works with plain HTML. In the past, we used to have the MediumEditor, and it produced plain HTML.
 * For the new Lexical Editor, we decorate this renderer from the `@webiny/app-page-builder` package.
 */
export const ParagraphRenderer = createRenderer<unknown, typeof elementInputs>(
    () => {
        const { getInputValues } = useRenderer();
        const inputs = getInputValues<typeof elementInputs>();
        const __html = inputs.text || "";

        // If the text already contains `p` tags (happens when c/p-ing text into the editor),
        // we don't want to wrap it with another pair of `p` tag.
        // Additional note: alternatively, instead of adding the `p-wrap` wrapper tag, we tried
        // removing the wrapper `p` tags from the received text. But that wasn't enough. There
        // were cases where the received text was not just one `p` tag, but an array of `p` tags.
        // In that case, we still need a separate wrapper element. So, we're leaving this solution.
        if (__html.startsWith("<p")) {
            // @ts-expect-error We don't need type-checking here.
            return <p-wrap dangerouslySetInnerHTML={{ __html }} />;
        }

        return <p dangerouslySetInnerHTML={{ __html }} />;
    },
    { inputs: elementInputs }
);
