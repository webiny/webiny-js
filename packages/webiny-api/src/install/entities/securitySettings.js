import { Settings } from "webiny-api";

export default async () => {
    const entity = new Settings();
    entity.populate({
        key: "webiny-api-security",
        data: {
            entities: {
                File: {
                    group: { operations: {} },
                    other: { operations: {} },
                    owner: { operations: {} }
                },
                Image: {
                    group: { operations: {} },
                    other: { operations: {} },
                    owner: { operations: {} }
                },
                update: { undefined: { operations: { owner: true } } },
                CmsPage: { group: { operations: {} }, other: { operations: {} } },
                SecurityUser: {
                    group: { operations: {} },
                    other: { operations: { read: true } },
                    owner: { operations: { read: true, update: true } }
                },
                SecurityGroup: {
                    group: { operations: {} },
                    other: { operations: { read: true } },
                    owner: { operations: {} }
                },
                SecuritySettings: { owner: { operations: {} } }
            }
        }
    });

    await entity.save();
};
