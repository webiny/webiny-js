import { ParsedElementNode } from "~/types";

export const linkHtmlTransformer = (
    parsedElement: ParsedElementNode,
    linkNode: Record<string, any>
) => {
    return `<a href="${linkNode?.url}">${parsedElement.text}</a>`;
};

export const paragraphHtmlTransformer = (parsedElement: ParsedElementNode) => {
    if (parsedElement.text.trim().length === 0) {
        return "<br>";
    }
    return parsedElement.html;
};

export const paragraphTextTransformer = (parsedElement: ParsedElementNode) => {
    if (parsedElement.text.trim().length === 0) {
        return "<br>";
    }
    return parsedElement.html;
};
