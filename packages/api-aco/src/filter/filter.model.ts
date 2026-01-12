import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const FILTER_MODEL_ID = "acoFilter";

class FilterPrivateModelImpl implements ModelFactory.Interface {
    execute(builder: ModelFactory.Builder) {
        return builder
            .private()
            .modelId(FILTER_MODEL_ID)
            .name("ACO - Filter")
            .fields(fields => ({
                name: fields.text().label("Name").required(),
                description: fields.text().label("Description"),
                namespace: fields.text().label("Model Id").required(),
                operation: fields
                    .text()
                    .label("Operation")
                    .required()
                    .predefinedValues([
                        {
                            label: "AND",
                            value: "AND"
                        },
                        {
                            label: "OR",
                            value: "OR"
                        }
                    ]),
                groups: fields
                    .object()
                    .label("Groups")
                    .list()
                    .listMinLength(1, "At least one group is required.")
                    .fields(fields => ({
                        operation: fields
                            .text()
                            .label("Operation")
                            .required()
                            .predefinedValues([
                                {
                                    label: "AND",
                                    value: "AND"
                                },
                                {
                                    label: "OR",
                                    value: "OR"
                                }
                            ]),
                        filters: fields
                            .object()
                            .label("Filters")
                            .list()
                            .listMinLength(1, "At least one filter is required.")
                            .fields(filterFields => ({
                                field: filterFields.text().label("Field").required(),
                                condition: filterFields.text().label("Condition").required(),
                                value: filterFields.text().label("Value").required()
                            }))
                    }))
            }));
    }
}

export const FilterPrivateModel = ModelFactory.createImplementation({
    implementation: FilterPrivateModelImpl,
    dependencies: []
});
