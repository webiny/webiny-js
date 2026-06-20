import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useContainer } from "@webiny/app";
import { createObjectFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IObjectFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { RadioGroup, Text, Heading } from "@webiny/admin-ui";
import {
    CmsFieldRenderer,
    type ICmsFieldRenderer
} from "~/presentation/fieldRenderers/abstractions.js";
import { useModel } from "~/admin/components/ModelProvider/index.js";
import { useModelField } from "~/admin/components/ModelFieldProvider/index.js";

const hiddenLast = (a: ICmsFieldRenderer, b: ICmsFieldRenderer) => {
    if (a.rendererName === "hidden") {
        return 1;
    }
    if (b.rendererName === "hidden") {
        return -1;
    }
    return 0;
};

export const CmsAppearanceRenderer = createObjectFieldRenderer(({ field }) => {
    const container = useContainer();
    const { model } = useModel();
    const { field: cmsField } = useModelField();

    const renderers = useMemo(() => {
        const all = container.resolveAll(CmsFieldRenderer);
        return all.filter(r => r.canUse({ field: cmsField, model })).sort(hiddenLast);
    }, [container, cmsField, model]);

    return <AppearanceInner field={field} renderers={renderers} />;
});

interface AppearanceInnerProps {
    field: IObjectFieldVM;
    renderers: ICmsFieldRenderer[];
}

const AppearanceInner = observer(({ field, renderers }: AppearanceInnerProps) => {
    const nameField = field.fields.find(f => f.name === "name");
    const value = nameField ? (nameField.value as string) : "";

    const selectedRenderer = value
        ? renderers.find(r => r.rendererName === value)
        : undefined;

    useEffect(() => {
        if (selectedRenderer || renderers.length === 0) {
            return;
        }
        if (renderers[0] && nameField) {
            nameField.onChange(renderers[0].rendererName);
        }
    }, [selectedRenderer, renderers, nameField]);

    if (renderers.length === 0) {
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
                    value={value}
                    onChange={selected => {
                        if (nameField) {
                            nameField.onChange(selected);
                        }
                    }}
                    items={renderers.map(r => ({
                        id: r.rendererName,
                        value: r.rendererName,
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
            {selectedRenderer && selectedRenderer.buildSettingsForm ? (
                <RendererSettings renderer={selectedRenderer} />
            ) : null}
        </>
    );
});

interface RendererSettingsProps {
    renderer: ICmsFieldRenderer;
}

const RendererSettings = ({ renderer }: RendererSettingsProps) => {
    // TODO: build a sub-form from renderer.buildSettingsForm() and render it
    return (
        <>
            <Heading level={5}>Renderer settings</Heading>
            <Text size={"sm"}>
                Configure additional settings for the selected field renderer.
            </Text>
        </>
    );
};
