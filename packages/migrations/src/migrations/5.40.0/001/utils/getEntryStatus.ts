import { FbForm, Status } from "~/migrations/5.40.0/001/types";
import { createFormEntity } from "~/migrations/5.40.0/001/entities/createFormEntity";
import { queryOne } from "~/utils";

export interface GetRevisionStatusParams {
    form: FbForm;
    formEntity: ReturnType<typeof createFormEntity>;
}

export const getRevisionStatus = async (params: GetRevisionStatusParams): Promise<Status> => {
    const { form, formEntity } = params;

    const result = await formEntity.query(`T#${form.tenant}#L#${form.locale}#FB#F#LP`, {
        limit: 1,
        eq: form.formId,
        attributes: ["id"]
    });

    const publishedForm = result.Items?.[0];

    // If published entry is not provided OR the revision id differs from the published id
    if (!publishedForm || form.id !== publishedForm.id) {
        // If the revision is locked: this means the revision has been published and unpublished
        if (form.locked) {
            return Status.UNPUBLISHED;
        }

        // else the revision is in draft
        return Status.DRAFT;
    }

    // Return published
    return Status.PUBLISHED;
};

export const getDdbEsRevisionStatus = async (params: GetRevisionStatusParams): Promise<Status> => {
    const { form, formEntity } = params;

    const publishedForm = await queryOne<FbForm>({
        entity: formEntity,
        partitionKey: `T#${form.tenant}#L#${form.locale}#FB#F#${form.formId}`,
        options: {
            eq: "LP"
        }
    });

    // If published entry is not provided OR the revision id differs from the published id
    if (!publishedForm || form.id !== publishedForm.id) {
        // If the revision is locked: this means the revision has been published and unpublished
        if (form.locked) {
            return Status.UNPUBLISHED;
        }

        // else the revision is in draft
        return Status.DRAFT;
    }

    // Return published
    return Status.PUBLISHED;
};
