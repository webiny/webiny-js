import React, { useEffect, useState } from "react";

import { QueryBuilder as QueryBuilderComponent } from "./components/QueryBuilder";
import { QueryBuilderPresenter } from "./adapters/QueryBuilderPresenter";
import { FormAPI } from "@webiny/form";
import { FieldRaw, QueryObjectRepository } from "~/components/AdvancedSearch/QueryObject";

interface QueryBuilderProps {
    repository: QueryObjectRepository;
    fields: FieldRaw[];
    onForm: (form: FormAPI) => void;
    onSubmit: (data: any) => void;
}

export const QueryBuilder = ({ repository, fields, onForm, onSubmit }: QueryBuilderProps) => {
    const [presenter] = useState<QueryBuilderPresenter>(
        new QueryBuilderPresenter(repository, fields)
    );

    useEffect(() => {
        presenter.create();
    }, [repository?.selected]);

    return <QueryBuilderComponent onForm={onForm} onSubmit={onSubmit} presenter={presenter} />;
};
