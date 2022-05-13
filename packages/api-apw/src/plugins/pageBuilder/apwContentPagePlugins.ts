import { ContextPlugin } from "@webiny/handler";
import { ApwContentTypes, ApwContext, PageWithWorkflow } from "~/types";

export const apwContentPagePlugins = () =>
    new ContextPlugin<ApwContext>(async context => {
        const { apw, pageBuilder } = context;

        if (!apw) {
            return;
        }

        apw.addContentGetter(ApwContentTypes.PAGE, async id => {
            return pageBuilder.getPage<PageWithWorkflow>(id);
        });

        apw.addContentPublisher(ApwContentTypes.PAGE, async id => {
            await pageBuilder.publishPage<PageWithWorkflow>(id);
            return true;
        });

        apw.addContentUnPublisher(ApwContentTypes.PAGE, async id => {
            await pageBuilder.unpublishPage<PageWithWorkflow>(id);
            return true;
        });
    });
