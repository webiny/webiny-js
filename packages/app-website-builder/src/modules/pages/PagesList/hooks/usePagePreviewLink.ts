import { useEffect, useMemo, useState } from "react";
import { useTenantContext } from "@webiny/app-admin";
import type { PageDto } from "~/domain/Page/index.js";
import { usePreviewDomain } from "~/BaseEditor/defaultConfig/Content/usePreviewDomain.js";
import { usePreviewUrlParams } from "~/features/previewUrl/usePreviewUrlParams.js";

export const usePagePreviewLink = (pageDto: PageDto) => {
    const { tenant } = useTenantContext();
    const { previewDomain } = usePreviewDomain();
    const modifier = usePreviewUrlParams();

    const baseUrl = useMemo(() => {
        if (!previewDomain || !pageDto.properties.path) {
            return null;
        }

        try {
            const url = new URL(`${previewDomain}${pageDto.properties.path}`);
            url.searchParams.set("wb.preview", "true");
            url.searchParams.set("wb.type", pageDto.metadata.documentType);
            url.searchParams.set("wb.id", pageDto.id);
            url.searchParams.set("wb.tenant", tenant!);
            url.searchParams.set("wb.path", pageDto.properties.path);
            return url.toString();
        } catch {
            console.log(
                `Could not create preview URL for "${previewDomain}${pageDto.properties.path}"`
            );

            return null;
        }
    }, [previewDomain]);

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
