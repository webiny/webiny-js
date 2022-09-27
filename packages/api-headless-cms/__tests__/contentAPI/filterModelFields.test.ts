import { CmsModelField } from "~/types";

import { filterModelFields } from "~/utils/filterModelFields";

interface FieldSettings {
    fields: Field[];
    layout: string[][];
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
                                    ],
                                    layout: [
                                        ["field_1_4_4_1", "field_1_4_4_2"],
                                        ["field_1_4_4_3_deleted"]
                                    ]
                                }
                            }
                        ],
                        layout: [
                            ["field_1_4_1", "field_1_4_2"],
                            ["field_1_4_3_deleted", "field_1_4_4"]
                        ]
                    }
                }
            ],
            layout: [["field_1_1", "field_1_2", "field_1_3_deleted"], ["field_1_4"]]
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

const layout: string[][] = [
    ["field_1"],
    ["field_2_deleted", "field_3"],
    ["field_4"],
    ["field_5", "field_6_deleted"]
];

describe("Filter model fields and layout", () => {
    it("should filter deleted fields in case of not being manage endpoint", () => {
        const result = filterModelFields({
            fields: fields as unknown as CmsModelField[],
            layout,
            type: "preview"
        });

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
                                                ],
                                                layout: [["field_1_4_4_1", "field_1_4_4_2"]]
                                            }
                                        }
                                    ],
                                    layout: [["field_1_4_1", "field_1_4_2"], ["field_1_4_4"]]
                                }
                            }
                        ],
                        layout: [["field_1_1", "field_1_2"], ["field_1_4"]]
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
            ],
            layout: [["field_1"], ["field_3"], ["field_4"], ["field_5"]]
        });
    });
});
