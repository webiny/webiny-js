import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { createObjectFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IObjectFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { LayoutNodeRenderer } from "@webiny/app-admin/features/formModel/FormView.js";
import { RadioGroup, Text, Heading } from "@webiny/admin-ui";
import { CmsAppearancePresenterFeature } from "./CmsAppearancePresenter.js";

export const CmsAppearanceRenderer = createObjectFieldRenderer(({ field }) => {
    const parentContainer = useContainer();

    const scopedContainer = useMemo(() => {
        const child = parentContainer.createChildContainer();
        CmsAppearancePresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <AppearanceInner field={field} />
        </DiContainerProvider>
    );
});

interface AppearanceInnerProps {
    field: IObjectFieldVM;
}

const AppearanceInner = observer(({ field }: AppearanceInnerProps) => {
    const { presenter } = useFeature(CmsAppearancePresenterFeature);
    const { renderers, selectedValue, settingsLayout, hasRenderers } = presenter.getVm(field);

    useEffect(() => {
        presenter.autoSelectFirst(field);
    }, [renderers.length]);

    if (!hasRenderers) {
        return (
            <Text size={"sm"} className={"text-center py-lg"}>
                There are no components that can render this field.
            </Text>
        );
    }

    return (
        <>
            <Heading level={5}>Field renderer</Heading>
            <Text size={"sm"}>Choose a component that will render the field.</Text>
            <div className={"mb-xl mt-md"}>
                <RadioGroup
                    value={selectedValue}
                    onChange={selected => presenter.selectRenderer(field, selected)}
                    items={renderers.map(r => ({
                        id: r.value,
                        value: r.value,
                        label: (
                            <div>
                                <Text as={"div"} size={"md"}>
                                    {r.name}
                                </Text>
                                <Text
                                    as={"div"}
                                    size={"sm"}
                                    className={"text-sm text-neutral-strong text-wrap"}
                                >
                                    {r.description}
                                </Text>
                            </div>
                        )
                    }))}
                />
            </div>
            {settingsLayout.length > 0 ? (
                <>
                    <Heading level={5}>Renderer settings</Heading>
                    <Text size={"sm"}>
                        Configure additional settings for the selected field renderer.
                    </Text>
                    <div className={"flex flex-col gap-md mt-md"}>
                        {settingsLayout.map((node, index) => (
                            <LayoutNodeRenderer key={index} node={node} />
                        ))}
                    </div>
                </>
            ) : null}
        </>
    );
});
