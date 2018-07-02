import { Entity } from "webiny-api/entities";
import type { Storage } from "webiny-file-storage";

declare type Config = {
    storage: Storage,
    folder: string
};

export default (config: Config) => {
    class User extends Entity {
        constructor() {
            super();

            this.attr("name").char();
            this.attr("document")
                .file()
                .setTags(["user"])
                .setFolder(config.folder)
                .setStorage(config.storage);
            this.attr("documents")
                .files()
                .setTags(["user"])
                .setFolder(config.folder)
                .setStorage(config.storage);
        }
    }

    User.classId = "User";
    User.tableName = "Users";

    return User;
};
