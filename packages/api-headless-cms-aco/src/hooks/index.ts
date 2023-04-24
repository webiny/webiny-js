import { CmsAcoContext } from "~/types";
import { attachOnEntryAfterCreate } from "~/hooks/onEntryAfterCreate";
import { attachOnEntryRevisionAfterCreate } from "~/hooks/onEntryRevisionAfterCreate";
import { attachOnEntryAfterUpdate } from "~/hooks/onEntryAfterUpdate";
import { attachOnEntryAfterUnpublish } from "~/hooks/onEntryAfterUnpublish";
import { attachOnEntryAfterPublish } from "~/hooks/onEntryAfterPublish";
import { attachOnEntryAfterDelete } from "~/hooks/onEntryAfterDelete";

export const attachHeadlessCmsHooks = (context: CmsAcoContext): void => {
    attachOnEntryAfterCreate(context);
    attachOnEntryRevisionAfterCreate(context);
    attachOnEntryAfterUpdate(context);
    attachOnEntryAfterDelete(context);
    attachOnEntryAfterPublish(context);
    attachOnEntryAfterUnpublish(context);
};
