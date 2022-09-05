import { LIST_CMS_MODELS, ListCmsModelsQueryResponse } from "~/graphql/workflow.gql";
import { CmsModel } from "~/types";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { useState } from "react";
import { useQueryLocale } from "@webiny/app-headless-cms/admin/hooks";
import get from "lodash/get";

interface UseCmsModelsResult {
    models: CmsModel[];
    loading: boolean;
}

export const useCmsModels = (): UseCmsModelsResult => {
    const { getCurrentLocale } = useI18N();
    const locale = getCurrentLocale("content");
    const [models, setModels] = useState<CmsModel[] | null>(null);
    if (!locale) {
        throw new Error("Missing current content locale.");
    }

    const { loading } = useQueryLocale<ListCmsModelsQueryResponse>(LIST_CMS_MODELS, locale, {
        skip: !!models,
        onCompleted: data => {
            if (!data) {
                return;
            }
            const items = get(data, "listContentModels.data");
            if (!items) {
                return;
            }
            setModels(items);
        }
    });

    return {
        models: models || [],
        loading
    };
};
