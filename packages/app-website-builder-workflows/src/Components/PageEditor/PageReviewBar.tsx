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
import { GetPageFeature } from "@webiny/app-website-builder/features/pages/getPage/index.js";
import { SharedPageInfrastructureFeature } from "@webiny/app-website-builder/features/pages/shared/feature.js";
import { usePermissions } from "@webiny/app-website-builder/presentation/security/usePermissions.js";
import { WbPageContentReloader } from "~/features/editorReview/WbPageContentReloader.js";
import { Routes } from "~/routes.js";
import { getPageReadOnlyReason } from "./getPageReadOnlyReason.js";
import { getPageReviewContext } from "./getPageReviewContext.js";
import type { IPageEditorDocument } from "./pageEditorDocument.js";
import type { ISelectedPage } from "./pageEditorDocument.js";

const selectPage = (doc: IPageEditorDocument): ISelectedPage => {
    return {
        id: doc.id,
        title: doc.properties.title || "",
        status: doc.status || WbPageStatus.Draft,
        createdById: doc.createdBy?.id ?? null
    };
};

export const PageReviewBar = createReactiveComponent(() => {
    const { session } = useFeature(WbPageReviewFeature);
    const { fullPageCache } = useFeature(SharedPageInfrastructureFeature);
    const { useCase: getPage } = useFeature(GetPageFeature);
    const editor = useDocumentEditor<IPageEditorDocument>();
    const page = useSelectFromDocument<ISelectedPage, IPageEditorDocument>(selectPage);
    const permissions = usePermissions();
    const canEdit = permissions.canEdit(
        "page",
        page.createdById ? { createdBy: { id: page.createdById } } : undefined
    );

    useEffect(() => {
        const context = getPageReviewContext(editor, page, canEdit);
        const contentReloader = new WbPageContentReloader(editor, fullPageCache, getPage);
        void session.presenter.init({
            target: { namespace: WB_PAGE_APP, targetRevisionId: page.id },
            contentReloader,
            ...context
        });
        return () => {
            session.presenter.dispose();
        };
    }, [session, editor, page.id, fullPageCache, getPage]);

    useEffect(() => {
        const context = getPageReviewContext(editor, page, canEdit);
        session.presenter.setContext(context);
    }, [session, editor, page.title, page.status, canEdit]);

    const { vm } = session.presenter;
    if (vm.status === "noWorkflow") {
        return null;
    }

    const reason = getPageReadOnlyReason(vm, page.status);
    let note: React.ReactElement | null = null;
    if (reason) {
        note = (
            <Alert type={"info"} variant={"subtle"} className={"mx-md my-sm"}>
                {reason}
            </Alert>
        );
    }

    return (
        <div className={"max-w-screen"} data-affects-preview={"height"}>
            <EditorReviewBar
                session={session}
                reviewsRoute={Routes.Pages.WorkflowStateList}
                layout={"strip"}
            />
            {note}
        </div>
    );
});
