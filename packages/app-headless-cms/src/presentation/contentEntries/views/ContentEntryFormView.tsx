import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { observer } from "mobx-react-lite";
import { useFeature, useRouter } from "@webiny/app";
import { Buttons, useDialogs, useRoute } from "@webiny/app-admin";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { HeaderBar, Heading, Icon, IconButton, OverlayLoader, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as BackIcon } from "@webiny/icons/arrow_back.svg";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { useContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { Routes } from "~/routes.js";
import { Container, ScrollArea, Content, ContentFormInner } from "./layout/index.js";
import { RevisionsListFeature } from "../revisionsList/feature.js";
import { useContentEntriesPresenter } from "./ContentEntriesPresenterProvider.js";
import { useContentEntryFormPresenter } from "./ContentEntryFormPresenterProvider.js";
import { RevisionDrawer } from "./RevisionDrawer.js";
import { FormErrors } from "@webiny/app-admin";

export const ContentEntryFormView = observer(() => {
    const listPresenter = useContentEntriesPresenter();
    const formPresenter = useContentEntryFormPresenter();
    const { presenter: revisionsPresenter } = useFeature(RevisionsListFeature);
    const { width } = useContentEntryEditorConfig();
    const router = useRouter();
    const dialogs = useDialogs();
    const { route } = useRoute(Routes.ContentEntries.List);

    const entryId = listPresenter.vm.selectedEntryId;

    useEffect(() => {
        if (entryId === "new") {
            formPresenter.newEntry();
        } else if (entryId) {
            formPresenter.loadEntry(entryId);
            revisionsPresenter.init(entryId);
        }

        return () => {
            formPresenter.dispose();
            revisionsPresenter.dispose();
        };
    }, [entryId]);

    useEffect(() => {
        return router.addTransitionGuard({
            guard: () => formPresenter.vm.isDirty,
            onBlocked: () => {
                dialogs.showDialog({
                    title: "Confirm Navigation",
                    content:
                        "There are some unsaved changes! Are you sure you want to navigate away and discard all changes?",
                    acceptLabel: "Yes!",
                    cancelLabel: "No, stay here.",
                    onAccept: () => {
                        // We must reset the form to prevent the guard from kicking in again.
                        formPresenter.dispose();
                        router.confirmTransition();
                    },
                    onClose: () => router.cancelTransition()
                });
            }
        });
    }, []);

    const { vm } = formPresenter;

    const handleBack = () => {
        const { modelId, folderId } = route.params;
        router.goToRoute(Routes.ContentEntries.List, { modelId, folderId });
    };

    return (
        <Container>
            <Helmet title={vm.entry?.meta?.title || listPresenter.vm.model.name} />
            <HeaderBar
                start={
                    <EntryFormHeaderLeft
                        onBack={handleBack}
                        title={vm.entry?.meta?.title || `New ${listPresenter.vm.model.name}`}
                        isNewEntry={vm.isNewEntry}
                        modelName={listPresenter.vm.model.name}
                        status={vm.entry?.meta?.status ?? null}
                    />
                }
                end={<EntryFormHeaderRight />}
            />
            <ScrollArea>
                {vm.loading ? <OverlayLoader text={vm.loading} /> : null}
                <Content>
                    <ContentFormInner width={width}>
                        <div className={"bg-neutral-base rounded-lg p-lg"}>
                            {vm.form ? (
                                <>
                                    <div className={"mb-md"}>
                                        <FormErrors form={vm.form} />
                                    </div>
                                    <FormView name="ContentEntryForm" form={vm.form} />
                                </>
                            ) : null}
                        </div>
                    </ContentFormInner>
                </Content>
            </ScrollArea>
            <RevisionDrawer />
        </Container>
    );
});

interface EntryFormHeaderLeftProps {
    onBack: () => void;
    title: string;
    isNewEntry: boolean;
    modelName: string;
    status: string | null;
}

const EntryFormHeaderLeft = ({
    onBack,
    title,
    isNewEntry,
    modelName,
    status
}: EntryFormHeaderLeftProps) => {
    return (
        <div className={"flex items-center gap-sm"}>
            <IconButton variant={"ghost"} onClick={onBack} icon={<BackIcon />} />
            <Heading level={5} className={`text-neutral-primary${isNewEntry ? " opacity-50" : ""}`}>
                {title}
            </Heading>
            <Tooltip
                content={`Model: ${modelName}${status ? ` - Status: ${status}` : ""}`}
                trigger={
                    <Icon icon={<InfoIcon />} label={"Info"} size={"sm"} color={"neutral-light"} />
                }
            />
        </div>
    );
};

const EntryFormHeaderRight = observer(() => {
    const presenter = useContentEntryFormPresenter();
    const { buttonActions } = useContentEntryEditorConfig();

    const { canSave, canPublish, canUnpublish, canDelete } = presenter.vm;

    if (!canSave && !canPublish && !canUnpublish && !canDelete) {
        return null;
    }

    return (
        <div className={"flex items-center gap-sm"}>
            <Buttons actions={buttonActions} />
        </div>
    );
});
