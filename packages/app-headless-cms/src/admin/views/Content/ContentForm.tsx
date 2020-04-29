import React from "react";
import { ContentModelForm } from "@webiny/app-headless-cms/admin/components/ContentModelForm";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import pick from "lodash/pick";

function ContentForm({ contentModel }) {
    const { form: crudForm } = useCrud();

    return (
        <ContentModelForm
            contentModel={contentModel}
            data={crudForm.data}
            loading={crudForm.loading}
            onSubmit={data => {
                const fieldsIds = contentModel.fields.map(item => item.fieldId);
                crudForm.onSubmit(pick(data, ["id", ...fieldsIds]));
            }}
        />
    );
}

export default ContentForm;
