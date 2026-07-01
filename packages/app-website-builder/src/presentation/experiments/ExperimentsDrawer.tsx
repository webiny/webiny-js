import React, { useEffect, useState } from "react";
import { Drawer, IconButton } from "@webiny/admin-ui";
import { ReactComponent as ScienceIcon } from "@webiny/icons/science.svg";
import { ReactComponent as BackIcon } from "@webiny/icons/arrow_back.svg";
import { ExperimentsEmptyState } from "./ExperimentsEmptyState.js";
import { NewExperimentForm, type NewExperimentPayload } from "./NewExperimentForm.js";

type View = "empty" | "create";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreate: (payload: NewExperimentPayload) => void;
}

export const ExperimentsDrawer = ({ open, onClose, onCreate }: Props) => {
    const [view, setView] = useState<View>("empty");

    // Always start on the overview when the drawer is (re)opened.
    useEffect(() => {
        if (open) {
            setView("empty");
        }
    }, [open]);

    const title =
        view === "create" ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IconButton
                    variant="ghost"
                    size="sm"
                    icon={<BackIcon style={{ width: 18, height: 18 }} />}
                    onClick={() => setView("empty")}
                />
                <ScienceIcon style={{ width: 20, height: 20 }} />
                New experiment
            </span>
        ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ScienceIcon style={{ width: 20, height: 20 }} />
                Experiments
            </span>
        );

    return (
        <Drawer
            open={open}
            onClose={onClose}
            modal={true}
            width={520}
            title={title}
            headerSeparator={true}
            bodyPadding={false}
            className={"flex flex-col"}
        >
            {view === "create" ? (
                <NewExperimentForm onCancel={() => setView("empty")} onSubmit={onCreate} />
            ) : (
                <ExperimentsEmptyState onCreateExperiment={() => setView("create")} />
            )}
        </Drawer>
    );
};
