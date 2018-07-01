import { Entity } from "webiny-api/entities";
import type { Storage } from "webiny-file-storage";
import type { ImageProcessor } from "../../types";

declare type Config = {
    storage: Storage,
    folder: string,
    processor: ImageProcessor
};

export default (config: Config) => {
    class Event extends Entity {
        constructor() {
            super();

            this.attr("name").char();
            this.attr("image")
                .image()
                .setPresets({ thumbnail: [] })
                .setQuality(95)
                .setTags(["event-header"])
                .setFolder(config.folder)
                .setStorage(config.storage)
                .setProcessor(config.processor);

            this.attr("images")
                .images()
                .setPresets({ thumbnail: [] })
                .setQuality(95)
                .setTags(["event-image"])
                .setFolder(config.folder)
                .setStorage(config.storage)
                .setProcessor(config.processor);
        }
    }

    Event.classId = "Event";
    Event.tableName = "Events";

    return Event;
};
