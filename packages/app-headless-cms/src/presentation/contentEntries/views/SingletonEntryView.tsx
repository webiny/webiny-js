import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { ContentEntryFeature } from "~/features/contentEntry/feature.js";
import { CmsGraphQLClientFeature } from "~/features/graphQLClient/feature.js";
import { CmsFormModelFeature } from "~/features/formModel/feature.js";
import { ModelFeature } from "~/features/model/feature.js";
import { CmsModelAccessor } from "~/features/contentEntry/CmsModelAccessor.js";
import { SingletonEntryPresenterFeature } from "../singleton/feature.js";
import type { ISingletonEntryPresenter } from "../singleton/abstractions.js";
import { GenericModelLoader } from "./GenericModelLoader.js";

export interface SingletonEntryViewProps {
    modelId: string;
    children?: React.ReactNode;
}

const SingletonEntryViewInner = observer(({ modelId }: SingletonEntryViewProps) => {
    const { presenter } = useFeature(SingletonEntryPresenterFeature) as {
        presenter: ISingletonEntryPresenter;
    };

    useEffect(() => {
        presenter.init();
        return () => presenter.dispose();
    }, [modelId]);

    const { vm } = presenter;

    if (vm.loading) {
        return <div>{vm.loading}</div>;
    }

    if (!vm.form) {
        return null;
    }

    return (
        <div>
            <div>
                {vm.canSave && (
                    <button onClick={() => presenter.save()} disabled={vm.loading !== null}>
                        Save
                    </button>
                )}
            </div>
            <FormView name="SingletonEntryForm" form={vm.form} />
        </div>
    );
});

export const SingletonEntryView = ({ modelId, children }: SingletonEntryViewProps) => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();

        CmsGraphQLClientFeature.register(child);
        FormModelFeature.register(child);
        CmsFormModelFeature.register(child);
        ContentEntryFeature.register(child);
        ModelFeature.register(child);
        child.register(CmsModelAccessor).inSingletonScope();
        SingletonEntryPresenterFeature.register(child);

        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <GenericModelLoader modelId={modelId}>
                {() => (
                    <SingletonEntryViewInner modelId={modelId}>{children}</SingletonEntryViewInner>
                )}
            </GenericModelLoader>
        </DiContainerProvider>
    );
};
