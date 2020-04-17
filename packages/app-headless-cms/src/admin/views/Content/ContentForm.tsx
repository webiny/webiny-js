import React from "react";
import { ContentModelForm } from "@webiny/app-headless-cms/admin/components/ContentModelForm";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";

function ContentForm({ contentModel }) {
    const { form: crudForm } = useCrud();

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
