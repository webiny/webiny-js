import React, { useCallback, useEffect, useState } from "react";
import { ContentEntryProvider } from "~/admin/views/contentEntries/ContentEntry/ContentEntryContext";
import { FoldersProvider } from "@webiny/app-aco/contexts/folders";
import { DialogActions, DialogCancel, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { ContentEntriesProvider } from "~/admin/views/contentEntries/ContentEntriesContext";
import { i18n } from "@webiny/app/i18n";
import { CmsContentEntry, CmsModel } from "~/types";
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
import { NavigateFolderProvider as AbstractNavigateFolderProvider } from "@webiny/app-aco/contexts/navigateFolder";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";
import styled from "@emotion/styled";
import { Elevation } from "@webiny/ui/Elevation";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const RenderBlock = styled.div`
    position: relative;
    background-color: var(--mdc-theme-background);
    padding: 25px;
    overflow: scroll;
`;

const PaddedLeftPanel = styled(LeftPanel)`
    padding: 10px 10px 0;
`;

const ModalRightPanel = styled(RightPanel)`
    > div {
        height: auto;
    }

    webiny-form-container > div {
        height: auto;
    }
`;

const ModalFullWidthDialog = styled(FullWidthDialog)`
    .webiny-ui-dialog__content {
        height: 100%;
        > div {
            max-height: inherit;
            height: inherit;
            .mdc-layout-grid__inner {
                height: 100%;
                max-height: inherit;
                .webiny-split-view__left-panel,
                .webiny-split-view__right-panel {
                    height: inherit;
                    max-height: inherit;
                    overflow: scroll;
                }
            }
        }
    }
`;

interface EntryFormProps {
    onCreate: (entry: CmsContentEntry) => void;
}

const EntryForm = ({ onCreate }: EntryFormProps) => {
    const { setFormRef, contentModel } = useContentEntry();
    const { currentFolderId, navigateToFolder } = useNavigateFolder();

    return (
        <ModelProvider model={contentModel}>
            <SplitView>
                <PaddedLeftPanel span={3}>
                    <FolderTree
                        focusedFolderId={currentFolderId}
                        onFolderClick={data => navigateToFolder(data.id)}
                        enableActions={true}
                        enableCreate={true}
                    />
                </PaddedLeftPanel>
                <ModalRightPanel span={9}>
                    <RenderBlock>
                        <Elevation z={2}>
                            <ContentEntryForm
                                onSubmit={data => onCreate(data)}
                                onForm={form => setFormRef(form)}
                                entry={{}}
                                addEntryToListCache={false}
                            />
                        </Elevation>
                    </RenderBlock>
                </ModalRightPanel>
            </SplitView>
        </ModelProvider>
    );
};

const DialogSaveButton = () => {
    const { form } = useContentEntry();

    const onClick = useCallback(
        (ev: React.MouseEvent) => {
            (async () => {
                await form.current.submit(ev);
            })();
        },
        [form.current]
    );

    return <ButtonPrimary onClick={onClick}>{t`Create Entry`}</ButtonPrimary>;
};

interface NewReferencedEntryDialogProps {
    model: Pick<CmsModel, "modelId">;
    onClose: () => void;
    onChange: (entry: any) => void;
}

export const NewReferencedEntryDialog = ({
    model: baseModel,
    onClose,
    onChange
}: NewReferencedEntryDialogProps) => {
    const { apolloClient } = useCms();
    const [model, setModel] = useState<CmsModel | undefined>(undefined);

    useEffect(() => {
        (async () => {
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
        (entry: CmsContentEntry) => {
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
            <FoldersProvider type={`cms:${model.modelId}`}>
                <NavigateFolderProvider modelId={model.modelId}>
                    <ContentEntryProvider isNewEntry={() => true} getContentId={() => null}>
                        <ModalFullWidthDialog open={true} onClose={onClose}>
                            <DialogTitle>
                                {t`New {modelName} Entry`({ modelName: model.name })}
                            </DialogTitle>
                            <DialogContent>
                                <EntryForm onCreate={onCreate} />
                            </DialogContent>
                            <DialogActions>
                                <DialogCancel>{t`Cancel`}</DialogCancel>
                                <DialogSaveButton />
                            </DialogActions>
                        </ModalFullWidthDialog>
                    </ContentEntryProvider>
                </NavigateFolderProvider>
            </FoldersProvider>
        </ContentEntriesProvider>
    );
};

const NavigateFolderProvider = ({
    modelId,
    children
}: {
    modelId: string;
    children: React.ReactNode;
}) => {
    const [folderId, setFolderId] = useState<string | undefined>(undefined);

    const navigateToFolder = useCallback((folderId: string) => {
        setFolderId(folderId);
    }, []);

    const navigateToListHome = useCallback(() => {
        setFolderId(undefined);
    }, []);

    return (
        <AbstractNavigateFolderProvider
            folderId={folderId}
            createStorageKey={() => `cms:${modelId}:create`}
            navigateToFolder={navigateToFolder}
            navigateToLatestFolder={navigateToFolder}
            navigateToListHome={navigateToListHome}
        >
            {children}
        </AbstractNavigateFolderProvider>
    );
};
