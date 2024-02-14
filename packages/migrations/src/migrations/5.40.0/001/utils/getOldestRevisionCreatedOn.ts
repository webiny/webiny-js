import { FbForm } from "~/migrations/5.40.0/001/types";
import { createFormEntity } from "~/migrations/5.40.0/001/entities/createFormEntity";
import { queryOne } from "@webiny/db-dynamodb";

const cachedFormCreatedOn: Record<string, string> = {};

export interface GetOldestRevisionCreatedOnParams {
    form: FbForm;
    formEntity: ReturnType<typeof createFormEntity>;
}

export const getOldestRevisionCreatedOn = async (params: GetOldestRevisionCreatedOnParams) => {
    const { form, formEntity } = params;

    if (cachedFormCreatedOn[form.formId]) {
        return cachedFormCreatedOn[form.formId];
    }

    if (form.version === 1) {
        cachedFormCreatedOn[form.formId] = form.createdOn;
    } else {
        const result = await formEntity.query(`T#${form.tenant}#L#${form.locale}#FB#F`, {
            limit: 1,
            beginsWith: `${form.formId}#`,
            attributes: ["createdOn"]
        });

        const oldestRevision = result.Items?.[0];
        if (oldestRevision) {
            cachedFormCreatedOn[form.formId] = oldestRevision.createdOn;
        }
    }

    return cachedFormCreatedOn[form.formId];
};

export const getDdbEsOldestRevisionCreatedOn = async (params: GetOldestRevisionCreatedOnParams) => {
    const { form, formEntity } = params;

    if (cachedFormCreatedOn[form.formId]) {
        return cachedFormCreatedOn[form.formId];
    }

    if (form.version === 1) {
        cachedFormCreatedOn[form.formId] = form.createdOn;
    } else {
        const oldestRevision = await queryOne<FbForm>({
            entity: formEntity,
            partitionKey: `T#${form.tenant}#L#${form.locale}#FB#F#${form.formId}`,
            options: {
                beginsWith: "REV#"
            }
        });

        if (oldestRevision) {
            cachedFormCreatedOn[form.formId] = oldestRevision.createdOn;
        }
    }

    return cachedFormCreatedOn[form.formId];
};
