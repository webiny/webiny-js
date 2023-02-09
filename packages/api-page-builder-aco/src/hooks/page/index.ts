import { ContextPlugin } from "@webiny/api";

import { onPageAfterCreateHook } from "~/hooks/page/onPageAfterCreate.hook";
import { onPageAfterCreateFromHook } from "~/hooks/page/onPageAfterCreateFrom.hook";
import { onPageAfterDeleteHook } from "~/hooks/page/onPageAfterDelete.hook";
import { onPageAfterPublishHook } from "~/hooks/page/onPageAfterPublish.hook";
import { onPageAfterUnpublishHook } from "~/hooks/page/onPageAfterUnpublish.hook";
import { onPageAfterUpdateHook } from "~/hooks/page/onPageAfterUpdate.hook";

import { Context } from "~/types";

export const createPageHooks = (): ContextPlugin<Context>[] => {
    return [
        onPageAfterCreateHook(),
        onPageAfterCreateFromHook(),
        onPageAfterDeleteHook(),
        onPageAfterPublishHook(),
        onPageAfterUnpublishHook(),
        onPageAfterUpdateHook()
    ];
};