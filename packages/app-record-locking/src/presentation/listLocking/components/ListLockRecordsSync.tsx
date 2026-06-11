import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useModel, ContentEntryListConfig } from "@webiny/app-headless-cms";
import type { IListLockRecordsPresenter } from "../abstractions.js";

const { ContentEntries } = ContentEntryListConfig;

interface ListLockRecordsSyncProps {
    presenter: IListLockRecordsPresenter;
}

export const ListLockRecordsSync = observer(({ presenter }: ListLockRecordsSyncProps) => {
    const { model } = useModel();
    const { records } = ContentEntries.useContentEntriesList();

    useEffect(() => {
        if (!records || records.length === 0) {
            return;
        }

        const entryIds = records.map(record => record.id);
        presenter.fetchForEntries(entryIds, model.modelId);
    }, [records, model.modelId]);

    return null;
});
