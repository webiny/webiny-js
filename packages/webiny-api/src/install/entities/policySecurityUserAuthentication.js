// @flow
import { Policy, Group } from "./../../entities";

export default async () => {
    const entity = new Policy();
    entity.populate({
        name: "SecurityUserAuthentication",
        description: `Enables authentication for "User" identity and retrieval of current user's basic information.`,
        slug: "security-user-authentication",
        permissions: {
            api: {
                Security: {
                    Users: {
                        authenticate: {
                            token: true,
                            identity: {
                                id: true,
                                email: true,
                                groups: ["id", "slug"],
                                gravatar: true,
                                avatar: ["src", "size", "type", "name"],
                                lastName: true,
                                firstName: true
                            },
                            expiresOn: true
                        }
                    }
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
