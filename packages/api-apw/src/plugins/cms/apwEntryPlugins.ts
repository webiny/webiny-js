import { AdvancedPublishingWorkflow, ApwContentTypes } from "~/types";
import { fetchModel, getEntryTitle } from "./utils";
import { HeadlessCms } from "@webiny/api-headless-cms/types";

interface ApwEntryPlugins {
    apw: AdvancedPublishingWorkflow;
    cms: HeadlessCms;
}
export const apwEntryPlugins = (params: ApwEntryPlugins) => {
    const { cms, apw } = params;

    apw.addContentGetter(ApwContentTypes.CMS_ENTRY, async (id, settings) => {
        const model = await fetchModel(cms, id, settings);

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

    apw.addContentPublisher(ApwContentTypes.CMS_ENTRY, async (id, settings) => {
        const model = await fetchModel(cms, id, settings);
        await cms.publishEntry(model, id);
        return true;
    });

    apw.addContentUnPublisher(ApwContentTypes.CMS_ENTRY, async (id, settings) => {
        const model = await fetchModel(cms, id, settings);
        await cms.unpublishEntry(model, id);
        return true;
    });
};
