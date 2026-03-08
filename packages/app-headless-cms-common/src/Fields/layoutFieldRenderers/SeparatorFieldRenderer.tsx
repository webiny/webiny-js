import React from "react";
import { Grid, Separator, Text } from "@webiny/admin-ui";
import type { CmsSeparatorLayoutField } from "~/types/model.js";

interface SeparatorFieldRendererProps {
    field: CmsSeparatorLayoutField;
}

export const SeparatorFieldRenderer = ({ field }: SeparatorFieldRendererProps) => {
    return (
        <Grid.Column span={12}>
            <Separator variant={"accent"} labelPosition={"start"}>
                {field.label}
            </Separator>
            {field.description && (
                <Text as={"div"} size={"sm"} className={"text-neutral-strong mt-sm"}>
                    {field.description}
                </Text>
            )}
        </Grid.Column>
    );
};
