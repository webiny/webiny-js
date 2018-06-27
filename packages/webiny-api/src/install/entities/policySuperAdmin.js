// @flow
import { Policy } from "./../../entities";

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
