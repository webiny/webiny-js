import { Policy } from "./../../";

export default async () => {
    const entity = new Policy();
    entity.populate({
        name: "SuperAdmin",
        description: "Full API and entities access.",
        slug: "super-admin",
        permissions: {
            api: {
                "*": true
            },
            entities: {
                "*": true
            }
        }
    });

    await entity.save();
};
