import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { CheckboxGroup } from "@webiny/admin-ui";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import type { RefFieldRendererSettings } from "./types.js";
import { RefSimplePresenterFeature } from "./simple/feature.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        refSimpleMultiple: { fieldType: "ref"; settings: RefFieldRendererSettings };
    }
}

export const CmsRefSimpleMultipleRenderer = createFieldRenderer<"refSimpleMultiple">(({ field }) => {
    const parentContainer = useContainer();

    const scopedContainer = useMemo(() => {
        const child = parentContainer.createChildContainer();
        RefSimplePresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <RefSimpleMultipleInner field={field} />
        </DiContainerProvider>
    );
});

interface InnerFieldProps {
    field: IFieldVM & { rendererSettings: RefFieldRendererSettings };
}

const RefSimpleMultipleInner = observer(({ field }: InnerFieldProps) => {
    const { presenter } = useFeature(RefSimplePresenterFeature);

    const settings = field.rendererSettings;
    const modelIds = (settings.models || []).map(m => m.modelId);

    useEffect(() => {
        presenter.init({ modelIds });
    }, []);

    const values: CmsReferenceValue[] = Array.isArray(field.value) ? field.value : [];
    const selectedIds = values.map(v => v.id);

    const items = presenter.vm.entries.map(entry => ({
        label: entry.title,
        value: entry.id
    }));

    if (presenter.vm.loading) {
        return null;
    }

    return (
        <CheckboxGroup
            label={field.label}
            description={field.description}
            note={field.note}
            hint={field.help}
            disabled={field.disabled}
            value={selectedIds}
            items={items}
            onChange={(selected: string[]) => {
                const refs = selected
                    .map(id => {
                        const entry = presenter.vm.entries.find(e => e.id === id);
                        if (entry) {
                            return { id: entry.id, modelId: entry.modelId };
                        }
                        return null;
                    })
                    .filter((r): r is CmsReferenceValue => r !== null);

                field.onChange(refs.length > 0 ? refs : null);
            }}
        />
    );
});
