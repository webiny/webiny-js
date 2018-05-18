import { Settings } from "webiny-api";

export default async () => {
    const entity = new Settings();
    entity.populate({
        key: "webiny-api-security",
        data: {
            entities: {
                SecurityUser: {
                    other: { operations: { read: true } },
                    owner: { operations: { read: true, update: true } }
                },
                SecurityGroup: {
                    other: { operations: { read: true } }
                }
            }
        }
    });

    await entity.save();
};
