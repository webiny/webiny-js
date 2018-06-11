import { Policy, Group } from "./../../";

export default async () => {
    const entity = new Policy();
    entity.populate({
        name: "SecurityUserAuthentication",
        description: `Enables login for "User" identity and retrieval of current user's basic information.`,
        slug: "security-user-authentication",
        permissions: {
            api: {
                getIdentity: true,
                loginSecurityUser: {
                    token: true,
                    identity: {
                        id: true,
                        email: true,
                        groups: { id: true, slug: true },
                        gravatar: true,
                        lastName: true,
                        firstName: true
                    },
                    expiresOn: true
                }
            },
            entities: { SecurityUser: { other: { operations: { read: true } } } }
        }
    });

    await entity.save();

    // Automatically add this policy to default group.
    const group = await Group.findOne({ query: { slug: "default" } });

    const policies = await group.policies;
    group.policies = [...policies, entity];
    await group.save();
};
