import React, { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent, useRoute } from "@webiny/app-admin";
import { Alert, OverlayLoader } from "@webiny/admin-ui";
import type { CmsModel } from "~/types.js";
import { Routes } from "~/routes.js";
import { ContentEntryEditorWithConfig } from "~/admin/config/contentEntries/editor/ContentEntryEditorConfig.js";
import { ModelProvider } from "~/admin/components/ModelProvider/index.js";
import { SingletonEditorPresenterFeature } from "../singletonEditor/feature.js";
import { ContentEntryEditorBody } from "./ContentEntryEditorBody.js";

export interface SingletonEditorViewProps {
    model: CmsModel;
}

/**
 * The entry editor of a singleton model: no list, folders or back button. The revision comes from
 * the route; without one, the presenter loads the latest revision and puts its id in the route.
 */
export const SingletonEditorView = createReactiveComponent(
    ({ model }: SingletonEditorViewProps) => {
        const { presenter } = useFeature(SingletonEditorPresenterFeature);
        const { route } = useRoute(Routes.ContentEntries.List);
        const routeEntryId = route.params.id;

        useEffect(() => {
            presenter.init(model, routeEntryId);
        }, [model, routeEntryId]);

        useEffect(() => {
            return () => {
                presenter.dispose();
            };
        }, []);

        const { vm } = presenter;

        if (vm.error) {
            return (
                <div className={"p-lg"}>
                    <Alert type={"danger"}>{vm.error}</Alert>
                </div>
            );
        }

        if (!vm.hasFields) {
            return <div className={"p-lg"}>{"This model has no fields."}</div>;
        }

        if (vm.loading || !vm.entryId) {
            return <OverlayLoader text={"Loading entry..."} />;
        }

        return (
            <ModelProvider model={model}>
                <ContentEntryEditorWithConfig>
                    <ContentEntryEditorBody entryId={vm.entryId} modelName={model.name} />
                </ContentEntryEditorWithConfig>
            </ModelProvider>
        );
    }
);
