import React from "react";
import { Grid, Separator, Text } from "@webiny/admin-ui";
import type { CmsSeparatorLayoutDescriptor } from "~/types/model.js";

interface SeparatorFieldRendererProps {
    descriptor: CmsSeparatorLayoutDescriptor;
}

export const SeparatorFieldRenderer = ({ descriptor }: SeparatorFieldRendererProps) => {
    return (
        <Grid.Column span={12}>
            <Separator variant={"accent"} labelPosition={"start"}>
                {descriptor.label}
            </Separator>
            {descriptor.description && (
                <Text as={"div"} size={"sm"} className={"text-neutral-strong text-center mt-sm"}>
                    {descriptor.description}
                </Text>
            )}
        </Grid.Column>
    );
};
