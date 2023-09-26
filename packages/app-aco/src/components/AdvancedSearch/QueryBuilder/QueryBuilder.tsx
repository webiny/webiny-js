import React, { useState } from "react";

import { QueryBuilder as QueryBuilderComponent } from "./components/QueryBuilder";
import { QueryBuilderPresenter } from "./adapters/QueryBuilderPresenter";
import { FieldRaw } from "~/components/AdvancedSearch/QueryBuilder/domain";
import { FormAPI } from "@webiny/form";

interface QueryBuilderProps {
    fields: FieldRaw[];
    onForm: (form: FormAPI) => void;
    onSubmit: (data: any) => void;
}

export const QueryBuilder = ({ fields, onForm, onSubmit }: QueryBuilderProps) => {
    const [presenter] = useState<QueryBuilderPresenter>(new QueryBuilderPresenter(fields));

    return <QueryBuilderComponent onForm={onForm} onSubmit={onSubmit} presenter={presenter} />;
};
