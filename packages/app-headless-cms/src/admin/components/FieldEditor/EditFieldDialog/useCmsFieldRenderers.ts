import { useMemo } from "react";
import { useContainer } from "@webiny/app";
import {
    CmsFieldRenderer,
    type ICmsFieldRenderer
} from "~/presentation/fieldRenderers/abstractions.js";
import { useModel } from "~/admin/components/ModelProvider/index.js";
import { useModelField } from "~/admin/components/ModelFieldProvider/index.js";

const hiddenLast = (a: ICmsFieldRenderer, b: ICmsFieldRenderer) => {
    if (a.rendererName === "hidden") {
        return 1;
    }

    if (b.rendererName === "hidden") {
        return -1;
    }

    return 0;
};

export const useCmsFieldRenderers = (): ICmsFieldRenderer[] => {
    const container = useContainer();

    const { model } = useModel();
    const { field } = useModelField();

    return useMemo(() => {
        const all = container.resolveAll(CmsFieldRenderer);
        return all.filter(r => r.canUse({ field, model })).sort(hiddenLast);
    }, [container, field, model]);
};
