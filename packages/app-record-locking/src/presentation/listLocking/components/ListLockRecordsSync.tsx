import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useContainer } from "@webiny/app";
import { useContentEntriesPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import { ListLockRecordsPresenter } from "../abstractions.js";

export const ListLockRecordsSync = observer(() => {
    const container = useContainer();
    const presenter = React.useMemo(
        () => container.resolve(ListLockRecordsPresenter),
        [container]
    );
    const entriesPresenter = useContentEntriesPresenter();

    const rows = entriesPresenter.list.vm.rows;
    const modelId = entriesPresenter.vm.model.modelId;

    useEffect(() => {
        if (rows.length === 0) {
            return;
        }

        const entryIds = rows.map(row => row.id);
        presenter.fetchForEntries(entryIds, modelId);
    }, [rows, modelId]);

    return null;
});
