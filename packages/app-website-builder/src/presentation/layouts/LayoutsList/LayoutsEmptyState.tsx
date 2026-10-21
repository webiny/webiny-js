import React from "react";
import { EmptyState } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { LayoutsListPresenter } from "./abstractions.js";

interface LayoutsEmptyStateProps {
    presenter: LayoutsListPresenter.Interface;
}

export const LayoutsEmptyState = createReactiveComponent(
    ({ presenter }: LayoutsEmptyStateProps) => {
        const { loading, rows } = presenter.vm;

        if (loading || rows.length) {
            return null;
        }

        return (
            <EmptyState
                type={"layout"}
                title={"No layouts yet"}
                description={"Create a layout to render pages in it."}
            />
        );
    }
);
