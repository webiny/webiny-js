import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { MultiAutoComplete } from "@webiny/admin-ui";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import type { RefFieldRendererSettings } from "./types.js";
import { RefAutocompletePresenterFeature } from "./autocomplete/feature.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        refInputs: { fieldType: "ref"; settings: RefFieldRendererSettings };
    }
}

export const CmsRefInputsRenderer = createFieldRenderer<"refInputs">(({ field }) => {
    const parentContainer = useContainer();

    const scopedContainer = useMemo(() => {
        const child = parentContainer.createChildContainer();
        RefAutocompletePresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <RefInputsInner field={field} />
        </DiContainerProvider>
    );
});

interface InnerFieldProps {
    field: IFieldVM & { rendererSettings: RefFieldRendererSettings };
}

const RefInputsInner = observer(({ field }: InnerFieldProps) => {
    const { presenter } = useFeature(RefAutocompletePresenterFeature);

    const settings = field.rendererSettings;
    const modelIds = (settings.models || []).map(m => m.modelId);

    useEffect(() => {
        presenter.init({ modelIds });
    }, []);

    const values: CmsReferenceValue[] = Array.isArray(field.value) ? field.value : [];

    useEffect(() => {
        presenter.resolveValues(values);
    }, [values.map(v => v.id).join(",")]);

    const options = presenter.vm.options.map(opt => ({
        label: opt.name,
        value: opt.id
    }));

    const selectedIds = presenter.vm.resolvedValues.map(v => v.id);

    return (
        <MultiAutoComplete
            label={field.label}
            description={field.description}
            note={field.note}
            hint={field.help}
            disabled={field.disabled}
            loading={presenter.vm.loading}
            values={selectedIds}
            options={options}
            validation={field.validation}
            onValueSearch={query => presenter.search(query)}
            onValuesChange={selectedValueIds => {
                const allOptions = [...presenter.vm.options, ...presenter.vm.resolvedValues];
                const refs = selectedValueIds
                    .map(id => {
                        const opt = allOptions.find(o => o.id === id);
                        if (opt) {
                            return { id: opt.id, modelId: opt.modelId };
                        }
                        return null;
                    })
                    .filter((r): r is CmsReferenceValue => r !== null);

                field.onChange(refs.length > 0 ? refs : null);
            }}
            onValuesReset={() => field.onChange(null)}
        />
    );
});
