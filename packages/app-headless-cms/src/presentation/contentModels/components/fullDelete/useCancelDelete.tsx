import type { CmsModel } from "~/types.js";
import { useSnackbar } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n/index.js";
import { useContentModelsPresenter } from "~/presentation/contentModels/useContentModelsPresenter.js";

const t = i18n.ns("app-headless-cms/admin/views/content-models/fully-delete-model");

export interface IUseCancelDeleteProps {
    model: CmsModel;
}

export const useCancelDelete = ({ model }: IUseCancelDeleteProps) => {
    const presenter = useContentModelsPresenter();
    const { showSnackbar } = useSnackbar();

    return {
        cancel: async () => {
            try {
                await presenter.cancelDelete(model.modelId);
                showSnackbar(t`Successfully canceled {name} deletion!.`({ name: model.name }));
            } catch (ex: any) {
                showSnackbar(ex.message, {
                    title: t`Something unexpected happened.`
                });
            }
        }
    };
};
