import React, { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { CmsContentEntry } from "~/types";
import { makeDecoratable } from "@webiny/app-admin";
import { ModelProvider, useModel } from "~/admin/components/ModelProvider";
import { useFormRenderer } from "~/admin/components/ContentEntryForm/useFormRenderer";
import {
    ContentEntryFormContext,
    ContentEntryFormProvider,
    PersistEntry
} from "./ContentEntryFormProvider";
import { CustomLayout } from "./CustomLayout";
import { DefaultLayout } from "./DefaultLayout";
import { useGoToRevision } from "~/admin/components/ContentEntryForm/useGoToRevision";

const FormWrapper = styled("div")({
    height: "calc(100vh - 260px)",
    overflow: "auto"
});

export interface ContentEntryFormProps {
    entry: Partial<CmsContentEntry>;
    /**
     * This callback is executed when an entry, or a revision, are created.
     * @param entry
     */
    onAfterCreate?: (entry: CmsContentEntry) => void;
    /**
     * This callback is executed when the form is valid, and it needs to persist the content entry.
     */
    persistEntry: PersistEntry;
    header?: React.ReactNode;
    /**
     * This prop is used to get a reference to `saveEntry` callback, so it can be triggered by components
     * outside the ContentEntryForm context.
     * TODO: introduce a `layout` prop to be able to mount arbitrary components around the entry form, within the context.
     */
    setSaveEntry?: (cb: ContentEntryFormContext["saveEntry"]) => void;
}

export const ContentEntryForm = makeDecoratable(
    "ContentEntryForm",
    ({
        entry,
        persistEntry,
        onAfterCreate,
        setSaveEntry,
        header = true
    }: ContentEntryFormProps) => {
        const formElementRef = useRef<HTMLDivElement>(null);
        const { model } = useModel();
        const { goToRevision } = useGoToRevision();
        const formRenderer = useFormRenderer(model);

        const defaultOnAfterCreate = (entry: CmsContentEntry) => {
            goToRevision(entry.id);
        };

        // When entry changes, scroll to the top of the form.
        useEffect(() => {
            if (!formElementRef.current) {
                return;
            }

            setTimeout(() => {
                formElementRef.current?.scrollTo(0, 0);
            }, 20);
        }, [entry.id, formElementRef.current]);

        return (
            <ContentEntryFormProvider
                model={model}
                entry={entry}
                onAfterCreate={onAfterCreate || defaultOnAfterCreate}
                setSaveEntry={setSaveEntry}
                confirmNavigationIfDirty={true}
                persistEntry={persistEntry}
            >
                <ModelProvider model={model}>
                    {header ? header : null}
                    <FormWrapper data-testid={"cms-content-form"} ref={formElementRef}>
                        {formRenderer ? (
                            <CustomLayout model={model} formRenderer={formRenderer} />
                        ) : (
                            <DefaultLayout model={model} />
                        )}
                    </FormWrapper>
                </ModelProvider>
            </ContentEntryFormProvider>
        );
    }
);
