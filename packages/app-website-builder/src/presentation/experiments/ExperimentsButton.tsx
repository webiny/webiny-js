import React, { useState } from "react";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as ScienceIcon } from "@webiny/icons/science.svg";
import { ReactComponent as ChevronDownIcon } from "@webiny/icons/expand_more.svg";
import { ExperimentsDrawer } from "./ExperimentsDrawer.js";

/** Top-bar entry point for A/B experiments. Opens the Experiments drawer for the current page. */
export const ExperimentsButton = () => {
    const [open, setOpen] = useState(false);

    return (
        <div style={{ display: "flex" }}>
            <Button
                variant="secondary"
                icon={<ScienceIcon />}
                text={
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        Experiments
                        <ChevronDownIcon style={{ width: 16, height: 16 }} />
                    </span>
                }
                onClick={() => setOpen(true)}
            />
            <ExperimentsDrawer
                open={open}
                onClose={() => setOpen(false)}
                onCreateExperiment={() => {
                    // The create-experiment flow is the next screen; no-op for now.
                }}
            />
        </div>
    );
};
