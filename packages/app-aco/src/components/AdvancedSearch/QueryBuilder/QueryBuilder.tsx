import React, { useEffect, useState } from "react";

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
    const [presenter, setPresenter] = useState<QueryBuilderPresenter | undefined>();

    useEffect(() => {
        if (fields) {
            setPresenter(new QueryBuilderPresenter(fields));
        }
    }, []);

    if (!presenter) {
        return null;
    }

    return <QueryBuilderComponent onForm={onForm} onSubmit={onSubmit} presenter={presenter} />;
};
