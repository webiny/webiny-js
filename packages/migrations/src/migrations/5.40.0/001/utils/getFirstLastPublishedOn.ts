import { CmsEntryWithMeta } from "../types";
import { FbForm } from "~/migrations/5.40.0/001/types";
import { createFormEntity } from "~/migrations/5.40.0/001/entities/createFormEntity";

const cachedFormFirstLastPublishedOnBy: Record<
    string,
    Pick<
        CmsEntryWithMeta,
        "firstPublishedOn" | "lastPublishedOn" | "firstPublishedBy" | "lastPublishedBy"
    >
> = {};

export interface getFirstLastPublishedOnParams {
    form: FbForm;
    formEntity: ReturnType<typeof createFormEntity>;
}

export const getFirstLastPublishedOnBy = async (params: getFirstLastPublishedOnParams) => {
    const { form, formEntity } = params;

    if (cachedFormFirstLastPublishedOnBy[form.formId]) {
        return cachedFormFirstLastPublishedOnBy[form.formId];
    }

    cachedFormFirstLastPublishedOnBy[form.formId] = {
        firstPublishedOn: null,
        lastPublishedOn: null,
        firstPublishedBy: null,
        lastPublishedBy: null
    };

    const result = await formEntity.query(`T#${form.tenant}#L#${form.locale}#FB#F#LP`, {
        limit: 1,
        eq: form.formId,
        attributes: ["createdBy", "publishedOn"]
    });

    const publishedForm = result.Items?.[0];
    if (publishedForm) {
        cachedFormFirstLastPublishedOnBy[form.formId] = {
            firstPublishedOn: publishedForm.publishedOn || null,
            lastPublishedOn: publishedForm.publishedOn || null,
            firstPublishedBy: form.createdBy || null,
            lastPublishedBy: form.createdBy || null
        };
    }

    return cachedFormFirstLastPublishedOnBy[form.formId];
};
