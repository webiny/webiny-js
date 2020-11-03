import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { pipe } from "@webiny/commodo";
import { validation } from "@webiny/validation";
import { withFields, string, setOnce, boolean, skipOnPopulate } from "@commodo/fields";
import { object } from "commodo-fields-object";
import KSUID from "ksuid";

export const getJSON = instance => {
    const output = {};
    const fields = Object.keys(instance.getFields());
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        output[field] = instance[field];
    }
    return output;
};

// A simple data model
const GroupDataModel = pipe(
    withFields({
        id: pipe(setOnce())(string({ validation: validation.create("required") })),
        createdOn: pipe(skipOnPopulate(), setOnce())(string({ value: new Date().toISOString() })),
        savedOn: pipe(skipOnPopulate())(string({ value: new Date().toISOString() })),
        createdBy: object(),
        // Group data
        name: string({ validation: validation.create("required") }),
        slug: string({ validation: validation.create("required") }),
        description: string({ validation: validation.create("required") }),
        system: boolean({ value: false }),
        permissions: object({
            list: true,
            value: []
        })
    })
)();

const keys = [
    { primary: true, unique: true, name: "primary", fields: [{ name: "PK" }, { name: "SK" }] },
    { unique: true, name: "GSI1", fields: [{ name: "GSI1_PK" }, { name: "GSI1_SK" }] }
];

export const PK_GROUP = "G";
export const SK_GROUP = "A";
export const GSI1_PK_GROUP = "GROUP";

export type Group = {
    id: string;
    createdOn: string;
    savedOn: string;
    createdBy: Record<string, any>;
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: Record<string, any>[];
};

export default {
    type: "context",
    apply(context) {
        const { db } = context;
        context.groups = {
            async get(id: string) {
                const [[group]] = await db.read<Group>({
                    keys,
                    query: { PK: `${PK_GROUP}#${id}`, SK: SK_GROUP },
                    limit: 1
                });

                return group?.data;
            },
            async getBySlug(slug: string) {
                const [[group]] = await db.read<Group>({
                    keys,
                    query: { GSI1_PK: GSI1_PK_GROUP, GSI1_SK: `slug#${slug}` },
                    limit: 1
                });

                return group?.GSI_DATA;
            },
            async list(args) {
                const [groups] = await db.read<Group>({
                    keys,
                    query: { GSI1_PK: GSI1_PK_GROUP, GSI1_SK: { $beginsWith: args.beginsWith } },
                    ...args
                });

                return groups.map(group => group?.GSI_DATA).filter(Boolean);
            },
            async create(data) {
                const identity = context.security.getIdentity();

                // Don't allow creating group with same "slug".
                const existingGroup = await this.getBySlug(data.slug);
                if (existingGroup) {
                    throw {
                        message: `Group with slug "${data.slug}" already exists.`,
                        code: "GROUP_EXISTS"
                    };
                }

                // Use `WithFields` model for data validation and setting default value.
                const group = new GroupDataModel().populate(data);
                group.id = KSUID.randomSync().string;
                await group.validate();
                // Add "createdBy"
                group.createdBy = {
                    id: identity?.id,
                    displayName: identity?.displayName,
                    type: identity?.type
                };

                const batch = db.batch();

                batch.create(
                    {
                        data: {
                            PK: `${PK_GROUP}#${group.id}`,
                            SK: SK_GROUP,
                            GSI1_PK: GSI1_PK_GROUP,
                            GSI1_SK: `name#${group.name.toLowerCase()}`,
                            data: getJSON(group),
                            GSI_DATA: getJSON(group)
                        }
                    },
                    {
                        data: {
                            PK: `${PK_GROUP}#${group.id}`,
                            SK: "slug",
                            GSI1_PK: GSI1_PK_GROUP,
                            GSI1_SK: `slug#${group.slug}`,
                            data: getJSON(group),
                            GSI_DATA: getJSON(group)
                        }
                    }
                );

                await batch.execute();

                return group;
            },
            async update({ id, data, existingGroupData }) {
                // Only update incoming props
                const propsToUpdate = Object.keys(data);
                propsToUpdate.forEach(key => {
                    existingGroupData[key] = data[key];
                });

                // Don't allow updating group with existing "slug".
                if (data.slug) {
                    const existingGroup = await this.getBySlug(data.slug);
                    if (existingGroup) {
                        throw {
                            message: `Group with slug "${data.slug}" already exists.`,
                            code: "GROUP_EXISTS"
                        };
                    }
                }

                // Use `WithFields` model for data validation and setting default value.
                const group = new GroupDataModel().populate(existingGroupData);
                await group.validate();
                // Update meta data
                group.savedOn = new Date().toISOString();

                const batch = db.batch();

                batch.update(
                    {
                        keys,
                        query: { PK: `${PK_GROUP}#${id}`, SK: SK_GROUP },
                        data: {
                            PK: `${PK_GROUP}#${group.id}`,
                            SK: SK_GROUP,
                            GSI1_PK: GSI1_PK_GROUP,
                            GSI1_SK: `name#${group.name.toLowerCase()}`,
                            data: getJSON(group),
                            GSI_DATA: getJSON(group)
                        }
                    },
                    {
                        keys,
                        query: { PK: `${PK_GROUP}#${id}`, SK: SK_GROUP },
                        data: {
                            PK: `${PK_GROUP}#${group.id}`,
                            SK: "slug",
                            GSI1_PK: GSI1_PK_GROUP,
                            GSI1_SK: `slug#${group.slug}`,
                            data: getJSON(group),
                            GSI_DATA: getJSON(group)
                        }
                    }
                );

                await batch.execute();

                return group;
            },
            delete(id: string) {
                const batch = db.batch();

                const fields = ["A", "slug"];

                batch.delete(
                    ...fields.map(field => ({
                        keys,
                        query: {
                            PK: `${PK_GROUP}#${id}`,
                            SK: field
                        }
                    }))
                );

                return batch.execute();
            }
        };
    }
} as HandlerContextPlugin<HandlerContextDb>;
