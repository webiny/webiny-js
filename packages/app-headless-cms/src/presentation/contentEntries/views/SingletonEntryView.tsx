import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { ContentEntryFeature } from "~/features/contentEntry/feature.js";
import { CmsGraphQLClientFeature } from "~/features/graphQLClient/feature.js";
import { CmsFormModelFeature } from "~/features/formModel/feature.js";
import { ModelFeature } from "~/features/model/feature.js";
import { GetModelFeature } from "~/features/model/getModel/feature.js";
import type { IGetModelUseCase } from "~/features/model/getModel/abstractions.js";
import { SingletonEntryPresenterFeature } from "../singleton/feature.js";
import type { ISingletonEntryPresenter } from "../singleton/abstractions.js";

export interface SingletonEntryViewProps {
    modelId: string;
    children?: React.ReactNode;
}

const SingletonEntryViewInner = observer(({ modelId }: SingletonEntryViewProps) => {
    const { presenter } = useFeature(SingletonEntryPresenterFeature) as {
        presenter: ISingletonEntryPresenter;
    };
    const { useCase: getModelUseCase } = useFeature(GetModelFeature) as {
        useCase: IGetModelUseCase;
    };

    useEffect(() => {
        getModelUseCase.execute({ modelId }).then(model => {
            presenter.init({ model });
        });

        return () => presenter.dispose();
    }, [modelId]);

    const { vm, actions } = presenter;

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
                    <button onClick={() => actions.save()} disabled={vm.loading !== null}>
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
        SingletonEntryPresenterFeature.register(child);

        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <SingletonEntryViewInner modelId={modelId}>{children}</SingletonEntryViewInner>
        </DiContainerProvider>
    );
};
