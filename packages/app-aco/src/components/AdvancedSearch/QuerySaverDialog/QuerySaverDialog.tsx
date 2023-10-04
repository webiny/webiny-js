import React, { useEffect, useState } from "react";

import { QuerySaver } from "./components";
import { QuerySaverPresenter } from "./adapters";

import {
    Mode,
    QueryObjectDTO,
    QueryObjectRepository
} from "~/components/AdvancedSearch/QueryObject";

interface QuerySaverDialogProps {
    mode: Mode;
    onClose: () => void;
    onSubmit: (data: QueryObjectDTO) => void;
    open: boolean;
    queryObject: QueryObjectDTO | null;
    repository: QueryObjectRepository;
}

export const QuerySaverDialog = ({
    mode,
    onClose,
    onSubmit,
    open,
    queryObject,
    repository
}: QuerySaverDialogProps) => {
    const [presenter] = useState<QuerySaverPresenter>(new QuerySaverPresenter(repository));

    useEffect(() => {
        presenter.load(queryObject);
    }, [queryObject]);

    return (
        <QuerySaver
            onClose={onClose}
            onSubmit={onSubmit}
            open={open}
            presenter={presenter}
            mode={mode}
        />
    );
};
