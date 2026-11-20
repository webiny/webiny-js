import type { Document } from "@webiny/website-builder-sdk";
import type { EditorInstance } from "@webiny/app-website-builder";

/** A page as the page editor holds it: a document with the page's status. */
export type PageDocument = Document & { status?: string };

export type PageEditor = EditorInstance<PageDocument>;
