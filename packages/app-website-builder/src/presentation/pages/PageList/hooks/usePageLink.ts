import { useMemo } from "react";
import type { PageDto } from "~/domain/Page/index.js";
import { usePreviewDomain } from "~/BaseEditor/defaultConfig/Content/usePreviewDomain.js";

export const usePageLink = (pageDto: PageDto) => {
    const { previewDomain } = usePreviewDomain();

    return useMemo(() => {
        if (!previewDomain || !pageDto.properties.path) {
            return null;
        }

        try {
            return new URL(`${previewDomain}${pageDto.properties.path}`).toString();
        } catch {
            return null;
        }
    }, [previewDomain, pageDto.properties.path]);
};
