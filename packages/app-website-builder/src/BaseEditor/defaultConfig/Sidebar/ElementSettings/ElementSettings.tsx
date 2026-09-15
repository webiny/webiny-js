import React from "react";
import { Grid } from "@webiny/admin-ui";
import { useActiveElement } from "~/BaseEditor/hooks/useActiveElement.js";
import { ElementInputs } from "./ElementInputs.js";
import { ElementPreview } from "../ElementPreview.js";

export const ElementSettings = () => {
    const [element] = useActiveElement();

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
