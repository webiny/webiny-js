import { ApiEndpoint, CmsModelField } from "~/types";

export interface FilterModelFieldsCallableParams {
    fields: CmsModelField[];
    layout: string[][];
    type: ApiEndpoint;
}
export interface FilterModelFieldsCallableResponse {
    fields: CmsModelField[];
    layout: string[][];
}
export interface FilterModelFieldsCallable {
    (params: FilterModelFieldsCallableParams): FilterModelFieldsCallableResponse;
}

export const filterModelFields: FilterModelFieldsCallable = params => {
    const { fields, layout, type } = params;
    if (type === "manage") {
        return {
            fields,
            layout
        };
    }

    const fieldIdList: string[] = [];
    const newFields = fields.reduce<CmsModelField[]>((output, field) => {
        if (!!field.isDeleted) {
            return output;
        } else if (field.settings?.fields) {
            const { fields: childFields, layout: childLayout } = filterModelFields({
                fields: field.settings.fields,
                layout: field.settings.layout || [],
                type
            });

            fieldIdList.push(field.id);

            output.push({
                ...field,
                settings: {
                    ...field.settings,
                    fields: childFields,
                    layout: childLayout
                }
            });
            return output;
        }

        output.push(field);

        fieldIdList.push(field.id);

        return output;
    }, []);

    const newLayout = layout.reduce<string[][]>((output, row) => {
        const cells = row.reduce<string[]>((cellOutput, cell) => {
            if (fieldIdList.some(id => id === cell)) {
                cellOutput.push(cell);
            }

            return cellOutput;
        }, []);

        if (cells.length === 0) {
            return output;
        }
        output.push(cells);

        return output;
    }, []);

    return {
        fields: newFields,
        layout: newLayout
    };
};
