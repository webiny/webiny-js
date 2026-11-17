import type { Document } from "@webiny/website-builder-sdk";
import type { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";

/** A page as the page editor holds it: a document with the page's status. */
export type PageDocument = Document & { status?: string };

export type PageEditor = Editor<PageDocument>;
