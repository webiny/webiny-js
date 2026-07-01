import type { EditorPage } from "@webiny/website-builder-sdk";
import type { UpdateVariantInput, VariantContentDto } from "~/features/experiments/index.js";

/**
 * Map a variant's stored content onto an editor document that keeps the *page's* identity.
 *
 * The preview iframe is addressed by the document `id` and the canvas keys its store by `wb.id`
 * (and renders by `properties.id`). The site resolves the server-side base by that id via
 * `getPageById`, which only works for a real page — a variant id is not a page. So the document
 * keeps the page's id/path/`properties.id` (a valid, resolvable base — the page draft), while its
 * content (elements, bindings, properties, …) is the variant's. The editor streams this content
 * over the base, and autosave targets the actual variant separately (see VariantAutoSave). This is
 * why control and variant share the same `wb.id`; the switch is handled by re-mounting the editor.
 */
export const variantToEditorDocument = (
    variant: VariantContentDto,
    page: EditorPage
): EditorPage => ({
    ...page,
    // Variant content, but the page's identity (id/path) so the preview base resolves.
    properties: {
        ...page.properties,
        ...(variant.properties ?? {}),
        id: (page.properties as Record<string, any>).id ?? page.id,
        path: page.properties.path
    } as EditorPage["properties"],
    metadata: {
        ...page.metadata,
        ...(variant.metadata ?? {}),
        documentType: (page.metadata as Record<string, any>).documentType ?? "page"
    } as EditorPage["metadata"],
    bindings: (variant.bindings ?? page.bindings) as EditorPage["bindings"],
    elements: (variant.elements ?? page.elements) as EditorPage["elements"],
    extensions: variant.extensions ?? page.extensions ?? {}
});

/** Extract the persistable content fields from an edited variant document. */
export const editorDocumentToVariantUpdate = (document: EditorPage): UpdateVariantInput => ({
    properties: document.properties,
    metadata: document.metadata,
    bindings: document.bindings,
    elements: document.elements,
    extensions: document.extensions
});
