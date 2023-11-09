import React, { useRef, useCallback, useState, useMemo } from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { css } from "emotion";
import styled from "@emotion/styled";
import orderBy from "lodash/orderBy";
import upperFirst from "lodash/upperFirst";
import { useRouter } from "@webiny/react-router";
import { Typography } from "@webiny/ui/Typography";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import {
    DELETE_FORM,
    CREATE_REVISION_FROM,
    CreateRevisionFromMutationResponse,
    CreateRevisionFromMutationVariables
} from "../../graphql";
import { useApolloClient } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions,
    ListSelectBox,
    DataListModalOverlayAction,
    DataListModalOverlay
} from "@webiny/ui/List";
import { i18n } from "@webiny/app/i18n";
import { removeFormFromListCache, updateLatestRevisionInListCache } from "../cache";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { Checkbox } from "@webiny/ui/Checkbox";
import { useMultiSelect } from "./hooks/useMultiSelect";
import { usePermission } from "~/hooks/usePermission";
import { ReactComponent as FileUploadIcon } from "@material-design-icons/svg/round/upload.svg";
import useImportForm from "./hooks/useImportForm";
import { ExportFormsButton } from "~/admin/plugins/formsDataList/ExportButton";
import { OptionsMenu } from "~/admin/components/OptionsMenu";
import { useForms } from "./useForms";
import { deserializeSorters } from "../utils";
import { FbFormModel, FbRevisionModel } from "~/types";

const t = i18n.namespace("FormsApp.FormsDataList");
const rightAlign = css({
    alignItems: "flex-end !important"
});

const listItemMinHeight = css({
    minHeight: "66px !important"
});

const DataListActionsWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
`;

export type FormsDataListProps = {
    onCreateForm: () => void;
};

interface Sorter {
    label: string;
    sorter: string;
}

const SORTERS: Sorter[] = [
    {
        label: t`Newest to oldest`,
        sorter: "savedOn_DESC"
    },
    {
        label: t`Oldest to newest`,
        sorter: "savedOn_ASC"
    },
    {
        label: t`Name A-Z`,
        sorter: "name_ASC"
    },
    {
        label: t`Name Z-A`,
        sorter: "name_DESC"
    }
];

interface HandlerCallable {
    (): Promise<void>;
}

const FormsDataList: React.FC<FormsDataListProps> = props => {
    const editHandlers = useRef<Record<string, HandlerCallable>>({});
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(SORTERS[0].sorter);

    const { listQuery, canCreate } = useForms();

    const { location, history } = useRouter();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const { canUpdate, canDelete } = usePermission();

    const deleteRecord = useCallback(
        async item => {
            const res = await client.mutate({
                mutation: DELETE_FORM,
                variables: { id: item.id },
                update(cache) {
                    removeFormFromListCache(cache, item);

                    const query = new URLSearchParams(location.search);
                    if (item.id === query.get("id")) {
                        return history.push("/form-builder/forms");
                    }
                }
            });
            const { data, error } = res.data.formBuilder.deleteForm || {};

            if (data) {
                showSnackbar(t`Form {name} deleted.`({ name: item.name }));
            } else {
                showSnackbar(error.message, {
                    title: t`Something unexpected happened.`
                });
            }
        },
        [location]
    );

    const editRecord = useCallback((form: FbRevisionModel) => {
        // Note: form id is remains the same after publish.
        const handlerKey = form.id + form.status;
        if (!editHandlers.current[handlerKey]) {
            editHandlers.current[handlerKey] = async () => {
                if (!form.published) {
                    history.push(`/form-builder/forms/${encodeURIComponent(form.id)}`);
                }

                const { data: res } = await client.mutate<
                    CreateRevisionFromMutationResponse,
                    CreateRevisionFromMutationVariables
                >({
                    mutation: CREATE_REVISION_FROM,
                    variables: { revision: form.id },
                    update(cache, result) {
                        if (!result.data) {
                            return;
                        }
                        updateLatestRevisionInListCache(
                            cache,
                            result.data.formBuilder.revision.data
                        );
                    }
                });

                if (!res) {
                    showSnackbar("Missing response data on Create Revision From Mutation.");
                    return;
                }
                const { data, error } = res.formBuilder.revision;

                if (error) {
                    showSnackbar(error.message);
                    return;
                }

                history.push(`/form-builder/forms/${encodeURIComponent(data.id)}`);
                return;
            };
        }

        return editHandlers.current[handlerKey];
    }, []);

    const filterData = useCallback(
        ({ name }) => {
            return name.toLowerCase().includes(filter);
        },
        [filter]
    );

    const sortData = useCallback(
        (list: FbFormModel[]) => {
            if (!sort) {
                return list;
            }
            const [key, value] = deserializeSorters(sort);
            return orderBy(list, [key], [value]);
        },
        [sort]
    );

    const formsDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select
                            value={sort}
                            onChange={setSort}
                            label={t`Sort by`}
                            description={"Sort forms by"}
                        >
                            {SORTERS.map(({ label, sorter }) => {
                                return (
                                    <option key={label} value={sorter}>
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

    const query = new URLSearchParams(location.search);

    const listFormsData =
        listQuery.loading || !listQuery.data ? [] : listQuery.data.formBuilder.listForms.data;

    const filteredData = filter === "" ? listFormsData : listFormsData.filter(filterData);
    const forms = sortData(filteredData);

    const { showImportDialog } = useImportForm();

    const listActions = useMemo(() => {
        if (!canCreate()) {
            return null;
        }
        return (
            <DataListActionsWrapper>
                <ButtonSecondary data-testid="new-record-button" onClick={props.onCreateForm}>
                    <ButtonIcon icon={<AddIcon />} /> {t`New Form`}
                </ButtonSecondary>
                <OptionsMenu
                    items={[
                        {
                            label: "Import Forms",
                            icon: <FileUploadIcon />,
                            onClick: showImportDialog,
                            "data-testid": "import-form-button"
                        }
                    ]}
                />
            </DataListActionsWrapper>
        );
    }, [canCreate(), showImportDialog]);

    const multiSelectProps = useMultiSelect({
        useRouter: false,
        getValue: (item: any) => item.id
    });

    return (
        <DataList
            title={t`Forms`}
            data={forms}
            loading={listQuery.loading}
            actions={listActions}
            multiSelectActions={
                <ExportFormsButton
                    getMultiSelected={multiSelectProps.getMultiSelected}
                    sort={sort}
                />
            }
            multiSelectAll={multiSelectProps.multiSelectAll}
            isAllMultiSelected={multiSelectProps.isAllMultiSelected}
            isNoneMultiSelected={multiSelectProps.isNoneMultiSelected}
            search={
                <SearchUI value={filter} onChange={setFilter} inputPlaceholder={t`Search forms`} />
            }
            modalOverlay={formsDataListModalOverlay}
            modalOverlayAction={<DataListModalOverlayAction icon={<FilterIcon />} />}
        >
            {({ data = [] }: { data: FbFormModel[] }) => (
                <List data-testid="default-data-list">
                    {data.map(form => {
                        const name = form.createdBy.displayName;
                        return (
                            <ListItem
                                key={form.id}
                                className={listItemMinHeight}
                                data-testid="default-data-list-element"
                            >
                                <ListSelectBox>
                                    <Checkbox
                                        onChange={() => multiSelectProps.multiSelect(form)}
                                        value={multiSelectProps.isMultiSelected(form)}
                                    />
                                </ListSelectBox>
                                <ListItemText
                                    onClick={() => {
                                        query.set("id", form.id);
                                        history.push({ search: query.toString() });
                                    }}
                                >
                                    {form.name}
                                    {form.createdBy && (
                                        <ListItemTextSecondary>
                                            {<>{t`Created by: {user}.`({ user: name })} </>}

                                            {t`Last modified: {time}.`({
                                                time: <TimeAgo datetime={form.savedOn} />
                                            })}
                                        </ListItemTextSecondary>
                                    )}
                                </ListItemText>
                                <ListItemMeta className={rightAlign}>
                                    <Typography use={"body2"} data-testid="fb.form.status">
                                        {upperFirst(form.status)} (v{form.version})
                                    </Typography>
                                    <ListActions>
                                        {canUpdate(form) && (
                                            <EditIcon
                                                onClick={editRecord(form)}
                                                data-testid="edit-form-action"
                                            />
                                        )}
                                        {canDelete(form) && (
                                            <ConfirmationDialog
                                                title={"Confirmation required!"}
                                                message={
                                                    "This will delete the form and all of its revisions. Are you sure you want to continue?"
                                                }
                                                data-testid="form-deletion-confirmation-dialog"
                                            >
                                                {({ showConfirmation }) => (
                                                    <DeleteIcon
                                                        onClick={() =>
                                                            showConfirmation(async () => {
                                                                await deleteRecord(form);
                                                                history.push("/form-builder/forms");
                                                            })
                                                        }
                                                        data-testid="delete-form-action"
                                                    />
                                                )}
                                            </ConfirmationDialog>
                                        )}
                                    </ListActions>
                                </ListItemMeta>
                            </ListItem>
                        );
                    })}
                </List>
            )}
        </DataList>
    );
};

export default FormsDataList;
