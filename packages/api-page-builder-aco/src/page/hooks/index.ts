import { onPageAfterCreateHook } from "~/page/hooks/onPageAfterCreate.hook";
import { onPageAfterCreateFromHook } from "~/page/hooks/onPageAfterCreateFrom.hook";
import { onPageAfterDeleteHook } from "~/page/hooks/onPageAfterDelete.hook";
import { onPageAfterPublishHook } from "~/page/hooks/onPageAfterPublish.hook";
import { onPageAfterUnpublishHook } from "~/page/hooks/onPageAfterUnpublish.hook";
import { onPageAfterUpdateHook } from "~/page/hooks/onPageAfterUpdate.hook";

import { PbAcoContext } from "~/types";

export const createPageHooks = (context: PbAcoContext) => {
    onPageAfterCreateHook(context);
    onPageAfterCreateFromHook(context);
    onPageAfterDeleteHook(context);
    onPageAfterPublishHook(context);
    onPageAfterUnpublishHook(context);
    onPageAfterUpdateHook(context);
};

export const createImportExportPageHooks = (context: PbAcoContext) => {
    onPageAfterCreateHook(context);
    onPageAfterUpdateHook(context);
};
