import { useMemo } from "react";
import { useTenantContext } from "@webiny/app-admin";
import type { PageDto } from "~/domain/Page/index.js";
import { usePreviewDomain } from "~/BaseEditor/defaultConfig/Content/Preview/usePreviewDomain.js";

export const usePagePreviewLink = (pageDto: PageDto) => {
    const { tenant } = useTenantContext();
    const { previewDomain } = usePreviewDomain();

    return useMemo(() => {
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
        } catch (e) {
            console.log(
                `Could not create preview URL for "${previewDomain}${pageDto.properties.path}"`
            );

            return null;
        }
    }, [previewDomain]);
};
