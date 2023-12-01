import { CmsEntry } from "@webiny/api-headless-cms/types";

interface RefValue {
    entryId: string;
    id: string;
    modelId: string;
}
interface ValuesOptionsVariant {
    number: number;
    colors: string[];
}
interface ValuesOptions {
    optionId: string;
    keys: string;
    variant: ValuesOptionsVariant;
}
interface ValuesInfoTag {
    title: string;
    slug: string;
}
interface ValuesInfo {
    keywords: string[];
    file: string;
    title: string;
    tags: ValuesInfoTag[];
}
interface Values {
    title: string;
    priority: number;
    parent: RefValue;
    authors: RefValue[];
    options: ValuesOptions[];
    info: ValuesInfo;
}

const createCreatedOn = (index: number) => {
    const d = new Date();
    d.setTime(d.getTime() + index * 1000 * 86400);

    return d.toISOString();
};

export const createEntry = (index = 0) => {
    return {
        id: `${index + 100000}#0001`,
        createdOn: createCreatedOn(index),
        createdBy: {
            id: "userId",
            type: "admin",
            displayName: "Admin"
        },
        values: {
            title: `Title modeled entry ${String(index).padStart(5, "t")}`,
            priority: index,
            parent: {
                id: "123#0001",
                entryId: "123",
                modelId: "someModel"
            },
            info: {
                keywords: [
                    `keyword ${index}`,
                    `keyword ${index + 1}`,
                    `keyword ${index + 2}`,
                    `keyword ${index + 3}`
                ],
                file: `some-text-file-${index}.txt`,
                title: `Info title ${String(index).padStart(5, "i")}`,
                tags: [
                    {
                        title: `tag #${index}1`,
                        slug: `tag-${index}2`
                    }
                ]
            },
            authors: [],
            options: [
                {
                    optionId: `option 1 #${String(index).padStart(10, "o")}`,
                    keys: `keys of the modeled entry ${String(index).padStart(5, "k")} - 1`,
                    variant: {
                        colors: index % 2 === 0 ? ["red", "blue"] : ["black", "white"],
                        number: index
                    }
                },
                {
                    optionId: `option 2 #${String(index).padStart(10, "o")}`,
                    keys: `keys of the modeled entry ${String(index).padStart(5, "k")} - 2`,
                    variant: {
                        colors: index % 2 === 0 ? ["yellow", "green"] : ["teal", "grey"],
                        number: index
                    }
                }
            ]
        }
    } as unknown as CmsEntry<Values>;
};

export const createEntries = (amount: number) => {
    return [...Array(amount)].map((_, index) => {
        return createEntry(index);
    });
};
