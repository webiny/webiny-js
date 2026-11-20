import React from "react";
import { Grid } from "@webiny/admin-ui";
import { useEditedElement } from "~/BaseEditor/hooks/useEditedElement.js";
import { ElementInputs } from "./ElementInputs.js";
import { ElementPreview } from "../ElementPreview.js";

export const ElementSettings = () => {
    const element = useEditedElement();

    if (!element) {
        return null;
    }

    return (
        <>
            <Grid gap={"compact"} className={"pt-md px-sm"}>
                <Grid.Column span={12}>
                    <ElementPreview element={element} />
                </Grid.Column>
            </Grid>
            <ElementInputs element={element} />
        </>
    );
};
