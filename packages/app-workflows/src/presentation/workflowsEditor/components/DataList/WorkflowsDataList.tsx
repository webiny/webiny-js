import React, { useCallback, useMemo, useState } from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { DataList, DataListModal, List } from "@webiny/admin-ui";
import type { IWorkflowApplication } from "~/types.js";
import { SearchUI } from "@webiny/app-admin";

const t = i18n.ns("app-workflows/workflows-editor/data-list");

export interface WorkflowsDataListProps {
    activeId: string | undefined;
    apps: IWorkflowApplication[];
    onSelectApp: (id: IWorkflowApplication["id"]) => void;
}

export const WorkflowsDataList = ({ apps, activeId, onSelectApp }: WorkflowsDataListProps) => {
    const [filter, setFilter] = useState("");

    const filterWorkflow = useCallback(
        ({ name }: IWorkflowApplication) => {
            return name.toLowerCase().includes(filter);
        },
        [filter]
    );

    const items = useMemo(() => {
        if (!filter) {
            return apps;
        }
        return apps.filter(filterWorkflow);
    }, [filter, apps]);

    return (
        <DataList
            title={t`Workflows`}
            data={items}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search workflows...`}
                />
            }
            modalOverlayAction={<DataListModal.Trigger data-testid={"default-data-list.filter"} />}
        >
            {({ data }: { data: IWorkflowApplication[] }) => (
                <List data-testid="default-data-list">
                    {data.map(item => (
                        <List.Item
                            key={item.id}
                            selected={item.id === activeId}
                            title={item.name}
                            onClick={() => onSelectApp(item.id)}
                        />
                    ))}
                </List>
            )}
        </DataList>
    );
};
