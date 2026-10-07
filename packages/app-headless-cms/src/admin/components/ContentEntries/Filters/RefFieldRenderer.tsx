import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Bind } from "@webiny/form";
import type { BindComponentRenderProp } from "@webiny/form";
import { AutoComplete } from "@webiny/admin-ui";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { RefSingleAutocompletePresenterFeature } from "~/presentation/fieldRenderers/ref/autocomplete/single/feature.js";

const { useInputField } = ContentEntryListConfig.Browser.AdvancedSearch.FieldRenderer;

/**
 * The advanced search filter stores the selected reference as a JSON string
 * `{ entryId, modelId }`. `GraphQLInputMapper` reads `entryId` from it to build the
 * `<fieldId>.entryId` where condition, and `modelId` is used to load the label back
 * when a saved filter is opened.
 */
interface RefFilterValue {
    entryId: string;
    modelId: string;
}

const parseValue = (value: unknown): RefFilterValue | null => {
    if (typeof value !== "string" || !value) {
        return null;
    }
    try {
        const parsed = JSON.parse(value);
        if (!parsed?.entryId || !parsed?.modelId) {
            return null;
        }
        return { entryId: parsed.entryId, modelId: parsed.modelId };
    } catch {
        return null;
    }
};

export const Ref = () => {
    const { name, field } = useInputField();
    const parentContainer = useContainer();

    const scopedContainer = useMemo(() => {
        const child = parentContainer.createChildContainer();
        RefSingleAutocompletePresenterFeature.register(child);
        return child;
    }, [field.value]);

    return (
        <DiContainerProvider container={scopedContainer} key={field.value}>
            <Bind name={name}>
                {bind => <RefInner bind={bind} modelIds={field.settings.modelIds} />}
            </Bind>
        </DiContainerProvider>
    );
};

interface RefInnerProps {
    bind: BindComponentRenderProp;
    modelIds: string[];
}

const RefInner = observer(({ bind, modelIds }: RefInnerProps) => {
    const { presenter } = useFeature(RefSingleAutocompletePresenterFeature);

    useEffect(() => {
        const value = parseValue(bind.value);
        presenter.init({
            modelIds,
            value: value ? { id: value.entryId, modelId: value.modelId } : null
        });
    }, []);

    const vm = presenter.vm;

    return (
        <AutoComplete
            label={"Value"}
            size={"lg"}
            loading={vm.loading}
            value={vm.value}
            options={vm.options}
            validation={bind.validation}
            onValueSearch={query => presenter.search(query)}
            onValueChange={entryId => {
                if (!entryId) {
                    presenter.clear();
                    bind.onChange("");
                    return;
                }
                const ref = presenter.select(entryId);
                if (ref) {
                    bind.onChange(JSON.stringify({ entryId, modelId: ref.modelId }));
                }
            }}
            onValueReset={() => {
                presenter.clear();
                bind.onChange("");
            }}
            displayResetAction={vm.canReset}
        />
    );
});
