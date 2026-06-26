import { useEffect, useState } from "react";
import { useFeature } from "@webiny/app";
import { ListModelsFeature } from "~/features/model/listModels/feature.js";
import { ListModelGroupsFeature } from "~/features/modelGroup/listModelGroups/feature.js";

export interface CmsDataCmsGroup {
    id: string;
    slug: string;
    label: string;
}
export interface CmsDataCmsModel<TGroup = string> {
    id: string;
    modelId: string;
    label: string;
    group: TGroup;
}

export interface UseCmsDataResponseRecords {
    models: CmsDataCmsModel<CmsDataCmsGroup>[];
    groups: CmsDataCmsGroup[];
}

export const useCmsData = (): UseCmsDataResponseRecords => {
    const { useCase: listModelsUseCase } = useFeature(ListModelsFeature);
    const { useCase: listModelGroupsUseCase } = useFeature(ListModelGroupsFeature);

    const [result, setResult] = useState<UseCmsDataResponseRecords>({ models: [], groups: [] });

    useEffect(() => {
        (async () => {
            const [rawModels, rawGroups] = await Promise.all([
                listModelsUseCase.execute(),
                listModelGroupsUseCase.execute()
            ]);

            const groups: CmsDataCmsGroup[] = rawGroups.map(g => ({
                id: g.id,
                slug: g.slug,
                label: g.name
            }));

            const models: CmsDataCmsModel<CmsDataCmsGroup>[] = rawModels
                .filter(model => model.group !== "hidden")
                .map(model => ({
                    id: model.modelId,
                    modelId: model.modelId,
                    label: model.name,
                    group: groups.find(g => g.slug === model.group)!
                }));

            setResult({ models, groups });
        })();
    }, []);

    return result;
};
