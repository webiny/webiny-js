import { useMemo } from "react";
import { useTenantContext } from "@webiny/app-admin";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { usePreviewDomain } from "../usePreviewDomain.js";
import { usePreviewUrlParams } from "~/features/previewUrl/usePreviewUrlParams.js";

export const useIframeUrl = () => {
    const { tenant } = useTenantContext();
    const { previewDomain } = usePreviewDomain();
    const modifier = usePreviewUrlParams();

    const id = useSelectFromDocument(document => document.id);
    const documentType = useSelectFromDocument(document => document.metadata.documentType);
    const path = useSelectFromDocument(document => document.properties.path);

    return useMemo(() => {
        if (!previewDomain) {
            return null;
        }
        const newUrl = new URL(`${previewDomain}${path}`);
        addSearchParamsFromDocument(tenant!, newUrl, id, documentType);
        if (modifier) {
            for (const [key, value] of Object.entries(modifier.getQueryParams())) {
                newUrl.searchParams.set(key, value);
            }
        }
        return newUrl.toString();
    }, [previewDomain, id, path, documentType, modifier]);
};

function addSearchParamsFromDocument(tenant: string, url: URL, id: string, documentType: string) {
    const searchParams = url.searchParams;
    searchParams.set("wb.editing", "true");
    searchParams.set("wb.type", documentType);
    searchParams.set("wb.id", id);
    searchParams.set("wb.path", url.pathname);
    searchParams.set("wb.referrer", window.location.origin);
    searchParams.set("wb.tenant", tenant);
}
