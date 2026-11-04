import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import type { ExclusionDialogInitParams } from "../abstractions.js";
import { ExclusionDialogPresenterFeature } from "../feature.js";
import { ExclusionDialog } from "./ExclusionDialog.js";

export interface ExclusionDialogHostProps {
    source: ExclusionsSource;
    mode: ExclusionDialogInitParams["mode"];
    userId: string | null;
}

// One transient presenter per mounted dialog; the page is its source (R318, R337).
export const ExclusionDialogHost = ({ source, mode, userId }: ExclusionDialogHostProps) => {
    const { presenter } = useFeature(ExclusionDialogPresenterFeature);

    useEffect(() => {
        presenter.init({ source, mode, userId });
        return () => {
            presenter.dispose();
        };
    }, [presenter, source, mode, userId]);

    return <ExclusionDialog presenter={presenter} />;
};
