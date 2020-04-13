import React from "react";
import { ContentModelForm } from "@webiny/app-headless-cms/admin/components/ContentModelForm";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";

function ContentForm({ contentModel }) {
    const { form: crudForm } = useCrud();

    console.log('saljemo crudForm', crudForm)
    console.log('sljemo content model', contentModel)
    return (
        <ContentModelForm
            contentModel={contentModel}
            data={crudForm.data}
            loading={crudForm.loading}
            onSubmit={crudForm.onSubmit}
        />
    );
}

export default ContentForm;
