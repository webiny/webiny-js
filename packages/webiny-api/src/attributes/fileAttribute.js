// @flow
import _ from "lodash";
import { EntityAttribute, type EntityAttributesContainer } from "webiny-entity";
import type { Storage } from "webiny-file-storage";
import type { File } from "./../index";

class FileAttribute extends EntityAttribute {
    storage: Storage;
    storageFolder: string;
    tags: Array<string>;

    constructor(name: string, attributesContainer: EntityAttributesContainer, entity: Class<File>) {
        super(name, attributesContainer, entity);
        this.tags = [];
        this.auto.delete = {
            enabled: true,
            options: { permanent: true }
        };
    }

    /**
     * Set tags that will always be assigned to the file
     *
     * @param tags
     *
     * @return this
     */
    setTags(tags: Array<string> = []): FileAttribute {
        this.tags = tags;

        return this;
    }

    /**
     * Set storage to use with this attribute
     *
     * @param {Storage} storage
     *
     * @return this
     */
    setStorage(storage: Storage): FileAttribute {
        this.storage = storage;

        return this;
    }

    /**
     * Set folder in which the file will be stored (relative to the root of your storage)
     *
     * @param {string} folder
     *
     * @return this
     */
    setFolder(folder: string): FileAttribute {
        this.storageFolder = folder;

        return this;
    }

    async getValue() {
        let value = await EntityAttribute.prototype.getValue.call(this);
        if (value instanceof this.getEntityClass()) {
            if (this.storage) {
                value.setStorage(this.storage).setStorageFolder(this.storageFolder);
            }
        }

        return value;
    }

    // $FlowIgnore
    setValue(value) {
        if (Array.isArray(_.get(value, "tags"))) {
            value.tags = _.uniqWith([...this.tags, ...(value.tags || [])], _.isEqual);
        }

        super.setValue(value);
    }
}

export default FileAttribute;
