// @flow
import { Entity } from "webiny-api";
import type { Storage } from "webiny-file-storage";

declare type Config = {
    documentStorage: Storage,
    documentFolder: string
};

export default (config: Config) => {
    class User extends Entity {
        constructor() {
            super();

            this.attr("name").char();
            this.attr("document")
                .file()
                .setTags(["user"])
                .setFolder(config.documentFolder)
                .setStorage(config.documentStorage);
            this.attr("documents")
                .files()
                .setTags(["user"])
                .setFolder(config.documentFolder)
                .setStorage(config.documentStorage);
        }
    }

    User.classId = "User";
    User.tableName = "Users";

    return User;
};
