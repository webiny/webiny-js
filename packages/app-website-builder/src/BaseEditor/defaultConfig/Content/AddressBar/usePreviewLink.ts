import { useMemo } from "react";
import { useIframeUrl } from "~/BaseEditor/defaultConfig/Content/Preview/useIframeUrl.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";

export const usePreviewLink = () => {
    const iframeUrl = useIframeUrl();
    const id = useSelectFromDocument(document => document.id);
    const path = useSelectFromDocument(document => document.properties.path);
    const documentType = useSelectFromDocument(document => document.metadata.documentType);
    // // Set when the edited document is an A/B variant (see variantDocument.ts). When present, the
    // // preview must open the variant's draft — not the page the document borrows its identity from.
    // const previewVariantId = useSelectFromDocument(
    //     document =>
    //         (document.metadata as Record<string, any>).wbVariantPreviewId as string | undefined
    // );

    return useMemo(() => {
        if (!iframeUrl) {
            return "";
        }
        const url = new URL(iframeUrl);

        // Remove all `wb.` params
        url.searchParams.forEach((_, key) => {
            if (key.startsWith("wb.")) {
                url.searchParams.delete(key);
            }
        });

        // if (previewVariantId) {
        //     // Variant draft preview — the site renders this variant's draft content on its page.
        //     url.searchParams.set("wb-variant-draft", previewVariantId);
        //     return url.toString();
        // }

        // Add preview params
        url.searchParams.set("wb.preview", "true");
        url.searchParams.set("wb.type", documentType);
        url.searchParams.set("wb.id", String(id));
        url.searchParams.set("wb.path", path);
        return url.toString();
    }, [iframeUrl, id, path, documentType, /*previewVariantId*/]);
};
