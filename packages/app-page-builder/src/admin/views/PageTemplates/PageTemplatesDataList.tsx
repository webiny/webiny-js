import React, { useCallback, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery } from "@apollo/react-hooks";
import orderBy from "lodash/orderBy";
import { TimeAgo } from "@webiny/ui/TimeAgo";

import {
    DataList,
    DataListModalOverlay,
    DataListModalOverlayAction,
    ListActions,
    ListItem,
    ListItemMeta,
    ListItemText,
    ListItemTextSecondary,
    ListSelectBox,
    ListTextOverline,
    ScrollList
} from "@webiny/ui/List";
import { Checkbox } from "@webiny/ui/Checkbox";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { ButtonIcon, ButtonSecondary, IconButton } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/filled/add.svg";
import { ReactComponent as FilterIcon } from "@material-design-icons/svg/round/filter_alt.svg";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/round/edit.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/round/delete.svg";
import { CreatableItem } from "./PageTemplates";
import { useMultiSelect } from "~/admin/views/Pages/hooks/useMultiSelect";
import { ExportTemplatesButton } from "~/editor/plugins/defaultBar/components/ExportTemplateButton";
import { ReactComponent as FileUploadIcon } from "@webiny/app-admin/assets/icons/file_upload.svg";
import useImportTemplate from "~/admin/views/PageTemplates/hooks/useImportTemplate";
import { OptionsMenu } from "~/admin/components/OptionsMenu";

import { PbPageTemplate } from "~/types";
import { LIST_PAGE_TEMPLATES } from "./graphql";

const t = i18n.ns("app-page-builder/admin/views/page-templates/page-templates-details");

const DataListActionsWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
`;

interface Sorter {
    label: string;
    sort: string;
}

const SORTERS: Sorter[] = [
    {
        label: t`Newest to oldest`,
        sort: "createdOn_DESC"
    },
    {
        label: t`Oldest to newest`,
        sort: "createdOn_ASC"
    },
    {
        label: t`Title A-Z`,
        sort: "title_ASC"
    },
    {
        label: t`Title Z-A`,
        sort: "title_DESC"
    }
];

type PageTemplatesDataListProps = {
    canCreate: boolean;
    canEdit: (item: CreatableItem) => boolean;
    canDelete: (item: CreatableItem) => boolean;
    onCreate: () => void;
    onDelete: (item: PbPageTemplate) => void;
    isLoading: boolean;
};

const PageTemplatesDataList = ({
    canCreate,
    canEdit,
    canDelete,
    onCreate,
    onDelete,
    isLoading
}: PageTemplatesDataListProps) => {
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(SORTERS[0].sort);
    const { history } = useRouter();
    const listQuery = useQuery(LIST_PAGE_TEMPLATES) || {};
    const query = new URLSearchParams(location.search);
    const search = {
        query: query.get("search") || undefined
    };

    const pageTemplatesData: PbPageTemplate[] =
        listQuery?.data?.pageBuilder?.listPageTemplates?.data || [];

    const filterData = useCallback(
        ({ title }: PbPageTemplate) => {
            return title.toLowerCase().includes(filter);
        },
        [filter]
    );

    const sortData = useCallback(
        (templates: PbPageTemplate[]) => {
            if (!sort) {
                return templates;
            }
            const [field, order] = sort.split("_");
            return orderBy(templates, field, order.toLowerCase() as "asc" | "desc");
        },
        [sort]
    );

    const selectedTemplate = new URLSearchParams(location.search).get("id");
    const loading = [listQuery].find(item => item.loading);

    const templatesDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select
                            value={sort}
                            onChange={setSort}
                            label={t`Sort by`}
                            description={"Sort templates by"}
                        >
                            {SORTERS.map(({ label, sort: value }) => {
                                return (
                                    <option key={label} value={value}>
                                        {label}
                                    </option>
                                );
                            })}
                        </Select>
                    </Cell>
                </Grid>
            </DataListModalOverlay>
        ),
        [sort]
    );

    const { showImportDialog } = useImportTemplate();

    const listActions = useMemo(() => {
        if (!canCreate) {
            return null;
        }
        return (
            <DataListActionsWrapper>
                <ButtonSecondary
                    data-testid="pb-templates-list-new-template-btn"
                    onClick={onCreate}
                >
                    <ButtonIcon icon={<AddIcon />} /> {t`New Template`}
                </ButtonSecondary>
                <OptionsMenu
                    data-testid={"pb-templates-list-options-btn"}
                    items={[
                        {
                            label: "Import Templates",
                            icon: <FileUploadIcon />,
                            onClick: showImportDialog,
                            "data-testid": "pb-templates-list-options-import-template-btn"
                        }
                    ]}
                />
            </DataListActionsWrapper>
        );
    }, [canCreate, showImportDialog]);

    const filteredTemplatesData: PbPageTemplate[] =
        filter === "" ? pageTemplatesData : pageTemplatesData.filter(filterData);
    const templatesList: PbPageTemplate[] = sortData(filteredTemplatesData);

    const multiSelectProps = useMultiSelect({
        useRouter: false,
        getValue: (item: any) => item.id
    });

    return (
        <DataList
            title={t`Templates`}
            loading={Boolean(loading)}
            data={templatesList}
            actions={listActions}
            modalOverlay={templatesDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction
                    icon={<FilterIcon />}
                    data-testid={"default-data-list.filter"}
                />
            }
            multiSelectActions={
                <ExportTemplatesButton
                    getMultiSelected={multiSelectProps.getMultiSelected}
                    sort={sort}
                    search={{
                        query: search ? search.query || "" : ""
                    }}
                />
            }
            multiSelectAll={multiSelectProps.multiSelectAll}
            isAllMultiSelected={multiSelectProps.isAllMultiSelected}
            isNoneMultiSelected={multiSelectProps.isNoneMultiSelected}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search templates`}
                />
            }
            refresh={() => {
                if (!listQuery.refetch) {
                    return;
                }
                listQuery.refetch();
            }}
        >
            {({ data }: { data: PbPageTemplate[] }) => (
                <>
                    {isLoading && <CircularProgress />}
                    <ScrollList data-testid="default-data-list">
                        {data.map(template => {
                            return (
                                <ListItem
                                    key={template.id}
                                    selected={template.id === selectedTemplate}
                                >
                                    <ListSelectBox>
                                        <Checkbox
                                            onChange={() => multiSelectProps.multiSelect(template)}
                                            value={multiSelectProps.isMultiSelected(template)}
                                        />
                                    </ListSelectBox>
                                    <ListItemText
                                        onClick={() =>
                                            history.push(
                                                `/page-builder/page-templates?id=${template.id}`
                                            )
                                        }
                                    >
                                        {template.title}
                                        <ListTextOverline>{template.description}</ListTextOverline>
                                        {template.createdBy && (
                                            <ListItemTextSecondary>
                                                {`Created by:
                                                ${template.createdBy.displayName || "N/A"}. `}
                                                {`Last modified: `}
                                                <TimeAgo datetime={template.savedOn} />.
                                            </ListItemTextSecondary>
                                        )}
                                    </ListItemText>
                                    <ListItemMeta>
                                        <ListActions>
                                            {canEdit(template) && (
                                                <IconButton
                                                    data-testid={
                                                        "pb-templates-list-edit-template-btn"
                                                    }
                                                    icon={<EditIcon />}
                                                    onClick={() =>
                                                        history.push(
                                                            `/page-builder/template-editor/${template.id}`
                                                        )
                                                    }
                                                />
                                            )}
                                            {canDelete(template) && (
                                                <IconButton
                                                    data-testid={
                                                        "pb-templates-list-delete-template-btn"
                                                    }
                                                    icon={<DeleteIcon />}
                                                    onClick={() => onDelete(template)}
                                                />
                                            )}
                                        </ListActions>
                                    </ListItemMeta>
                                </ListItem>
                            );
                        })}
                    </ScrollList>
                </>
            )}
        </DataList>
    );
};

export default PageTemplatesDataList;
