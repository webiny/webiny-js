import React, { useState } from "react";

import { QueryManager as QueryManagerComponent } from "./components/QueryManager";
import { QueryManagerPresenter } from "./adapters/QueryManagerPresenter";
import { useApolloClient } from "@apollo/react-hooks";
import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryBuilder/domain";

interface QueryBuilderProps {
    modelId: string;
    open: boolean;
    onClose: () => void;
    onEdit: (data?: QueryObjectDTO) => void;
    onSelect: (data: QueryObjectDTO) => void;
    onCreate: () => void;
}

export const QueryManager = ({
    modelId,
    open,
    onClose,
    onEdit,
    onSelect,
    onCreate
}: QueryBuilderProps) => {
    const client = useApolloClient();
    const [presenter] = useState<QueryManagerPresenter>(new QueryManagerPresenter(client, modelId));

    return (
        <QueryManagerComponent
            open={open}
            onClose={onClose}
            onEdit={onEdit}
            onSelect={onSelect}
            onCreate={onCreate}
            presenter={presenter}
        />
    );
};
