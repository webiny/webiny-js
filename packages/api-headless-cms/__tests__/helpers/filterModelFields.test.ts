/**
 * We will leave the test for isDeleted because it might come back later on.
 */
import { CmsModelField } from "~/types";

import { filterModelsDeletedFields } from "~/utils/filterModelFields";

interface FieldSettings {
    fields: Field[];
}
interface Field {
    id: string;
    isDeleted?: boolean;
    settings?: FieldSettings;
}

const fields: Field[] = [
    {
        id: "field_1",
        settings: {
            fields: [
                {
                    id: "field_1_1"
                },
                {
                    id: "field_1_2"
                },
                {
                    id: "field_1_3_deleted",
                    isDeleted: true
                },
                {
                    id: "field_1_4",
                    settings: {
                        fields: [
                            {
                                id: "field_1_4_1"
                            },
                            {
                                id: "field_1_4_2"
                            },
                            {
                                id: "field_1_4_3_deleted",
                                isDeleted: true
                            },
                            {
                                id: "field_1_4_4",
                                settings: {
                                    fields: [
                                        {
                                            id: "field_1_4_4_1"
                                        },
                                        {
                                            id: "field_1_4_4_2"
                                        },
                                        {
                                            id: "field_1_4_4_3_deleted",
                                            isDeleted: true
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        }
    },
    {
        id: "field_2_deleted",
        isDeleted: true
    },
    {
        id: "field_3"
    },
    {
        id: "field_4"
    },
    {
        id: "field_5"
    },
    {
        id: "field_6_deleted",
        isDeleted: true
    }
];

describe.skip("Filter model fields", () => {
    it("should filter deleted fields in case of not being manage endpoint", () => {
        const models = filterModelsDeletedFields({
            models: [
                {
                    fields: fields as unknown as CmsModelField[]
                }
            ] as any,
            type: "preview"
        });

        expect(models).toHaveLength(1);

        const result = models.shift();

        expect(result).toEqual({
            fields: [
                {
                    id: "field_1",
                    settings: {
                        fields: [
                            {
                                id: "field_1_1"
                            },
                            {
                                id: "field_1_2"
                            },
                            {
                                id: "field_1_4",
                                settings: {
                                    fields: [
                                        {
                                            id: "field_1_4_1"
                                        },
                                        {
                                            id: "field_1_4_2"
                                        },
                                        {
                                            id: "field_1_4_4",
                                            settings: {
                                                fields: [
                                                    {
                                                        id: "field_1_4_4_1"
                                                    },
                                                    {
                                                        id: "field_1_4_4_2"
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    id: "field_3"
                },
                {
                    id: "field_4"
                },
                {
                    id: "field_5"
                }
            ]
        });
    });
});
