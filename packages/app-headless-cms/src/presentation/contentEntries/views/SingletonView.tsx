import React, { useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { CmsModel } from "~/types.js";
import { SingletonEntryPresenterFeature } from "../singleton/feature.js";
import { SingletonEntryLayout } from "./SingletonEntryLayout.js";

interface SingletonViewProps {
    model: CmsModel;
}

export const SingletonView = ({ model }: SingletonViewProps) => {
    const { presenter: singletonPresenter } = useFeature(SingletonEntryPresenterFeature);

    useEffect(() => {
        singletonPresenter.init();

        return () => {
            singletonPresenter.dispose();
        };
    }, [model]);

    return <SingletonEntryLayout presenter={singletonPresenter} />;
};
