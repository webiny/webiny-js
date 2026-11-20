import React from "react";
import { Icon, Text, Tooltip } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { ReactComponent as GlobalIcon } from "@webiny/icons/public.svg";
import { ReactComponent as LayoutIcon } from "@webiny/icons/dashboard.svg";
import type { GlobalComponentsPresenter } from "~/presentation/globals/overrides/abstractions.js";
import { GlobalComponentSaveActions } from "./GlobalComponentSaveActions.js";
import { OverriddenInputs } from "./OverriddenInputs.js";

interface GlobalComponentSaveBarProps {
    presenter: GlobalComponentsPresenter.Interface;
}

/**
 * Shown above the settings of an element the open document doesn't own: a global component (or an element
 * inside one), or, in the page editor, an element of the page's layout. It tells where the element comes
 * from, which of its inputs the document overrides, and saves a global's changes where they're wanted.
 */
export const GlobalComponentSaveBar = createReactiveComponent(
    ({ presenter }: GlobalComponentSaveBarProps) => {
        const target = presenter.vm.target;

        if (!target) {
            return null;
        }

        return (
            <div className={"mx-sm mt-md rounded-md bg-primary-subtle px-sm py-xs"}>
                <div className={"flex items-center gap-xs text-accent-primary fill-accent-default"}>
                    <Icon
                        icon={target.kind === "global" ? <GlobalIcon /> : <LayoutIcon />}
                        label={target.kind === "global" ? "Global component" : "Layout component"}
                        size={"sm"}
                    />
                    <Tooltip
                        trigger={<Text size={"sm"}>{target.title}</Text>}
                        content={target.description}
                    />
                </div>
                <OverriddenInputs presenter={presenter} />
                <div className={"flex items-center justify-between gap-xs mt-xs"}>
                    <Text size={"sm"} className={"text-neutral-strong"}>
                        {target.status}
                    </Text>
                    <GlobalComponentSaveActions presenter={presenter} />
                </div>
            </div>
        );
    }
);
