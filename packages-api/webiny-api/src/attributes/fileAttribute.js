// @flow
import _ from "lodash";
import { EntityAttribute, type EntityAttributesContainer } from "webiny-entity";
import { File } from "./../index";
import type { Storage } from "webiny-file-storage";

class FileAttribute extends EntityAttribute {
    storage: Storage;

    constructor(name: string, attributesContainer: EntityAttributesContainer) {
        super(name, attributesContainer, File);
        // TODO: @adrian onSetNull:delete ?
        // mozda onSet, koji ce provjeriti dobiveni value, i ako je null, registrirati event onAfterSave, koji ce obrisati file ?
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
            value = _.uniqWith(value.tags.concat(this.tags), _.isEqual);
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

        // If new files is being assigned and there is an existing file - delete the existing file after a successful save
        if (currentValue && currentValue.id !== (await this.getValue()).id) {
            this.getParentModel()
                .getParentEntity()
                .on("afterSave", async () => {
                    await currentValue.delete();
                })
                .setOnce();
        }

        return this;
    }
}

export default FileAttribute;
