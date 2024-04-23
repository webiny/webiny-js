import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";
import { CmsDynamicZoneTemplate } from "@webiny/app-headless-cms-common/types";
import { useParentField } from "~/admin/components/ContentEntryForm/ParentValue";
import { useModelField } from "~/admin/components/ModelFieldProvider";
import { useModel } from "~/admin/components/ModelProvider";

const createTypeName = (modelId: string): string => {
    return upperFirst(camelCase(modelId));
};

export const useTemplateTypename = () => {
    const { model } = useModel();
    const { field } = useModelField();
    const parent = useParentField();

    const getFullTypename = (template: CmsDynamicZoneTemplate) => {
        let currentParent = parent;
        const parents: string[] = [];
        while (currentParent) {
            parents.push(createTypeName(currentParent.field.fieldId));
            const nextParent = currentParent.getParentField(0);
            if (nextParent && nextParent.field !== currentParent.field) {
                currentParent = nextParent;
            } else {
                currentParent = currentParent.getParentField(1);
            }
        }

        return [
            model.singularApiName,
            ...parents.reverse(),
            createTypeName(field.fieldId),
            template.gqlTypeName
        ].join("_");
    };

    return { getFullTypename };
};
