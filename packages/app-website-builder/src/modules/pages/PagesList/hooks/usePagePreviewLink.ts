import { useMemo } from "react";
import { useTenancy } from "@webiny/app-admin";
import type { PageDto } from "~/domain/Page/index.js";
import { usePreviewDomain } from "~/BaseEditor/defaultConfig/Content/Preview/usePreviewDomain.js";

export const usePagePreviewLink = (pageDto: PageDto) => {
    const { tenant } = useTenancy();
    const { previewDomain } = usePreviewDomain();

    return useMemo(() => {
        if (!previewDomain || !pageDto.properties.path) {
            return null;
        }

        const url = new URL(`${previewDomain}${pageDto.properties.path}`);
        url.searchParams.set("wb.preview", "true");
        url.searchParams.set("wb.type", pageDto.metadata.documentType);
        url.searchParams.set("wb.id", pageDto.id);
        url.searchParams.set("wb.tenant", tenant!);
        url.searchParams.set("wb.path", pageDto.properties.path);
        return url.toString();
    }, [previewDomain]);
};
