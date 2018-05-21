import { Group } from "webiny-api";

export default async () => {
    const entity = new Group();
    entity.populate({
        name: "Default",
        description: "Default group - applied to each identity automatically.",
        slug: "default",
        permissions: {
            api: {
                getIdentity: true,
                listCmsWidgets: {
                    list: { id: true, data: true, type: true, title: true, settings: true },
                    meta: { count: true, totalCount: true, totalPages: true }
                },
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
            }
        }
    });

    await entity.save();
};
