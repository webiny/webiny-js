import { useMemo } from "react";
import { CmsModel, CmsModelField } from "~/types";
import { useContentModels as useBaseContentModels } from "~/admin/hooks";

interface Props {
    field: CmsModelField;
}
export const useContentModels = ({ field }: Props) => {
    const { models: initialModels } = useBaseContentModels();

    const models = useMemo((): CmsModel[] => {
        if (!initialModels) {
            return [];
        }
        return initialModels.filter(model => {
            if (!field.settings?.models || field.settings.models.length === 0) {
                return false;
            }
            return field.settings?.models.some(fieldModel => {
                return model.modelId === fieldModel.modelId;
            });
        });
    }, [initialModels]);

    return {
        models
    };
};
