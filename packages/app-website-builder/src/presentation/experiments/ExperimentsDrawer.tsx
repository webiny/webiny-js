import React from "react";
import { Drawer } from "@webiny/admin-ui";
import { ReactComponent as ScienceIcon } from "@webiny/icons/science.svg";
import { ExperimentsEmptyState } from "./ExperimentsEmptyState.js";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreateExperiment: () => void;
}

export const ExperimentsDrawer = ({ open, onClose, onCreateExperiment }: Props) => {
    return (
        <Drawer
            open={open}
            onClose={onClose}
            modal={true}
            width={520}
            title={
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ScienceIcon style={{ width: 20, height: 20 }} />
                    Experiments
                </span>
            }
            headerSeparator={true}
        >
            <ExperimentsEmptyState onCreateExperiment={onCreateExperiment} />
        </Drawer>
    );
};
