import { h } from "vue";
import type { ComponentProps } from "~/types.js";

export const createLexicalValue = (value: string) => ({
    state: `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"${value}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"wby-paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}`,
    html: `<p class="wb-paragraph-1">${value}</p>`
});

type LexicalProps = ComponentProps<{
    content: { html?: string };
}>;

/**
 * Renders Lexical rich-text content as raw HTML.
 * The HTML is produced by the editor and stored in `inputs.content.html`.
 */
export const LexicalComponent = (props: LexicalProps) => {
    const html = props.inputs?.content?.html;
    if (!html) {
        return null;
    }
    return h("div", { innerHTML: html });
};
