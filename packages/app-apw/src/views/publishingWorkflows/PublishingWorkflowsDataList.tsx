import React, { useMemo } from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import {
    DataListWithSections,
    ScrollListWithSections,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListActions,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { Typography } from "@webiny/ui/Typography";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";

import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";

import { usePublishingWorkflowsList } from "~/hooks/usePublishingWorkflowsList";
import { ApwWorkflow, ApwWorkflowApplications } from "~/types";
import { Box, Columns } from "~/components/Layout";

const t = i18n.ns("app-apw/admin/publishing-workflows/data-list");

const SORTERS = [
    {
        label: t`Code A-Z` as string,
        sorters: { code: "asc" }
    },
    {
        label: t`Code Z-A` as string,
        sorters: { code: "desc" }
    }
];

const ListSubHeader = styled(Columns)`
    box-sizing: border-box;
    background: var(--mdc-theme-background);
    justify-content: space-between;
`;

interface ListHeaderProps {
    title: string;
    onClick: (app: ApwWorkflowApplications) => void;
    app: ApwWorkflowApplications;
}

const ListHeader: React.FC<ListHeaderProps> = ({ title, onClick, app }) => {
    return (
        <ListSubHeader space={4} paddingX={5} paddingY={6}>
            <Box>
                <Typography use={"headline6"}>{title}</Typography>
            </Box>
            <Box>
                <ButtonSecondary
                    data-testid={`new-record-button-${app}`}
                    onClick={() => onClick(app)}
                >
                    <ButtonIcon icon={<AddIcon />} /> {t`New Workflow`}
                </ButtonSecondary>
            </Box>
        </ListSubHeader>
    );
};

interface ApwWorkflowScoped {
    [key: string]: ApwWorkflow[];
}

interface DataListChildrenParams {
    data: ApwWorkflowScoped;
}
const listStyles = css`
    height: auto;
`;

const scopes: Record<ApwWorkflowApplications, string> = {
    [ApwWorkflowApplications.PB]: "Page Builder",
    [ApwWorkflowApplications.CMS]: "Headless CMS"
};

const PublishingWorkflowsDataList: React.FC = () => {
    const {
        workflows,
        loading,
        currentWorkflowId,
        createPublishingWorkflow,
        editPublishingWorkflow,
        deletePublishingWorkflow
    } = usePublishingWorkflowsList({
        sorters: SORTERS
    });

    const scopedWorkflows = useMemo(() => {
        const initialScopes: ApwWorkflowScoped = {
            [ApwWorkflowApplications.PB]: [],
            [ApwWorkflowApplications.CMS]: []
        };
        return workflows.reduce<ApwWorkflowScoped>((collection, workflow) => {
            if (!collection[workflow.app]) {
                throw new Error(`Application "${workflow.app}" does not exist.`);
            }
            collection[workflow.app].push(workflow);

            return collection;
        }, initialScopes);
    }, [workflows]);

    return (
        <DataListWithSections
            loading={loading}
            actions={null}
            data={scopedWorkflows}
            title={t`Publishing Workflows`}
            showOptions={{}}
        >
            {({ data }: DataListChildrenParams) => {
                return Object.keys(data).map(scope => {
                    const app = scope as ApwWorkflowApplications;
                    /**
                     * We need to cast unfortunately.
                     */
                    const title = scopes[app];
                    const items = data[app];
                    return (
                        <div key={`data-list-app-${app}`}>
                            <ListHeader
                                title={title}
                                onClick={createPublishingWorkflow}
                                app={app}
                            />
                            <ScrollListWithSections
                                data-testid={`default-data-list-${app}`}
                                className={listStyles}
                            >
                                {items.map(item => (
                                    <ListItem
                                        key={item.id}
                                        selected={item.id === currentWorkflowId}
                                    >
                                        <ListItemText
                                            onClick={() => editPublishingWorkflow(item.id)}
                                        >
                                            {item.title}
                                            <ListItemTextSecondary>
                                                {t`Scope: `}
                                                {item.scope && item.scope.type}
                                                &nbsp; | &nbsp;
                                                {t`Steps: `}
                                                {item.steps.length}
                                            </ListItemTextSecondary>
                                        </ListItemText>

                                        <ListItemMeta>
                                            <ListActions>
                                                <DeleteIcon
                                                    onClick={() =>
                                                        deletePublishingWorkflow(item.id)
                                                    }
                                                    data-testid={`default-data-list-${item.id}.delete`}
                                                />
                                                <EditIcon
                                                    onClick={() => editPublishingWorkflow(item.id)}
                                                    data-testid={`default-data-list-${item.id}.edit`}
                                                />
                                            </ListActions>
                                        </ListItemMeta>
                                    </ListItem>
                                ))}
                            </ScrollListWithSections>
                        </div>
                    );
                });
            }}
        </DataListWithSections>
    );
};

export default PublishingWorkflowsDataList;
