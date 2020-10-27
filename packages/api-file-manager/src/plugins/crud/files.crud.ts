import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { pipe } from "@webiny/commodo";
import { validation } from "@webiny/validation";
import { withFields, string, number, setOnce, onSet } from "@commodo/fields";
import { object } from "commodo-fields-object";

// A simple data model
const File = pipe(
    withFields({
        id: setOnce()(string({ validation: validation.create("required") })),
        key: setOnce()(string({ validation: validation.create("required,maxLength:200") })),
        size: number(),
        type: string({ validation: validation.create("maxLength:50") }),
        name: string({ validation: validation.create("maxLength:100") }),
        meta: object(),
        tags: onSet(value => {
            if (!Array.isArray(value)) {
                return null;
            }

            return value.map(item => item.toLowerCase());
        })(
            string({
                list: true,
                validation: tags => {
                    if (!Array.isArray(tags)) {
                        return;
                    }

                    if (tags.length > 15) {
                        throw Error("You cannot set more than 15 tags.");
                    }

                    for (let i = 0; i < tags.length; i++) {
                        const tag = tags[i];
                        if (typeof tag !== "string") {
                            throw Error("Tag must be typeof string.");
                        }

                        if (tag.length > 50) {
                            throw Error(`Tag ${tag} is more than 50 characters long.`);
                        }
                    }
                }
            })
        )
    })
)();

const keys = [
    { primary: true, unique: true, name: "primary", fields: [{ name: "PK" }, { name: "SK" }] }
];

export const PK_FILE = "F";

export type File = {
    id: string;
    key: string;
    size: number;
    type: string;
    name: string;
    meta: Record<string, any>;
    tags: string[];
    createdOn: string;
};

export default {
    type: "context",
    apply(context) {
        const { db } = context;
        context.files = {
            async get(id: string) {
                const [[file]] = await db.read<File>({
                    keys,
                    query: { PK: PK_FILE, SK: id },
                    limit: 1
                });

                return file;
            },
            async list(args) {
                const [files] = await db.read<File>({
                    keys,
                    query: { PK: PK_FILE, SK: { $gt: " " } },
                    ...args
                });

                return files;
            },
            async create(data) {
                const { id } = data;

                // Use `WithFields` model for data validation and setting default value.
                const file = new File().populate(data);
                await file.validate();

                return db.create({
                    data: {
                        PK: PK_FILE,
                        SK: id,
                        key: file.key,
                        size: file.size,
                        type: file.type,
                        name: file.name,
                        meta: file.meta,
                        tags: file.tags
                    }
                });
            },
            async update(data) {
                const { id } = data;

                // Use `WithFields` model for data validation and setting default value.
                const file = new File().populate(data);
                await file.validate();

                return db.update({
                    keys,
                    query: { PK: PK_FILE, SK: id },
                    data: {
                        key: file.key,
                        size: file.size,
                        type: file.type,
                        name: file.name,
                        meta: file.meta,
                        tags: file.tags
                    }
                });
            },
            delete(id: string) {
                return db.delete({
                    keys,
                    query: { PK: PK_FILE, SK: id }
                });
            }
        };
    }
} as HandlerContextPlugin<HandlerContextDb>;
