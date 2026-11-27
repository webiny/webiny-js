import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useFeature, useRouter } from "@webiny/app";
import { createReactiveComponent, useDialogs } from "@webiny/app-admin";
import { Alert, HeaderBar, OverlayLoader } from "@webiny/admin-ui";
import { useContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import {
    Container,
    ScrollArea,
    ContentEntryFormContent,
    ContentEntryForm
} from "./layout/index.js";
import { RevisionsListFeature } from "../revisionsList/feature.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { RevisionDrawer } from "./RevisionDrawer.js";
import { OlderRevisionAlert } from "./OlderRevisionAlert.js";
import { EntryFormHeaderLeft } from "./EntryFormHeaderLeft.js";
import { EntryFormHeaderRight } from "./EntryFormHeaderRight.js";

export interface ContentEntryEditorBodyProps {
    /** The revision to load, `"new"` for a new entry, or `null` for none. */
    entryId: string | null;
    modelName: string;
    /** Shows a back button when set. */
    onBack?: () => void;
    /** Covers the whole admin (regular editor). When false, renders inside the admin layout. */
    fullScreen?: boolean;
}

export const ContentEntryEditorBody = createReactiveComponent(
    ({ entryId, modelName, onBack, fullScreen = true }: ContentEntryEditorBodyProps) => {
        const formPresenter = useContentEntryFormPresenter();
        const { presenter: revisionsPresenter } = useFeature(RevisionsListFeature);
        const { newEntryWizard, width } = useContentEntryEditorConfig();
        const router = useRouter();
        const dialogs = useDialogs();

        const { vm } = formPresenter;

        const hasWizard = entryId === "new" && newEntryWizard !== null;
        const showWizard = hasWizard && vm.form === null;

        useEffect(() => {
            // A new entry is started by whoever renders the body, since only it knows the folder.
            if (entryId && entryId !== "new") {
                formPresenter.loadRevision(entryId);
                revisionsPresenter.init(entryId);
            }

            return () => {
                formPresenter.reset();
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
                            formPresenter.reset();
                            router.confirmTransition();
                        },
                        onClose: () => router.cancelTransition()
                    });
                }
            });
        }, []);

        let content: React.ReactNode;
        if (vm.loadError) {
            content = (
                <div className={"p-lg"}>
                    <Alert type={"danger"}>{vm.loadError}</Alert>
                </div>
            );
        } else if (showWizard) {
            content = newEntryWizard;
        } else {
            content = (
                <ContentEntryFormContent width={width}>
                    <div className={"bg-neutral-base rounded-lg p-lg"}>
                        <ContentEntryForm />
                    </div>
                </ContentEntryFormContent>
            );
        }

        return (
            <Container fullScreen={fullScreen}>
                <Helmet title={vm.entry?.meta?.title || modelName} />
                <HeaderBar
                    start={
                        <EntryFormHeaderLeft
                            onBack={onBack}
                            title={vm.entry?.meta?.title || `New ${modelName}`}
                            isNewEntry={vm.isNewEntry}
                            modelName={modelName}
                            status={vm.entry?.meta?.status ?? null}
                        />
                    }
                    end={<EntryFormHeaderRight />}
                />
                <ScrollArea fullScreen={fullScreen}>
                    {vm.loading ? <OverlayLoader text={vm.loading} /> : null}
                    <OlderRevisionAlert />
                    {content}
                </ScrollArea>
                <RevisionDrawer />
            </Container>
        );
    }
);
