import type { EditorPage } from "@webiny/website-builder-sdk";
import type { UpdateVariantInput, VariantContentDto } from "~/features/experiments/index.js";

/**
 * Map a variant's stored content onto an editor document that mirrors the page.
 *
 * The canvas keys its document store by `properties.id` and the preview iframe is addressed by the
 * document `id`, so both are set to the variant's revision id and the document is presented as a
 * "page" on the page's own path — that's how the site's editing SDK streams and renders it live.
 */
export const variantToEditorDocument = (
    variant: VariantContentDto,
    page: EditorPage
): EditorPage => ({
    id: variant.id,
    version: page.version ?? 1,
    state: {},
    // Base on the page so required properties/metadata are always present; variant values win.
    properties: {
        ...page.properties,
        ...(variant.properties ?? {}),
        id: variant.id,
        path: page.properties.path
    },
    extensions: variant.extensions ?? {},
    metadata: {
        ...page.metadata,
        ...(variant.metadata ?? {}),
        documentType: "page"
    },
    bindings: (variant.bindings ?? {}) as EditorPage["bindings"],
    elements: (variant.elements ?? {}) as EditorPage["elements"],
    status: page.status,
    location: page.location
});

/** Extract the persistable content fields from an edited variant document. */
export const editorDocumentToVariantUpdate = (document: EditorPage): UpdateVariantInput => ({
    properties: document.properties,
    metadata: document.metadata,
    bindings: document.bindings,
    elements: document.elements,
    extensions: document.extensions
});
