import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { AutoComplete } from "@webiny/admin-ui";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import type { RefFieldRendererSettings } from "./types.js";
import { RefSingleAutocompletePresenterFeature } from "./autocomplete/single/feature.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        refInput: { fieldType: "ref"; settings: RefFieldRendererSettings };
    }
}

export const CmsRefInputRenderer = createFieldRenderer<"refInput">(({ field }) => {
    const parentContainer = useContainer();

    const scopedContainer = useMemo(() => {
        const child = parentContainer.createChildContainer();
        RefSingleAutocompletePresenterFeature.register(child);
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
    const { presenter } = useFeature(RefSingleAutocompletePresenterFeature);

    const settings = field.rendererSettings;
    const modelIds = (settings.models || []).map(m => m.modelId);
    const value = field.value as CmsReferenceValue | null;

    useEffect(() => {
        presenter.init({ modelIds, value });
    }, []);

    const vm = presenter.vm;

    return (
        <AutoComplete
            label={field.label}
            description={field.description}
            note={field.note}
            hint={field.help}
            disabled={field.disabled}
            loading={vm.loading}
            value={vm.value}
            options={vm.options}
            validation={field.validation}
            onValueSearch={query => presenter.search(query)}
            onValueChange={selectedEntryId => {
                if (!selectedEntryId) {
                    presenter.clear();
                    field.onChange(null);
                    return;
                }
                const ref = presenter.select(selectedEntryId);
                if (ref) {
                    field.onChange(ref);
                }
            }}
            onValueReset={() => {
                presenter.clear();
                field.onChange(null);
            }}
            displayResetAction={vm.canReset}
        />
    );
});
