// @flow
import { Entity } from "webiny-api";
import type { Storage } from "webiny-file-storage";
import type { ImageProcessor } from "../../types";

declare type Config = {
    documentStorage: Storage,
    documentFolder: string,
    imageProcessor: ImageProcessor
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

            /*this.attr("avatar")
                .image()
                .setPresets({
                    thumbnail: [
                        { action: 'resize', width: 100 },
                        { action: 'crop', width: 100, height: 30, x: 20, y: 20 },
                        { action: 'radius', r: 20 },
                    ]
                })
                .setQuality(95)
                .setTags(["user"])
                .setFolder(config.documentFolder)
                .setStorage(config.documentStorage)
                .setProcessor(config.imageProcessor);*/
        }
    }

    User.classId = "User";
    User.tableName = "Users";

    return User;
};
