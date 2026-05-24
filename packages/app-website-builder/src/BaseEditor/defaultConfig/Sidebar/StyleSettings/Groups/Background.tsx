import React from "react";
import { Grid } from "@webiny/admin-ui";
import { ReactComponent as BackgroundIcon } from "@webiny/icons/bento.svg";
import { StyleAccordion } from "../StyleAccordion.js";
import { BackgroundImage } from "./Background/BackgroundImage.js";
import { BackgroundColor } from "./Background/BackgroundColor.js";
import { BackgroundPosition } from "./Background/BackgroundPosition.js";
import { BackgroundScaling } from "./Background/BackgroundScaling.js";

interface BackgroundProps {
    elementId: string;
}

export const Background = ({ elementId }: BackgroundProps) => {
    return (
        <StyleAccordion.Item title={"Background"} icon={<BackgroundIcon />}>
            <Grid gap={"small"}>
                <Grid.Column span={12}>
                    <BackgroundColor elementId={elementId} />
                </Grid.Column>
                <Grid.Column span={12}>
                    <BackgroundImage elementId={elementId} />
                </Grid.Column>
                <Grid.Column span={12}>
                    <BackgroundPosition elementId={elementId} />
                </Grid.Column>
                <Grid.Column span={12}>
                    <BackgroundScaling elementId={elementId} />
                </Grid.Column>
            </Grid>
        </StyleAccordion.Item>
    );
};
