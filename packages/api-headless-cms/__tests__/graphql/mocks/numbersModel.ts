import { CmsGroup } from "~/types";
import { CmsModel } from "../../types";

const floats = [2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20];

export const createNumbersModel = (group: CmsGroup): CmsModel => {
    const model: CmsModel = {
        modelId: "numberModel",
        singularApiName: "NumberModel",
        pluralApiName: "NumberModels",
        group: {
            id: group.id,
            name: group.name
        },
        name: "Numbers",
        description: "",
        titleFieldId: "title",
        fields: [
            {
                id: "integer",
                storageId: "number@integer",
                fieldId: "integer",
                type: "number",
                validation: [],
                settings: {},
                label: "Integer"
            },
            ...floats.map(f => {
                return {
                    id: `float${f}`,
                    storageId: `number@float${f}`,
                    fieldId: `float${f}`,
                    type: "number",
                    validation: [],
                    settings: {},
                    label: `Float ${f}`
                };
            })
        ],
        layout: []
    };

    model.layout = model.fields.map(field => {
        return [field.id];
    });

    return model;
};

interface Data {
    integer: number;
    float2: number;
    float5: number;
    float6: number;
    float7: number;
    float8: number;
    float9: number;
    float10: number;
    float11: number;
    float12: number;
    float13: number;
    float14: number;
    float15: number;
    float20: number;
}
export const createNumbersEntryMutation = (data: Data) => {
    return {
        body: {
            query: `mutation CreateNumberModelEntry($data: NumberModelInput!) {
                    createNumberModel(data: $data) {
                        data {
                            id
                            integer
                            ${floats.map(f => {
                                return `float${f}`;
                            })}
                        }
                        error {
                            message
                            code
                            data
                        }
                    }
                }`,
            variables: {
                data
            }
        }
    };
};

export const listNumbersEntryQuery = () => {
    return {
        body: {
            query: `query ListNumberModelEntry {
                listNumberModels {
                    data {
                        id
                        integer
                        ${floats.map(f => {
                            return `float${f}`;
                        })}
                    }
                    error {
                        message
                        code
                        data
                    }
                }
            }`
        }
    };
};

export const getNumbersEntryQuery = (revision: string) => {
    return {
        body: {
            query: `query GetNumberModelEntry($revision: ID!) {
                    getNumberModel(revision: $revision) {
                        data {
                            id
                            integer
                            ${floats.map(f => {
                                return `float${f}`;
                            })}
                        }
                        error {
                            message
                            code
                            data
                        }
                    }
                }`,
            variables: {
                revision
            }
        }
    };
};
