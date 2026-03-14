import { useMemo } from "react";
import { useIframeUrl } from "~/BaseEditor/defaultConfig/Content/Preview/useIframeUrl.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";

export const usePreviewLink = () => {
    const iframeUrl = useIframeUrl();
    const id = useSelectFromDocument(document => document.id);
    const path = useSelectFromDocument(document => document.properties.path);
    const documentType = useSelectFromDocument(document => document.metadata.documentType);

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

        // Add preview params
        url.searchParams.set("wb.preview", "true");
        url.searchParams.set("wb.type", documentType);
        url.searchParams.set("wb.id", String(id));
        url.searchParams.set("wb.path", path);
        return url.toString();
    }, [iframeUrl]);
};
