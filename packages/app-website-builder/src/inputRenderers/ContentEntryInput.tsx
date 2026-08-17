import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { AutoComplete, MultiAutoComplete } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import type { ContentEntryInput, ContentEntryReference } from "@webiny/website-builder-sdk";
import { RefSingleAutocompletePresenterFeature } from "@webiny/app-headless-cms/presentation/fieldRenderers/ref/autocomplete/single/feature.js";
import { RefMultiAutocompletePresenterFeature } from "@webiny/app-headless-cms/presentation/fieldRenderers/ref/autocomplete/multi/feature.js";

/**
 * Editor sidebar renderer for the `contentEntry` input. Lets the editor hand-pick
 * one (single) or several (list) CMS entries from the input's author-fixed model(s).
 * Reuses the Headless CMS reference autocomplete presenters and stores the selection
 * as entry references (`{ id, modelId }`) — never a copy of the entry data.
 */
export const ContentEntryInputRenderer = (props: ElementInputRendererProps) => {
    const input = props.input as ContentEntryInput;
    const parentContainer = useContainer();

    const scopedContainer = useMemo(() => {
        const child = parentContainer.createChildContainer();
        if (input.list) {
            RefMultiAutocompletePresenterFeature.register(child);
        } else {
            RefSingleAutocompletePresenterFeature.register(child);
        }
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            {input.list ? <MultiInner {...props} /> : <SingleInner {...props} />}
        </DiContainerProvider>
    );
};

const SingleInner = observer(({ value, onChange, ...props }: ElementInputRendererProps) => {
    const input = props.input as ContentEntryInput;
    const { presenter } = useFeature(RefSingleAutocompletePresenterFeature);

    const current = (value as ContentEntryReference | null | undefined) ?? null;

    useEffect(() => {
        presenter.init({ modelIds: input.models, value: current });
    }, []);

    const vm = presenter.vm;

    return (
        <AutoComplete
            label={input.label}
            description={input.description}
            loading={vm.loading}
            value={vm.value}
            options={vm.options}
            onValueSearch={query => presenter.search(query)}
            onValueChange={selectedEntryId => {
                if (!selectedEntryId) {
                    presenter.clear();
                    onChange(({ value }) => value.set(null));
                    return;
                }
                const ref = presenter.select(selectedEntryId);
                onChange(({ value }) => value.set(ref));
            }}
            onValueReset={() => {
                presenter.clear();
                onChange(({ value }) => value.set(null));
            }}
            displayResetAction={vm.canReset}
        />
    );
});

const MultiInner = observer(({ value, onChange, ...props }: ElementInputRendererProps) => {
    const input = props.input as ContentEntryInput;
    const { presenter } = useFeature(RefMultiAutocompletePresenterFeature);

    const current: ContentEntryReference[] = Array.isArray(value) ? value : [];

    useEffect(() => {
        presenter.init({ modelIds: input.models, values: current });
    }, []);

    const vm = presenter.vm;

    return (
        <MultiAutoComplete
            label={input.label}
            description={input.description}
            loading={vm.loading}
            values={vm.values}
            options={vm.options}
            uniqueValues
            onValueSearch={query => presenter.search(query)}
            onValuesChange={entryIds => {
                const refs = presenter.select(entryIds);
                onChange(({ value }) => value.set(refs.length > 0 ? refs : null));
            }}
            onValuesReset={() => {
                presenter.clear();
                onChange(({ value }) => value.set(null));
            }}
        />
    );
});
