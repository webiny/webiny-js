import React from "react";
import { CmsModelFieldRendererPlugin } from "@webiny/app-headless-cms-common/types";
import { useModelField } from "~/admin/components/ModelFieldProvider";
import { Cell, Grid } from "@webiny/ui/Grid";

interface RendererOptionsProps {
    plugin: CmsModelFieldRendererPlugin | undefined;
}

export const RendererOptions = ({ plugin }: RendererOptionsProps) => {
    const { field } = useModelField();
    if (!plugin || !plugin.renderer.renderSettings) {
        return null;
    }

    const settings = plugin.renderer.renderSettings({ field });

    if (!settings) {
        return null;
    }

    return (
        <Grid>
            <Cell span={12}>Renderer Settings:</Cell>
            {settings}
        </Grid>
    );
};
