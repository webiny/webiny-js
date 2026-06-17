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
    const values: CmsReferenceValue[] = Array.isArray(field.value) ? field.value : [];

    useEffect(() => {
        (async () => {
            await presenter.init({ modelIds });
            if (values.length > 0) {
                await presenter.resolveValues(values);
            }
        })();
    }, []);

    const vm = presenter.vm;

    return (
        <MultiAutoComplete
            label={field.label}
            description={field.description}
            note={field.note}
            hint={field.help}
            disabled={field.disabled}
            loading={vm.loading}
            values={vm.multipleValues}
            options={vm.dropdownOptions}
            uniqueValues
            validation={field.validation}
            onValueSearch={query => presenter.search(query)}
            onValuesChange={entryIds => {
                const refs = presenter.selectValues(entryIds);
                field.onChange(refs.length > 0 ? refs : null);
            }}
            onValuesReset={() => {
                presenter.selectValues([]);
                field.onChange(null);
            }}
        />
    );
});
