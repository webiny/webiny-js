import React from "react";
import { Bind } from "@webiny/form";
import { RadioGroup } from "@webiny/admin-ui";
import type { GlobalComponentsPresenter } from "~/presentation/globals/overrides/abstractions.js";

interface SaveTargetFormProps {
    target: GlobalComponentsPresenter.TargetViewModel;
}

// Where a global's changes are saved: in the open page or layout only, or in the global component itself.
export const SaveTargetForm = ({ target }: SaveTargetFormProps) => {
    const documentOption = {
        value: "document",
        label: `Only on this ${target.documentType}`,
        disabled: !target.canSaveToDocument
    };

    const globalOption = {
        value: "global",
        label: `Global component (every page in "${target.language}")`,
        disabled: !target.canSaveToGlobal
    };

    const notes = [
        target.canSaveToDocument
            ? null
            : `Elements were added, removed or moved: that can only be saved in the global component.`,
        target.canSaveToGlobal
            ? null
            : `The global components could not be loaded: reload the editor to save in the global component.`
    ].filter(Boolean);

    return (
        <Bind name={"target"}>
            <RadioGroup
                label={"Where should these changes be saved?"}
                description={notes.length ? notes.join(" ") : undefined}
                items={[documentOption, globalOption]}
            />
        </Bind>
    );
};
