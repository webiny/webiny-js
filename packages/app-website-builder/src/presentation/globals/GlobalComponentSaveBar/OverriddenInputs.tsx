import React from "react";
import { Button, Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { GlobalComponentsPresenter } from "~/presentation/globals/overrides/abstractions.js";

interface OverriddenInputsProps {
    presenter: GlobalComponentsPresenter.Interface;
}

/**
 * Lists the inputs the open document overrides on the selected element, with a button to reset them.
 */
export const OverriddenInputs = createReactiveComponent(({ presenter }: OverriddenInputsProps) => {
    const target = presenter.vm.target;

    if (!target || target.overridden.length === 0) {
        return null;
    }

    const owner = target.documentType === "page" ? "this page" : "this layout";

    return (
        <div className={"flex items-center justify-between gap-xs mt-xs"}>
            <Text size={"sm"} className={"text-neutral-strong"}>
                {`Overridden on ${owner}: ${target.overridden.join(", ")}`}
            </Text>
            <Button
                variant={"ghost"}
                size={"sm"}
                text={"Reset"}
                onClick={() => presenter.resetOverrides()}
                disabled={target.saving || target.hasChanges}
            />
        </div>
    );
});
