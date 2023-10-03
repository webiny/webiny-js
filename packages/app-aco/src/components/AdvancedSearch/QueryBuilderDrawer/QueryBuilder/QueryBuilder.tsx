import React, { useEffect, useState } from "react";

import { QueryBuilder as QueryBuilderComponent } from "./components/QueryBuilder";
import { QueryBuilderPresenter } from "./adapters/QueryBuilderPresenter";
import { FormAPI } from "@webiny/form";
import {
    FieldRaw,
    QueryObjectDTO,
    QueryObjectRepository
} from "~/components/AdvancedSearch/QueryObject";

interface QueryBuilderProps {
    queryObject: QueryObjectDTO | undefined;
    repository: QueryObjectRepository;
    fields: FieldRaw[];
    onForm: (form: FormAPI) => void;
    onSubmit: (data: any) => void;
}

export const QueryBuilder = ({
    queryObject,
    repository,
    fields,
    onForm,
    onSubmit
}: QueryBuilderProps) => {
    // TODO: Receive a queryObject ->
    const [presenter] = useState<QueryBuilderPresenter>(
        new QueryBuilderPresenter(repository, fields)
    );

    // TODO: pass the selected id
    useEffect(() => {
        presenter.create(queryObject);
    }, [queryObject]);

    return <QueryBuilderComponent onForm={onForm} onSubmit={onSubmit} presenter={presenter} />;
};
