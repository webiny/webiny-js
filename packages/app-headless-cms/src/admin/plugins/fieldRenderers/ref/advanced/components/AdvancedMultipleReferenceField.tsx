import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import * as GQL from "~/admin/viewsGraphql";
import { ListCmsModelsQueryResponse } from "~/admin/viewsGraphql";
import {
    BindComponentRenderProp,
    CmsContentEntry,
    CmsModel,
    CmsModelFieldRendererProps
} from "~/types";
import { Options } from "./Options";
import { useReferences } from "../hooks/useReferences";
import { Entry } from "./Entry";
import { ReferencesDialog } from "./ReferencesDialog";
import { useModelFieldGraphqlContext, useQuery } from "~/admin/hooks";
import { useSnackbar } from "@webiny/app-admin";
import { CmsReferenceValue } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { AbsoluteLoader as Loader } from "./Loader";
import { parseIdentifier } from "@webiny/utils";
import { Entries } from "./Entries";
import { NewReferencedEntryDialog } from "~/admin/plugins/fieldRenderers/ref/components/NewReferencedEntryDialog";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

const FieldLabel = styled("h3")({
    fontSize: 24,
    fontWeight: "normal",
    borderBottom: "1px solid var(--mdc-theme-background)",
    marginBottom: "20px",
    paddingBottom: "5px",
    display: "flex",
    justifyContent: "space-between"
});

const OptionsContainer: any = styled("div")({
    borderTop: "1px solid var(--mdc-theme-on-background)",
    borderRight: "1px solid var(--mdc-theme-surface)",
    backgroundColor: "var(--mdc-theme-surface)",
    marginLeft: "-21px",
    marginBottom: "-21px",
    marginRight: "-1px"
});
/**
 * Error is on the `position: "relative !important"` style.
 */
// @ts-expect-error
const Container = styled("div")({
    border: "1px solid var(--mdc-theme-on-background)",
    paddingLeft: "10px",
    width: "100%",
    boxSizing: "border-box",
    position: "relative",
    padding: "20px 0 20px 20px",
    backgroundColor: "var(--mdc-theme-background)",
    "&.no-entries": {
        backgroundColor: "var(--mdc-theme-surface)",
        border: "none",
        borderLeft: "3px solid var(--mdc-theme-background)",
        padding: 0,
        paddingLeft: 10,
        [OptionsContainer]: {
            border: "none",
            margin: 0
        }
    },
    "&.single-entry": {
        "> .entries": {
            height: "auto",
            " > div > div": {
                position: "relative !important"
            }
        }
    }
});

const FieldName = styled("span")({});
const RecordCount = styled("span")({
    color: "var(--mdc-theme-text-secondary-on-background)",
    fontSize: "0.6em",
    lineHeight: "100%",
    alignSelf: "center"
});

const getRecordCountMessage = (count: number) => {
    switch (count) {
        case 0:
            return "no records selected";
        case 1:
            return "1 record selected";
        default:
            return `${count} records selected`;
    }
};

interface AdvancedMultipleReferenceFieldProps extends CmsModelFieldRendererProps {
    bind: BindComponentRenderProp<CmsReferenceValue[] | undefined | null>;
}

export const AdvancedMultipleReferenceField = (props: AdvancedMultipleReferenceFieldProps) => {
    const { bind, field } = props;
    const { showSnackbar } = useSnackbar();
    const requestContext = useModelFieldGraphqlContext();

    const values = useMemo(() => {
        return bind.value || [];
    }, [bind.value]);

    const [linkEntryDialogModel, setLinkEntryDialogModel] = useState<CmsModel | null>(null);
    const [newEntryDialogModel, setNewEntryDialogModel] = useState<CmsModel | null>(null);

    const [loadedModels, setLoadedModels] = useState<CmsModel[]>([]);

    const { data, loading: loadingModels } = useQuery<ListCmsModelsQueryResponse>(
        GQL.LIST_CONTENT_MODELS,
        {
            context: requestContext
        }
    );

    useEffect(() => {
        if (loadingModels || !data?.listContentModels?.data) {
            return;
        } else if (data.listContentModels.error) {
            setLoadedModels([]);
            showSnackbar(data.listContentModels.error.message);
            return;
        }
        setLoadedModels(data.listContentModels.data);
    }, [data]);

    const onNewRecord = useCallback(
        (modelId: string) => {
            const model = loadedModels.find(model => model.modelId === modelId);
            if (!model) {
                console.log(`Cannot find model by modelId "${modelId}".`);
                return;
            }
            setNewEntryDialogModel(model);
        },
        [loadedModels, linkEntryDialogModel]
    );

    const onNewEntryDialogClose = useCallback(() => {
        setNewEntryDialogModel(null);
    }, [linkEntryDialogModel]);

    const onExistingRecord = useCallback(
        (modelId: string) => {
            const model = loadedModels.find(model => model.modelId === modelId);
            if (!model) {
                console.log(`Cannot find model by modelId "${modelId}".`);
                return;
            }
            setLinkEntryDialogModel(model);
        },
        [loadedModels, linkEntryDialogModel]
    );

    const onLinkEntryDialogClose = useCallback(() => {
        setLinkEntryDialogModel(null);
    }, []);

    const {
        entries,
        loading: loadingEntries,
        loadMore
    } = useReferences({
        values,
        perPage: 10,
        requestContext
    });

    const onRemove = useCallback(
        (id: string) => {
            if (!values || !Array.isArray(values)) {
                return;
            }
            const { id: entryId } = parseIdentifier(id);
            const newValues = values.filter(value => {
                const { id: valueEntryId } = parseIdentifier(value.id);
                return valueEntryId !== entryId;
            });
            bind.onChange(newValues.length > 0 ? newValues : null);
        },
        [entries, values]
    );

    const models = useMemo(() => {
        if (!loadedModels || !field.settings?.models || !Array.isArray(field.settings.models)) {
            return [];
        }

        return field.settings.models.reduce<CmsModel[]>((collection, ref) => {
            const model = loadedModels.find(model => model.modelId === ref.modelId);
            if (!model) {
                return collection;
            }
            collection.push(model);

            return collection;
        }, []);
    }, [loadedModels, entries]);

    const storeValues = useCallback(
        (values: CmsReferenceValue[]) => {
            bind.onChange(values?.length ? values : null);
            return;
        },
        [values]
    );

    const onNewEntryCreate = useCallback(
        (data: Partial<CmsContentEntry> | null) => {
            if (!data) {
                console.log(
                    `Could not store new entry to the reference field. Missing whole entry.`
                );
                return;
            } else if (!data.id) {
                console.log(
                    `Could not store new entry to the reference field. Missing "id" value.`
                );
                return;
            } else if (!data.modelId) {
                console.log(
                    `Could not store new entry to the reference field. Missing "modelId" value.`
                );
                return;
            }
            storeValues(
                values.concat([
                    {
                        id: data.id,
                        modelId: data.modelId
                    }
                ])
            );
        },
        [storeValues]
    );

    const onMoveUp = useCallback(
        (index: number, toTop?: boolean) => {
            if (!values?.length) {
                return;
            } else if (toTop) {
                const arr = values.splice(index, 1);
                bind.onChange(arr.concat(values));
                return;
            }
            bind.moveValueUp(index);
        },
        [values]
    );
    const onMoveDown = useCallback(
        (index: number, toBottom?: boolean) => {
            if (!values?.length) {
                return;
            } else if (toBottom === true) {
                const arr = values.splice(index, 1);
                bind.onChange(values.concat(arr));
                return;
            }
            bind.moveValueDown(index);
        },
        [values]
    );

    const loading = loadingEntries || loadingModels;

    const message = getRecordCountMessage(values.length);

    const { validation } = bind;
    const { isValid: validationIsValid, message: validationMessage } = validation || {};

    return (
        <>
            <FieldLabel>
                <FieldName>{field.label}</FieldName>
                <RecordCount>({message})</RecordCount>
            </FieldLabel>
            {validationIsValid === false && (
                <FormElementMessage error>{validationMessage}</FormElementMessage>
            )}
            <Container
                className={
                    (entries.length < 1 ? "no-entries" : "has-entries") +
                    (entries.length == 1 ? " single-entry" : "")
                }
            >
                {loading && <Loader />}
                <Entries entries={entries} loadMore={loadMore}>
                    {(entry, index) => {
                        const isFirst = index === 0;
                        const isLast = index >= values.length - 1;
                        const model = loadedModels.find(
                            model => model.modelId === entry.model.modelId
                        );
                        if (!model) {
                            return null;
                        }
                        return (
                            <Entry
                                model={model}
                                placement="multiRef"
                                key={`reference-entry-${entry.id}`}
                                index={index}
                                entry={entry}
                                onRemove={onRemove}
                                onMoveUp={!isFirst ? onMoveUp : undefined}
                                onMoveDown={!isLast ? onMoveDown : undefined}
                            />
                        );
                    }}
                </Entries>

                <OptionsContainer>
                    <Options
                        models={models}
                        onNewRecord={onNewRecord}
                        onLinkExistingRecord={onExistingRecord}
                    />

                    {newEntryDialogModel && (
                        <NewReferencedEntryDialog
                            model={newEntryDialogModel}
                            onClose={onNewEntryDialogClose}
                            onChange={onNewEntryCreate}
                        />
                    )}

                    {linkEntryDialogModel && (
                        <ReferencesDialog
                            {...props}
                            multiple={true}
                            values={values}
                            contentModel={linkEntryDialogModel}
                            storeValues={storeValues}
                            onDialogClose={onLinkEntryDialogClose}
                        />
                    )}
                </OptionsContainer>
            </Container>
        </>
    );
};
