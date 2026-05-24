import React from "react";
import { Grid } from "@webiny/admin-ui";
import { ReactComponent as LayoutIcon } from "@webiny/icons/auto_awesome_mosaic.svg";
import { StyleAccordion } from "../StyleAccordion.js";
import { Alignment } from "./Layout/Alignment.js";
import { LengthWithUnitInput } from "./Layout/LengthWithUnitInput.js";
import { UnitsOptions } from "../UnitsOptions.js";

interface LayoutProps {
    elementId: string;
}

const widthOptions = UnitsOptions.widthUnits().add("auto").getOptions();
const heightOptions = UnitsOptions.heightUnits().add("auto").getOptions();

export const Layout = ({ elementId }: LayoutProps) => {
    return (
        <StyleAccordion.Item title={"Layout"} icon={<LayoutIcon />}>
            <Grid gap={"small"}>
                <Grid.Column span={12}>
                    <Alignment elementId={elementId} />
                </Grid.Column>
                <Grid.Column span={12}>
                    <LengthWithUnitInput
                        elementId={elementId}
                        label={"Width"}
                        propertyName={"width"}
                        defaultValue={"100%"}
                        unitOptions={widthOptions}
                    />
                </Grid.Column>
                <Grid.Column span={12}>
                    <LengthWithUnitInput
                        elementId={elementId}
                        label={"Height"}
                        propertyName={"height"}
                        defaultValue={"auto"}
                        unitOptions={heightOptions}
                    />
                </Grid.Column>
                <Grid.Column span={12}>
                    <LengthWithUnitInput
                        elementId={elementId}
                        label={"Max width"}
                        propertyName={"maxWidth"}
                        defaultValue={"auto"}
                        unitOptions={widthOptions}
                    />
                </Grid.Column>
                <Grid.Column span={12}>
                    <LengthWithUnitInput
                        elementId={elementId}
                        label={"Max height"}
                        propertyName={"maxHeight"}
                        defaultValue={"auto"}
                        unitOptions={heightOptions}
                    />
                </Grid.Column>
            </Grid>
        </StyleAccordion.Item>
    );
};
