import React, { useCallback, useEffect, useState } from "react";
import { Provider as ContentEntryProvider } from "~/admin/views/contentEntries/ContentEntry/ContentEntryContext";
import { DialogActions, DialogCancel, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { Provider as ContentEntriesProvider } from "~/admin/views/contentEntries/ContentEntriesContext";
import { i18n } from "@webiny/app/i18n";
import { CmsEditorContentEntry, CmsModel } from "~/types";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { ModelProvider } from "~/admin/components/ModelProvider";
import { ContentEntryForm } from "~/admin/components/ContentEntryForm/ContentEntryForm";
import { ButtonPrimary } from "@webiny/ui/Button";
import {
    GET_CONTENT_MODEL,
    GetCmsModelQueryResponse,
    GetCmsModelQueryVariables
} from "~/admin/graphql/contentModels";
import { useCms } from "~/admin/hooks";
import { FullWidthDialog } from "./dialog/Dialog";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

interface EntryFormProps {
    onCreate: (entry: CmsEditorContentEntry) => void;
}
const EntryForm: React.FC<EntryFormProps> = ({ onCreate }) => {
    const { setFormRef, contentModel } = useContentEntry();

    return (
        <ModelProvider model={contentModel}>
            <ContentEntryForm
                onSubmit={data => {
                    /**
                     * We know that data is CmsEditorContentEntry.
                     */
                    return onCreate(data as unknown as CmsEditorContentEntry);
                }}
                onForm={form => setFormRef(form)}
                entry={{}}
                addEntryToListCache={false}
            />
        </ModelProvider>
    );
};

const DialogSaveButton: React.FC = () => {
    const { form } = useContentEntry();

    return <ButtonPrimary onClick={form.current.submit}>{t`Create Entry`}</ButtonPrimary>;
};

interface Props {
    model: CmsModel;
    onClose: () => void;
    onChange: (entry: any) => void;
}

export const NewReferencedEntryDialog: React.FC<Props> = ({
    model: baseModel,
    onClose,
    onChange
}) => {
    const { apolloClient } = useCms();
    const [model, setModel] = useState<CmsModel | undefined>(undefined);

    useEffect(() => {
        (async () => {
            if (!baseModel?.modelId) {
                return;
            }
            const response = await apolloClient.query<
                GetCmsModelQueryResponse,
                GetCmsModelQueryVariables
            >({
                query: GET_CONTENT_MODEL,
                variables: {
                    modelId: baseModel.modelId
                }
            });
            setModel(response.data.getContentModel.data);
        })();
    }, [baseModel.modelId]);

    const onCreate = useCallback(
        (entry: CmsEditorContentEntry) => {
            if (!model) {
                onClose();
                return;
            }
            onChange({
                ...entry,
                /*
                 * Format data for AutoComplete.
                 */
                published: entry.meta?.status === "published",
                modelId: model.modelId,
                modelName: model.name
            });
            onClose();
        },
        [onChange, model]
    );
    if (!model) {
        return null;
    }

    return (
        <ContentEntriesProvider contentModel={model} key={model.modelId} insideDialog={true}>
            <ContentEntryProvider isNewEntry={() => true} getContentId={() => null}>
                <FullWidthDialog open={true} onClose={onClose}>
                    <DialogTitle>{t`New {modelName} Entry`({ modelName: model.name })}</DialogTitle>
                    <DialogContent>
                        <EntryForm onCreate={onCreate} />
                    </DialogContent>
                    <DialogActions>
                        <DialogCancel>{t`Cancel`}</DialogCancel>
                        <DialogSaveButton />
                    </DialogActions>
                </FullWidthDialog>
            </ContentEntryProvider>
        </ContentEntriesProvider>
    );
};
