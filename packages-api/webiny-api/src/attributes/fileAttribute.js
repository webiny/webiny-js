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
    async setValue(value) {
        const currentValue = await this.getValue();
        await EntityAttribute.prototype.setValue.call(this, value);

        const newValue = await this.getValue();
        if (newValue instanceof this.getEntityClass()) {
            newValue.tags = _.uniqWith(this.tags.concat(newValue.tags || []), _.isEqual);
            if (this.storage) {
                newValue.setStorage(this.storage).setStorageFolder(this.storageFolder);
            }
        }

        // If new value is being assigned and there is an existing file - delete the existing file after a successful save
        if (currentValue && (!newValue || currentValue.id !== newValue.id)) {
            this.getParentModel()
                .getParentEntity()
                .on("afterSave", async () => {
                    await currentValue.delete({ permanent: true });
                })
                .setOnce();
        }

        return this;
    }
}

export default FileAttribute;
