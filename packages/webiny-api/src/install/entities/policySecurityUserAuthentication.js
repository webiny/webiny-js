// @flow
import { Policy, Group } from "./../../entities";

export default async () => {
    const entity = new Policy();
    entity.populate({
        name: "SecurityUserAuthentication",
        description: `Enables authentication for "User" identity and retrieval of current user's basic information.`,
        slug: "security-user-authentication",
        system: true,
        permissions: {
            entities: {
                SecurityUserAvatar: {
                    owner: "*"
                }
            },
            api: {
                Me: {
                    get: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        fullName: true,
                        avatar: ["id", "src", "size", "type", "name"]
                    },
                    groups: {
                        slug: true
                    }
                },
                Security: {
                    Users: {
                        authenticate: {
                            token: true,
                            identity: {
                                id: true,
                                email: true,
                                groups: ["id", "slug"],
                                gravatar: true,
                                avatar: ["id", "src", "size", "type", "name"],
                                lastName: true,
                                firstName: true,
                                fullName: true
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
