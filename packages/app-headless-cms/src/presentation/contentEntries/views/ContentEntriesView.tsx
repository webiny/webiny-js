import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { ListPresenterFeature } from "@webiny/app-admin/presentation/listPresenter/index.js";
import { FoldersFeature } from "@webiny/app-aco/features/folders/feature.js";
import { FolderTreePresenterFeature } from "@webiny/app-aco/presentation/folderTree/feature.js";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { ContentEntryFeature } from "~/features/contentEntry/feature.js";
import { CmsGraphQLClientFeature } from "~/features/graphQLClient/feature.js";
import { CmsFormModelFeature } from "~/features/formModel/feature.js";
import { ModelFeature } from "~/features/model/feature.js";
import { GetModelFeature } from "~/features/model/getModel/feature.js";
import type { IGetModelUseCase } from "~/features/model/getModel/abstractions.js";
import { ContentEntriesPresenterFeature } from "../list/feature.js";
import { ContentEntryFormPresenterFeature } from "../form/feature.js";
import { ContentEntriesPresenterProvider } from "./ContentEntriesPresenterProvider.js";
import { ContentEntryFormPresenterProvider } from "./ContentEntryFormPresenterProvider.js";
import type { IContentEntriesPresenter } from "../list/abstractions.js";
import type { IContentEntryFormPresenter } from "../form/abstractions.js";

export interface ContentEntriesViewProps {
    modelId: string;
    children?: React.ReactNode;
}

const ContentEntriesViewInner = observer(({ modelId, children }: ContentEntriesViewProps) => {
    const { presenter: listPresenter } = useFeature(ContentEntriesPresenterFeature) as {
        presenter: IContentEntriesPresenter;
    };
    const { presenter: formPresenter } = useFeature(ContentEntryFormPresenterFeature) as {
        presenter: IContentEntryFormPresenter;
    };
    const { useCase: getModelUseCase } = useFeature(GetModelFeature) as {
        useCase: IGetModelUseCase;
    };

    useEffect(() => {
        listPresenter.init({ modelId });

        getModelUseCase.execute({ modelId }).then(model => {
            listPresenter.setModel(model);
        });

        return () => listPresenter.dispose();
    }, [modelId]);

    return (
        <ContentEntriesPresenterProvider presenter={listPresenter}>
            <ContentEntryFormPresenterProvider presenter={formPresenter}>
                {children}
            </ContentEntryFormPresenterProvider>
        </ContentEntriesPresenterProvider>
    );
});

export const ContentEntriesView = ({ modelId, children }: ContentEntriesViewProps) => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();

        CmsGraphQLClientFeature.register(child);
        // FormModelFeature.register(child);
        CmsFormModelFeature.register(child);
        // ListPresenterFeature.register(child);
        FoldersFeature.register(child, { type: "cms" });
        FolderTreePresenterFeature.register(child);
        // TODO: move this to the parent container; entry features should be registered only once.
        ContentEntryFeature.register(child);
        // TODO: move this to the parent container; model features should be registered only once.
        ModelFeature.register(child);
        ContentEntriesPresenterFeature.register(child);
        ContentEntryFormPresenterFeature.register(child);

        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <ContentEntriesViewInner modelId={modelId}>{children}</ContentEntriesViewInner>
        </DiContainerProvider>
    );
};
