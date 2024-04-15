import { createLexicalStateTransformer } from "@webiny/lexical-converter";
import { FieldWithValue } from "./FieldTracker";

const transformer = createLexicalStateTransformer();

const extractLinksFromHTML = (html: string) => {
    const doc = document.createElement("html");
    doc.innerHTML = `<html><body>${html}</body></html>`;
    const links = Array.from(doc.getElementsByTagName("a"));

    return links.map(link => link.getAttribute("href") as string);
};

export type FieldLink = { label: string; path: string; links: string[] };

export const extractRichTextHtml = (fields: FieldWithValue[]) => {
    return fields
        .filter(field => field.type === "rich-text" && !!field.value)
        .map(field => transformer.toHtml(field.value));
};

export const extractRichTextLinks = (fields: FieldWithValue[]) => {
    return fields
        .filter(field => field.type === "rich-text" && !!field.value)
        .reduce<FieldLink[]>((acc, field) => {
            const links = extractLinksFromHTML(transformer.toHtml(field.value));
            if (!links.length) {
                return acc;
            }

            return [
                ...acc,
                {
                    path: field.path,
                    label: field.label,
                    links
                }
            ];
        }, []);
};
