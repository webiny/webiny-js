import { CmsEntry } from "@webiny/api-headless-cms/types";
interface ValuesOption {
    title: string;
    value: number;
}

interface ValuesVariantSpecification {
    key: string;
    value: string | number;
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

type Result = Pick<CmsEntry<Values>, "id" | "createdBy" | "createdOn" | "values">;

const createCreatedOn = (index: number) => {
    const d = new Date();
    d.setTime(d.getTime() + index * 1000 * 86400);

    return d.toISOString();
};

export const createEntry = (index = 0): Result => {
    return {
        id: `${index + 100000}#0001`,
        createdOn: createCreatedOn(index),
        createdBy: {
            id: "userId",
            type: "admin",
            displayName: "Admin"
        },
        values: {
            title: `Title #${String(index).padStart(5, "t")}`,
            options: Array.from({ length: 100 }).map((_, optionIndex) => {
                return {
                    title: `Option #${index + optionIndex + 1}`,
                    value: index + optionIndex + 1
                };
            }),
            variant: {
                title: `Variant title ${String(index).padStart(5, "a")}`,
                specifications: [
                    {
                        key: `Specification #${index === 0 ? 1 : index}`,
                        value: `${index + 100}`,
                        info: {
                            images: {
                                files: ["image1.jpg", "image2.jpg", "image3.jpg", "image4.jpg"]
                            },
                            tags: [
                                {
                                    key: "size",
                                    value: 55
                                },
                                {
                                    key: "weight",
                                    value: 105
                                },
                                {
                                    key: "price",
                                    value: 999
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
                                    value: 355
                                },
                                {
                                    key: "price",
                                    value: 3999
                                }
                            ]
                        }
                    }
                ]
            }
        }
    };
};

export const createEntries = (amount: number) => {
    return [...Array(amount)].map((_, index) => {
        return createEntry(index);
    });
};
