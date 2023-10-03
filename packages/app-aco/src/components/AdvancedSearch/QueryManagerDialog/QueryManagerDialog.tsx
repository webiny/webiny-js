import React, { useState } from "react";

import { QueryManager } from "./components/QueryManager";
import { QueryManagerPresenter } from "./adapters/QueryManagerPresenter";
import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";
import { QueryObjectRepository } from "~/components/AdvancedSearch/QueryObject/QueryObjectRepository";

interface QueryBuilderProps {
    repository: QueryObjectRepository;
    open: boolean;
    onClose: () => void;
    onEdit: (callback?: () => void) => void;
    onSelect: (data: QueryObjectDTO) => void;
    onCreate: (callback?: () => void) => void;
}

export const QueryManagerDialog = ({
    repository,
    open,
    onClose,
    onEdit,
    onSelect,
    onCreate
}: QueryBuilderProps) => {
    const [presenter] = useState<QueryManagerPresenter>(new QueryManagerPresenter(repository));

    return (
        <QueryManager
            open={open}
            onClose={onClose}
            onEdit={onEdit}
            onSelect={onSelect}
            onCreate={onCreate}
            presenter={presenter}
        />
    );
};
