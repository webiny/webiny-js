import React from "react";
import type { ICmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import { useModelField } from "~/admin/components/ModelFieldProvider/index.js";
import { Grid, Heading, Text } from "@webiny/admin-ui";

interface RendererOptionsProps {
    renderer: ICmsFieldRenderer | undefined;
}

export const RendererOptions = ({ renderer }: RendererOptionsProps) => {
    const { field } = useModelField();
    if (!renderer || !renderer.buildSettingsForm) {
        return null;
    }

    // TODO: use FormModelFactory to build and render the settings form
    // from renderer.buildSettingsForm(formBuilder)
    void field;

    return (
        <>
            <Grid.Column span={12}>
                <Heading level={5}>Renderer settings</Heading>
                <Text size={"sm"}>
                    Configure additional settings for the selected field renderer.
                </Text>
            </Grid.Column>
        </>
    );
};
