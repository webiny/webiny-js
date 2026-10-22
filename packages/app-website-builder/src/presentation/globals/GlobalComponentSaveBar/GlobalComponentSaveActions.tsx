import React from "react";
import { Button } from "@webiny/admin-ui";
import { useDialogs } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import type { GlobalComponentsPresenter } from "~/presentation/globals/overrides/abstractions.js";
import { SaveTargetForm } from "./SaveTargetForm.js";

interface GlobalComponentSaveActionsProps {
    presenter: GlobalComponentsPresenter.Interface;
}

export const GlobalComponentSaveActions = createReactiveComponent(
    ({ presenter }: GlobalComponentSaveActionsProps) => {
        const { showDialog } = useDialogs();
        const target = presenter.vm.target;

        if (!target || target.kind !== "global" || !target.hasChanges) {
            return null;
        }

        const chooseTarget = () => {
            showDialog({
                title: "Save changes",
                acceptLabel: "Save",
                cancelLabel: "Cancel",
                formData: { target: target.defaultSaveTarget },
                content: <SaveTargetForm target={target} />,
                onAccept: data => {
                    void presenter.save(data.target === "global" ? "global" : "document");
                }
            });
        };

        return (
            <div className={"flex gap-xs"}>
                <Button
                    variant={"secondary"}
                    size={"sm"}
                    text={"Discard"}
                    onClick={() => presenter.discard()}
                    disabled={target.saving}
                />
                <Button
                    variant={"primary"}
                    size={"sm"}
                    text={target.saving ? "Saving..." : "Save changes"}
                    onClick={chooseTarget}
                    disabled={target.saving}
                />
            </div>
        );
    }
);
