import React, { useEffect, useState } from "react";

import { QueryBuilder as QueryBuilderComponent } from "./components/QueryBuilder";
import { QueryBuilderPresenter } from "./adapters/QueryBuilderPresenter";
import { FieldRaw, QueryObjectDTO } from "~/components/AdvancedSearch/QueryBuilder/domain";
import { FormAPI } from "@webiny/form";

interface QueryBuilderProps {
    modelId: string;
    fields: FieldRaw[];
    existing?: QueryObjectDTO;
    onForm: (form: FormAPI) => void;
    onSubmit: (data: any) => void;
}

export const QueryBuilder = ({
    fields,
    modelId,
    onForm,
    onSubmit,
    existing
}: QueryBuilderProps) => {
    const [presenter] = useState<QueryBuilderPresenter>(new QueryBuilderPresenter(modelId, fields));

    useEffect(() => {
        presenter.create(existing);
    }, [existing]);

    return <QueryBuilderComponent onForm={onForm} onSubmit={onSubmit} presenter={presenter} />;
};
