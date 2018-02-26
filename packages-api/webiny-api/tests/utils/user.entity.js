// @flow
import { Entity } from "webiny-api";
import type { Storage } from "webiny-file-storage";

declare type Config = {
    documentStorage: Storage
};

export default (config: Config) => {
    class User extends Entity {
        constructor() {
            super();

            this.attr("name").char();
            this.attr("document")
                .file()
                .setTags(["user"])
                .setStorage(config.documentStorage);
        }
    }

    User.classId = "User";
    User.tableName = "Users";

    return User;
};
