import { CmsModelField } from "~/types";

import { filterModelFields } from "~/utils/filterModelFields";

type Field = Pick<CmsModelField, "id"> & Partial<Pick<CmsModelField, "settings" | "isDeleted">>;

const fields: Field[] = [
    {
        id: "field_1_deleted",
        isDeleted: true
    },
    {
        id: "field_2"
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
    ["field_1_deleted"],
    ["field_2", "field_3"],
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
                    id: "field_2"
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
            layout: [["field_2", "field_3"], ["field_4"], ["field_5"]]
        });
    });
});
