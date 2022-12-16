import { CmsEntry } from "@webiny/api-headless-cms/types";
interface ValuesOption {
    title: string;
    value: number;
}

interface ValuesVariantSpecification {
    key: string;
    value: string;
    info?: {
        [key: string]: any;
    };
}
interface ValuesVariant {
    title: string;
    specifications: ValuesVariantSpecification[];
}
interface Values {
    title: string;
    options: ValuesOption[];
    variant: ValuesVariant;
}
export const createEntry = (): Pick<
    CmsEntry<Values>,
    "values" | "createdBy" | "createdOn" | "id"
> => {
    return {
        id: "1234567890#0005",
        createdOn: "2022-12-15T14:54:59Z",
        createdBy: {
            id: "userId",
            type: "admin",
            displayName: "Admin"
        },
        values: {
            title: "Title",
            options: Array.from({ length: 100 }).map((_, index) => {
                return {
                    title: `Option #${index + 1}`,
                    value: index + 1
                };
            }),
            variant: {
                title: "Variant title",
                specifications: [
                    {
                        key: "Specification #1",
                        value: "1",
                        info: {
                            images: {
                                files: ["image1.jpg", "image2.jpg", "image3.jpg", "image4.jpg"]
                            },
                            tags: [
                                {
                                    key: "size",
                                    value: "55"
                                },
                                {
                                    key: "weight",
                                    value: "105"
                                },
                                {
                                    key: "price",
                                    value: "999 EUR"
                                }
                            ]
                        }
                    },
                    {
                        key: "Specification #2",
                        value: "2"
                    },
                    {
                        key: "Specification #3",
                        value: "3",
                        info: {
                            images: {
                                files: ["image31.jpg", "image32.jpg", "image33.jpg", "image34.jpg"]
                            },
                            tags: [
                                {
                                    key: "size",
                                    value: "355"
                                },
                                {
                                    key: "price",
                                    value: "3999 EUR"
                                }
                            ]
                        }
                    }
                ]
            }
        }
    };
};
