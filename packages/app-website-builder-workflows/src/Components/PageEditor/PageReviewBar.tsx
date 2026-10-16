import React from "react";
import { useEffect } from "react";
import { Alert } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useSelectFromDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import { useDocumentEditor } from "@webiny/app-website-builder/DocumentEditor/index.js";
import { EditorReviewBar } from "@webiny/app-workflows/review/editor/components/EditorReviewBar.js";
import { WB_PAGE_APP } from "~/constants.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";
import { Routes } from "~/routes.js";
import { getPageReadOnlyReason } from "./getPageReadOnlyReason.js";
import { getPageReviewContext } from "./getPageReviewContext.js";
import type { IPageEditorDocument } from "./pageEditorDocument.js";
import type { ISelectedPage } from "./pageEditorDocument.js";

const selectPage = (doc: IPageEditorDocument): ISelectedPage => {
    return {
        id: doc.id,
        title: doc.properties.title || "",
        status: doc.status || WbPageStatus.Draft
    };
};

export const PageReviewBar = createReactiveComponent(() => {
    const { session } = useFeature(WbPageReviewFeature);
    const editor = useDocumentEditor();
    const page = useSelectFromDocument<ISelectedPage, IPageEditorDocument>(selectPage);

    useEffect(() => {
        const context = getPageReviewContext(editor, page);
        session.presenter.init({
            useCases: session.useCases,
            target: { namespace: WB_PAGE_APP, targetRevisionId: page.id },
            ...context
        });
        return () => {
            session.presenter.dispose();
        };
    }, [session, editor, page.id]);

    useEffect(() => {
        const context = getPageReviewContext(editor, page);
        session.presenter.setContext(context);
    }, [session, editor, page.title, page.status]);

    const { vm } = session.presenter;
    if (vm.status === "noWorkflow") {
        return null;
    }

    const reason = getPageReadOnlyReason(vm, page.status);
    let note: React.ReactElement | null = null;
    if (reason) {
        note = (
            <Alert type={"info"} variant={"subtle"} className={"mt-sm"}>
                {reason}
            </Alert>
        );
    }

    return (
        <div
            className={"max-w-screen bg-white p-sm border-solid border-b-sm border-neutral-dimmed"}
            data-affects-preview={"height"}
        >
            <EditorReviewBar session={session} reviewsRoute={Routes.Pages.WorkflowStateList} />
            {note}
        </div>
    );
});
