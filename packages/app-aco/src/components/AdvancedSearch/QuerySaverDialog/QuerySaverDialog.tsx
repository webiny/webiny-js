import React, { useEffect, useState } from "react";

import { QuerySaver } from "./components";
import { QuerySaverPresenter, QuerySaverViewModel } from "./adapters";

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
    const [viewModel, setViewModel] = useState<QuerySaverViewModel | undefined>();

    useEffect(() => {
        presenter.load(setViewModel);
    }, []);

    useEffect(() => {
        presenter.updateQueryObject(queryObject);
    }, [queryObject]);

    if (!viewModel) {
        return null;
    }

    return (
        <QuerySaver
            onClose={onClose}
            onSubmit={onSubmit}
            open={open}
            presenter={presenter}
            mode={mode}
            viewModel={viewModel}
        />
    );
};
