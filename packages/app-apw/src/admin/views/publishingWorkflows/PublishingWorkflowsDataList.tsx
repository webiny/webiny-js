import React from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListActions,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { Typography } from "@webiny/ui/Typography";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { ButtonIcon, ButtonSecondary, IconButton } from "@webiny/ui/Button";

import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as EditIcon } from "~/admin/assets/icons/edit_24dp.svg";

import { usePublishingWorkflowsList } from "./hooks/usePublishingWorkflowsList";
import { ApwWorkflowApplications } from "~/types";
import { Box, Columns } from "./components/theme";

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
    onClick: (app: string) => void;
}

const ListHeader: React.FC<ListHeaderProps> = ({ title, onClick }) => {
    return (
        <ListSubHeader space={4} paddingX={5} paddingY={6}>
            <Box>
                <Typography use={"headline6"}>{title}</Typography>
            </Box>
            <Box>
                <ButtonSecondary
                    data-testid="new-record-button"
                    onClick={() => onClick(ApwWorkflowApplications.PB)}
                >
                    <ButtonIcon icon={<AddIcon />} /> {t`New Workflow`}
                </ButtonSecondary>
            </Box>
        </ListSubHeader>
    );
};

const listStyles = css`
    height: auto;
`;

const PublishingWorkflowsDataList = () => {
    const {
        loading,
        currentLocaleCode,
        createPublishingWorkflow,
        editPublishingWorkflow,
        deletePublishingWorkflow
    } = usePublishingWorkflowsList({
        sorters: SORTERS
    });

    const workflows = [
        {
            id: "1",
            title: "Main workflow",
            scope: {
                type: "default"
            },
            steps: [
                {
                    title: "Legal Review"
                },
                {
                    title: "Design Review"
                }
            ]
        }
    ];

    return (
        <DataList
            loading={loading}
            actions={null}
            data={workflows}
            title={t`Publishing Workflows`}
            showOptions={{}}
        >
            {({ data }) => (
                <>
                    <ListHeader title={t`Page Builder`} onClick={createPublishingWorkflow} />
                    <ScrollList data-testid="default-data-list" className={listStyles}>
                        {data.map(item => (
                            <ListItem key={item.id} selected={item.id === currentLocaleCode}>
                                <ListItemText>
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
                                            onClick={() => deletePublishingWorkflow(item)}
                                            data-testid={"default-data-list.delete"}
                                        />
                                        <IconButton
                                            icon={<EditIcon />}
                                            onClick={() => editPublishingWorkflow(item.code)}
                                        />
                                    </ListActions>
                                </ListItemMeta>
                            </ListItem>
                        ))}
                    </ScrollList>
                </>
            )}
        </DataList>
    );
};

export default PublishingWorkflowsDataList;
