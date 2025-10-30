import React, { useCallback, useState } from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import {
    DataList,
    DataListModalOverlayAction,
    ListItem,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary,
    ScrollList
} from "@webiny/ui/List/index.js";
import type { IWorkflow, IWorkflowApplication } from "~/types.js";
import { SearchUI, useRouter } from "@webiny/app-admin";

const t = i18n.ns("app-workflows/admin/workflows-list");

export interface WorkflowsDataListProps {
    activeId: string | undefined;
    apps: IWorkflowApplication[];
    onSelectApp: (id: IWorkflowApplication["id"]) => void;
}

export const WorkflowsDataList = ({ apps, activeId, onSelectApp }: WorkflowsDataListProps) => {
    const { goToRoute } = useRouter();
    const [filter, setFilter] = useState("");

    const filterWorkflow = useCallback(
        ({ name }: IWorkflowApplication) => {
            return name.toLowerCase().includes(filter);
        },
        [filter]
    );

    const list = filter === "" ? apps : apps.filter(filterWorkflow);

    return (
        <DataList
            title={t`Workflows`}
            data={list}
            // loading={listLoading}
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
                                <ListItemTextSecondary>descr</ListItemTextSecondary>
                            </ListItemText>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};
