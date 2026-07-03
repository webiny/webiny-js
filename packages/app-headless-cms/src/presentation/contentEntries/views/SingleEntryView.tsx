import React, { useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { CmsModel } from "~/types.js";
import { SingleEntryPresenterFeature } from "../singleEntry/feature.js";
import { SingleEntryLayout } from "./SingleEntryLayout.js";

interface SingleViewProps {
    model: CmsModel;
}

export const SingleEntryView = ({ model }: SingleViewProps) => {
    const { presenter } = useFeature(SingleEntryPresenterFeature);

    useEffect(() => {
        presenter.init();

        return () => {
            presenter.dispose();
        };
    }, [model]);

    return <SingleEntryLayout presenter={presenter} modelName={model.name} />;
};
