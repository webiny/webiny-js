import { CmsModelField, CmsModel } from "~/types";

export const validateLayout = (model: CmsModel, fields: CmsModelField[] = []): void => {
    const layout = model.layout || [];
    const flatLayoutIdList = layout.reduce((acc, id) => {
        return acc.concat(Array.isArray(id) ? id : [id]);
    }, []);
    if (flatLayoutIdList.length !== fields.length) {
        throw new Error(
            `There are ${flatLayoutIdList.length} IDs in the layout and ${fields.length} in fields, which cannot be - numbers must be the same.`
        );
    }
    for (const field of fields) {
        if (flatLayoutIdList.includes(field.id)) {
            continue;
        }
        throw new Error(`Field "${field.id}" is not defined in layout.`);
    }
    for (const id of flatLayoutIdList) {
        const fieldFound = fields.some(f => f.id === id);
        if (fieldFound) {
            continue;
        }
        throw new Error(`Field id "${id}" is in layout but not in fields.`);
    }
};
