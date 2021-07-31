import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { AdminUsersContext, User } from "../../types";
import dbArgs from "../../crud/dbArgs";

type DbItem<T> = T & {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
};

const plugin: UpgradePlugin<AdminUsersContext> = {
    name: "api-upgrade-admin-users",
    type: "api-upgrade",
    app: "security",
    version: "5.11.1",
    async apply(context) {
        const { db } = context;

        const users = (await context.security.users.listUsers({ auth: false })) as DbItem<User>[];

        const batch = db.batch();

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            delete user["password"];
            batch.update({
                ...dbArgs,
                query: {
                    PK: user.PK,
                    SK: "A"
                },
                data: user
            });
        }

        await batch.execute();
    }
};

export default plugin;
