import React, { useEffect, useState } from "react";
import { useRoute, useRouter } from "@webiny/app-admin";
import { DocumentEditor } from "~/DocumentEditor/DocumentEditor.js";
import { useCreatePageRevisionFrom, useGetPage } from "~/features/pages/index.js";
import { OverlayLoader } from "@webiny/admin-ui";
import { useGetWebsiteBuilderSettings } from "~/features/index.js";
import { DefaultPageEditorConfig } from "./PageEditor/DefaultPageEditorConfig.js";
import { DefaultEditorConfig } from "~/BaseEditor/index.js";
import { EDITOR_NAME } from "~/modules/pages/constants.js";
import { WbPageStatus } from "~/constants.js";
import type { EditorPage } from "@webiny/website-builder-sdk";
import type { Page } from "~/domain/Page/index.js";
import { Routes } from "~/routes.js";

const getPageDataFromPage = (page: Page): EditorPage => {
    return {
        ...page,
        id: page.id,
        version: page.version,
        status: page.status,
        location: page.location,
        properties: page.properties as EditorPage["properties"],
        bindings: page.bindings,
        elements: page.elements,
        metadata: page.metadata,
        state: {}
    };
};

export const PageEditor = () => {
    const { getSettings } = useGetWebsiteBuilderSettings();
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState<EditorPage | null>(null);

    const { route } = useRoute(Routes.Pages.Editor);

    const { getPage } = useGetPage();

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getSettings(),
            getPage({ id: route.params.id }).then(page => {
                setPage(getPageDataFromPage(page));
            })
        ]).then(() => {
            setLoading(false);
        });
    }, [route.params.id]);

    if (loading || !page) {
        return <OverlayLoader text={"Loading page..."} />;
    }
    
    console.log({
        ...page,
    })

    return (
        <DocumentEditor<EditorPage> key={page.id} document={page} name={EDITOR_NAME} options={{
            isReadOnly: page.status !== WbPageStatus.Draft
        }}>
            <DefaultEditorConfig />
            <DefaultPageEditorConfig />
        </DocumentEditor>
    );
};
