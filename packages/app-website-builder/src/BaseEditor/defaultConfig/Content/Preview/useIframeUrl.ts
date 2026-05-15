import { useEffect, useMemo, useState } from "react";
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

    const baseUrl = useMemo(() => {
        if (!previewDomain) {
            return null;
        }
        const url = new URL(`${previewDomain}${path}`);
        addSearchParamsFromDocument(tenant!, url, id, documentType);
        return url.toString();
    }, [previewDomain, id, path, documentType]);

    const [url, setUrl] = useState<string | null>(baseUrl);

    useEffect(() => {
        if (!baseUrl) {
            setUrl(null);
            return;
        }

        if (!modifier) {
            setUrl(baseUrl);
            return;
        }

        const urlObj = new URL(baseUrl);
        modifier.modify(urlObj).then(() => setUrl(urlObj.toString()));
    }, [baseUrl, modifier]);

    return url;
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
