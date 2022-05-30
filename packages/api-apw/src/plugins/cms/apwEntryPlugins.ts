import { ApwContentTypes, ApwContext } from "~/types";
import { fetchModel, getEntryTitle } from "./utils";

export const apwEntryPlugins = ({ apw, cms }: ApwContext) => {
    if (!apw || !cms) {
        return;
    }

    apw.addContentGetter(ApwContentTypes.CMS_ENTRY, async (id, settings) => {
        const model = await fetchModel(cms, id, settings.modelId);

        const item = await cms.getEntryById(model, id);

        if (!item) {
            return null;
        }

        return {
            ...item,
            meta: {
                ...(item.meta || {})
            },
            title: getEntryTitle(model, item)
        };
    });

    apw.addContentPublisher(ApwContentTypes.PAGE, async (id, settings) => {
        const model = await fetchModel(cms, id, settings.modelId);
        await cms.publishEntry(model, id);
        return true;
    });

    apw.addContentUnPublisher(ApwContentTypes.PAGE, async (id, settings) => {
        const model = await fetchModel(cms, id, settings.modelId);
        await cms.unpublishEntry(model, id);
        return true;
    });
};
