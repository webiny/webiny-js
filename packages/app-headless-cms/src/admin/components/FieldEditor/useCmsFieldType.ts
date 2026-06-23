import { useMemo } from "react";
import { useContainer } from "@webiny/app";
import { CmsFieldType, type ICmsFieldType } from "~/presentation/fieldTypes/abstractions.js";

export function useCmsFieldTypes(): Map<string, ICmsFieldType> {
    const container = useContainer();

    return useMemo(() => {
        const all = container.resolveAll(CmsFieldType);
        const map = new Map<string, ICmsFieldType>();
        for (const ft of all) {
            map.set(ft.type, ft);
        }
        return map;
    }, [container]);
}
