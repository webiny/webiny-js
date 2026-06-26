import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { RadioGroup } from "@webiny/admin-ui";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import type { RefFieldRendererSettings } from "./types.js";
import { RefSimplePresenterFeature } from "./simple/feature.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        refSimpleSingle: { fieldType: "ref"; settings: RefFieldRendererSettings };
    }
}

export const CmsRefSimpleSingleRenderer = createFieldRenderer<"refSimpleSingle">(({ field }) => {
    const parentContainer = useContainer();

    const scopedContainer = useMemo(() => {
        const child = parentContainer.createChildContainer();
        RefSimplePresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <RefSimpleSingleInner field={field} />
        </DiContainerProvider>
    );
});

interface InnerFieldProps {
    field: IFieldVM & { rendererSettings: RefFieldRendererSettings };
}

const RefSimpleSingleInner = observer(({ field }: InnerFieldProps) => {
    const { presenter } = useFeature(RefSimplePresenterFeature);

    const settings = field.rendererSettings;
    const modelIds = (settings.models || []).map(m => m.modelId);

    useEffect(() => {
        presenter.init({ modelIds });
    }, []);

    const value = field.value as CmsReferenceValue | null;

    const items = presenter.vm.entries.map(entry => ({
        label: entry.title,
        value: entry.id
    }));

    if (presenter.vm.loading) {
        return null;
    }

    return (
        <RadioGroup
            label={field.label}
            description={field.description}
            note={field.note}
            hint={field.help}
            disabled={field.disabled}
            value={value?.id}
            items={items}
            onChange={(selectedId: string) => {
                const entry = presenter.vm.entries.find(e => e.id === selectedId);
                if (entry) {
                    field.onChange({ id: entry.id, modelId: entry.modelId });
                }
            }}
        />
    );
});
