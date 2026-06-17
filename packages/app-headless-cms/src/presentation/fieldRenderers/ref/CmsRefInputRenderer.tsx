import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { AutoComplete } from "@webiny/admin-ui";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import type { RefFieldRendererSettings } from "./types.js";
import { RefAutocompletePresenterFeature } from "./autocomplete/feature.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        refInput: { fieldType: "ref"; settings: RefFieldRendererSettings };
    }
}

export const CmsRefInputRenderer = createFieldRenderer<"refInput">(({ field }) => {
    const parentContainer = useContainer();

    const scopedContainer = useMemo(() => {
        const child = parentContainer.createChildContainer();
        RefAutocompletePresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <RefInputInner field={field} />
        </DiContainerProvider>
    );
});

interface InnerFieldProps {
    field: IFieldVM & { rendererSettings: RefFieldRendererSettings };
}

const RefInputInner = observer(({ field }: InnerFieldProps) => {
    const { presenter } = useFeature(RefAutocompletePresenterFeature);

    const settings = field.rendererSettings;
    const modelIds = (settings.models || []).map(m => m.modelId);

    useEffect(() => {
        presenter.init({ modelIds });
    }, []);

    const value = field.value as CmsReferenceValue | null;

    useEffect(() => {
        presenter.resolveValue(value);
    }, [value?.id]);

    const resolved = presenter.vm.resolvedValue;

    const options = presenter.vm.options.map(opt => ({
        label: opt.name,
        value: opt.id
    }));

    return (
        <AutoComplete
            label={field.label}
            description={field.description}
            note={field.note}
            hint={field.help}
            disabled={field.disabled}
            loading={presenter.vm.loading}
            value={resolved?.id}
            options={options}
            validation={field.validation}
            onValueSearch={query => presenter.search(query)}
            onValueChange={selectedId => {
                if (!selectedId) {
                    field.onChange(null);
                    return;
                }
                const opt = presenter.vm.options.find(o => o.id === selectedId);
                if (opt) {
                    field.onChange({ id: opt.id, modelId: opt.modelId });
                }
            }}
            onValueReset={() => field.onChange(null)}
            displayResetAction={resolved !== null}
        />
    );
});
