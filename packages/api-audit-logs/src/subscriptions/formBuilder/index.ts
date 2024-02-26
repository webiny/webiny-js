import {
    onFormAfterCreateHook,
    onFormAfterDeleteHook,
    onFormsAfterExportHook,
    onFormsAfterImportHook
} from "./forms";
import {
    onFormRevisionAfterCreateHook,
    onFormRevisionAfterUpdateHook,
    onFormRevisionAfterDeleteHook,
    onFormRevisionAfterPublishHook,
    onFormRevisionAfterUnpublishHook
} from "./formRevisions";
import { onFormSubmissionsAfterExportHook } from "./formSubmissions";
import { onSettingsAfterUpdateHook } from "./settings";
import { AuditLogsContext } from "~/types";

export const createFormBuilderHooks = (context: AuditLogsContext) => {
    onFormAfterCreateHook(context);
    onFormAfterDeleteHook(context);
    onFormsAfterExportHook(context);
    onFormsAfterImportHook(context);
    onFormRevisionAfterCreateHook(context);
    onFormRevisionAfterUpdateHook(context);
    onFormRevisionAfterDeleteHook(context);
    onFormRevisionAfterPublishHook(context);
    onFormRevisionAfterUnpublishHook(context);
    onFormSubmissionsAfterExportHook(context);
    onSettingsAfterUpdateHook(context);
};
