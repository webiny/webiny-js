import { CmsModel } from "~/types";

/**
 * Method removes all the fields in both fields and layout properties of the model which do not have an alias defined.
 * Fields that do not have alias defined will NOT be available in the schema.
 */
export const cleanupModelFields = (model: CmsModel): CmsModel => {
    const fieldIdList: string[] = [];

    return {
        ...model,
        fields: model.fields.filter(field => {
            fieldIdList.push(field.id);
            return true;
        }),
        layout: model.layout.reduce((collection, input) => {
            const output = input.filter(id => fieldIdList.includes(id));
            if (output.length === 0) {
                return collection;
            }
            collection.push(output);
            return collection;
        }, [] as string[][])
    };
};
