import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { RemoveExclusionDialogPresenterFeature } from "../feature.js";
import { RemoveExclusionDialog } from "./RemoveExclusionDialog.js";

export interface RemoveExclusionDialogHostProps {
    source: ExclusionsSource;
    userId: string;
}

// One transient presenter per mounted Remove dialog; the page is its source (R318).
export const RemoveExclusionDialogHost = ({ source, userId }: RemoveExclusionDialogHostProps) => {
    const { presenter } = useFeature(RemoveExclusionDialogPresenterFeature);

    useEffect(() => {
        presenter.init({ source, userId });
        return () => {
            presenter.dispose();
        };
    }, [presenter, source, userId]);

    return <RemoveExclusionDialog presenter={presenter} />;
};
