import React, { useEffect, useRef, useState } from "react";
import { OverlayLoader } from "@webiny/admin-ui";
import type { EditorPage } from "@webiny/website-builder-sdk";
import { DocumentEditor } from "~/DocumentEditor/DocumentEditor.js";
import { DefaultEditorConfig } from "~/BaseEditor/index.js";
import { EDITOR_NAME } from "~/presentation/pages/PageEditor/constants.js";
import { WbPageStatus } from "~/constants.js";
import { useGetPage } from "~/features/pages/index.js";
import { DefaultPageEditorConfig } from "./DefaultPageEditorConfig.js";
import { RevisionListDrawer } from "./Revisions/RevisionListDrawer.js";
import { pageToEditorDocument } from "./pageDocument.js";
import { useExperimentsEditor } from "~/presentation/experiments/ExperimentsEditorContext.js";
import { useExperiments } from "~/presentation/experiments/useExperiments.js";
import { variantToEditorDocument } from "~/presentation/experiments/variantDocument.js";
import { VariantPageEditorConfig } from "~/presentation/experiments/VariantPageEditorConfig.js";

interface Props {
    page: EditorPage;
}

/**
 * Renders the editor for the bucket currently selected in the experiments toolbar: the page itself
 * (control), or a variant loaded as an equivalent document. Switching buckets re-mounts the editor
 * with the matching document and autosave; content is (re)fetched on each switch so returning to a
 * bucket always shows its latest saved state.
 */
export const PageEditorSurface = ({ page }: Props) => {
    const { selectedVariant } = useExperimentsEditor();
    const { gateway } = useExperiments();
    const { getPage } = useGetPage();

    const readOnly = page.status !== WbPageStatus.Draft;

    const [activeDocument, setActiveDocument] = useState<EditorPage>(page);
    const [loading, setLoading] = useState(false);
    // The initial control document is already loaded (passed in) — don't refetch it on first render.
    const initial = useRef(true);

    useEffect(() => {
        if (initial.current && !selectedVariant) {
            initial.current = false;
            return;
        }
        initial.current = false;

        let cancelled = false;
        setLoading(true);

        const load: Promise<EditorPage | null> = selectedVariant
            ? gateway
                  .getVariant(selectedVariant.id)
                  .then(content => (content ? variantToEditorDocument(content, page) : null))
            : getPage({ id: page.id }).then(pageToEditorDocument);

        load.then(next => {
            if (!cancelled && next) {
                setActiveDocument(next);
            }
        }).finally(() => {
            if (!cancelled) {
                setLoading(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [selectedVariant, gateway, getPage, page]);

    if (loading) {
        return <OverlayLoader text={selectedVariant ? "Loading variant..." : "Loading page..."} />;
    }

    return (
        <DocumentEditor<EditorPage>
            key={activeDocument.id}
            document={activeDocument}
            name={EDITOR_NAME}
            readOnly={readOnly}
        >
            <DefaultEditorConfig />
            {selectedVariant ? (
                <VariantPageEditorConfig />
            ) : (
                <>
                    <DefaultPageEditorConfig />
                    <RevisionListDrawer page={page} />
                </>
            )}
        </DocumentEditor>
    );
};
