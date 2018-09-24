// @flow
import { Policy, Group } from "./../../entities";

export default async () => {
    const entity = new Policy();
    entity.populate({
        name: "FilesOwnersAccess",
        description: `Enables complete control over owned files.`,
        slug: "files-owners-access",
        system: true,
        permissions: {
            entities: {
                File: {
                    owner: "*"
                }
            }
        }
    });

    await entity.save();

    // Automatically add this policy to default group.
    const group: Group = (await Group.findOne({ query: { slug: "default" } }): any);

    const policies = await group.policies;
    group.policies = [...policies, entity];
    await group.save();
};
