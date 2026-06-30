import React, { useEffect, useState } from "react";
import { useRoute } from "@webiny/app-admin";
import { OverlayLoader } from "@webiny/admin-ui";
import type { EditorPage } from "@webiny/website-builder-sdk";
import { DocumentEditor } from "~/DocumentEditor/DocumentEditor.js";
import { DefaultEditorConfig } from "~/BaseEditor/index.js";
import { EDITOR_NAME } from "~/presentation/pages/PageEditor/constants.js";
import { ROOT_FOLDER, WbPageStatus } from "~/constants.js";
import { Routes } from "~/routes.js";
import { useExperiments } from "~/presentation/experiments/useExperiments.js";
import type { VariantDto } from "~/features/experiments/types.js";
import { VariantEditorConfig } from "./VariantEditorConfig.js";

const toEditorPage = (variant: VariantDto): EditorPage => {
    return {
        id: variant.id,
        version: 1,
        status: WbPageStatus.Draft,
        location: { folderId: ROOT_FOLDER },
        properties: (variant.properties ?? {}) as EditorPage["properties"],
        bindings: variant.bindings ?? {},
        elements: variant.elements ?? {},
        metadata: variant.metadata ?? {},
        extensions: variant.extensions ?? {},
        state: {}
    };
};

/**
 * Opens the Website Builder editor on a variant's content snapshot. Reuses the page editor
 * surface (same editor scope + default config) but loads/saves the variant rather than a page.
 */
export const VariantEditor = () => {
    const { route } = useRoute(Routes.Experiments.VariantEditor);
    const gateway = useExperiments();

    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState<EditorPage | null>(null);
    const [variantName, setVariantName] = useState("");

    useEffect(() => {
        setLoading(true);
        gateway.getVariant(route.params.id).then(variant => {
            if (variant) {
                setPage(toEditorPage(variant));
                setVariantName(variant.name);
            }
            setLoading(false);
        });
    }, [route.params.id]);

    if (loading || !page) {
        return <OverlayLoader text={"Loading variant..."} />;
    }

    return (
        <DocumentEditor<EditorPage>
            key={page.id}
            document={page}
            name={EDITOR_NAME}
            readOnly={false}
        >
            <DefaultEditorConfig />
            <VariantEditorConfig variantName={variantName} />
        </DocumentEditor>
    );
};
