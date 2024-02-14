import { CmsEntry, FbForm, FormStatsValues, Status } from "../types";

export const getStatsCommonFields = (form: FbForm): CmsEntry<FormStatsValues> => {
    const [formId, revisionId] = form.id.split("#");

    return {
        entryId: `${formId}-${revisionId}-stats`,
        id: `${formId}-${revisionId}-stats#0001`,
        locked: false,
        locale: form.locale,
        location: {
            folderId: "root"
        },
        modelId: "fbFormStat",
        status: Status.DRAFT,
        tenant: form.tenant,
        version: 1,
        webinyVersion: String(process.env.WEBINY_VERSION),
        values: {
            "number@formVersion": form.version,
            "number@submissions": form.stats.submissions,
            "number@views": form.stats.views,
            "text@formId": formId
        }
    };
};
