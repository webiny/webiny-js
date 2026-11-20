import React from "react";
import { Bind } from "@webiny/form";
import { RadioGroup } from "@webiny/admin-ui";
import type { GlobalComponentsPresenter } from "~/presentation/globals/overrides/abstractions.js";

interface SaveTargetFormProps {
    target: GlobalComponentsPresenter.TargetViewModel;
}

// Where a global's changes are saved: in the open page or layout only, or in the global component itself.
export const SaveTargetForm = ({ target }: SaveTargetFormProps) => {
    return (
        <Bind name={"target"}>
            <RadioGroup
                label={"Where should these changes be saved?"}
                description={target.saveNote ?? undefined}
                items={target.saveOptions}
            />
        </Bind>
    );
};
