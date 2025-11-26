import React, { useCallback, useMemo, useState } from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import {
    DataList,
    DataListModalOverlayAction,
    ListItem,
    ListItemText,
    ListItemTextPrimary,
    ScrollList
} from "@webiny/ui/List/index.js";
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
            modalOverlayAction={
                <DataListModalOverlayAction data-testid={"default-data-list.filter"} />
            }
        >
            {({ data }: { data: IWorkflowApplication[] }) => (
                <ScrollList data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === activeId}>
                            <ListItemText onClick={() => onSelectApp(item.id)}>
                                <ListItemTextPrimary>{item.name}</ListItemTextPrimary>
                            </ListItemText>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};
