import { AttributeValue } from "webiny-model";
import _ from "lodash";
import Entity from "./../entity";
import EntityCollection from "./../entityCollection";

class EntitiesAttributeValue extends AttributeValue {
    constructor(attribute) {
        super(attribute);

        this.current = new EntityCollection();
        this.initial = new EntityCollection();

        this.set = false;

        this.status = {
            loading: false,
            loaded: false
        };

        this.queue = [];
    }

    /**
     * Ensures data is loaded correctly, and in the end returns current value.
     * @returns {Promise<*>}
     */
    async load(callback) {
        if (this.isLoaded()) {
            _.isFunction(callback) && (await callback());
            return this.current;
        }

        if (this.isLoading()) {
            return new Promise(resolve => {
                this.queue.push(async () => {
                    _.isFunction(callback) && (await callback());
                    resolve(this.current);
                });
            });
        }

        const classes = this.attribute.classes;

        this.status.loading = true;

        if (
            this.attribute
                .getParentModel()
                .getParentEntity()
                .isExisting()
        ) {
            if (this.attribute.getToStorage()) {
                if (classes.using.class) {
                    // TODO: finish this.
                    this.current = await classes.using.class.findByIds(this.current);
                } else {
                    this.current = await classes.entities.class.findByIds(this.current);
                }
            } else {
                let id = await this.attribute
                    .getParentModel()
                    .getAttribute("id")
                    .getStorageValue();
                if (classes.using.class) {
                    this.current = await classes.using.class.find({
                        query: { [classes.using.attribute]: id }
                    });
                } else {
                    this.current = await classes.entities.class.find({
                        query: { [classes.entities.attribute]: id }
                    });
                }
            }
        }

        // Set current entities as new values.
        this.syncInitialCurrent();

        _.isFunction(callback) && (await callback());

        this.status.loading = false;
        this.status.loaded = true;

        if (this.queue.length) {
            for (let i = 0; i < this.queue.length; i++) {
                await this.queue[i]();
            }
            this.queue = [];
        }

        return this.current;
    }

    isLoaded() {
        return this.status.loaded;
    }

    isLoading() {
        return this.status.loading;
    }

    setInitial(value) {
        this.initial = value;
        return this;
    }

    getInitial() {
        return this.initial;
    }

    hasInitial() {
        return this.initial.length > 0;
    }

    async deleteInitial() {
        if (!this.hasInitial()) {
            return;
        }

        const currentEntitiesIds = this.current.map(entity => entity.id);

        for (let i = 0; i < this.getInitial().length; i++) {
            const initial = this.getInitial()[i];
            if (!currentEntitiesIds.includes(initial.id)) {
                await initial.delete();
            }
        }
    }

    /**
     * Creates a new array that contains all currently loaded entities.
     */
    syncInitialCurrent() {
        this.initial = this.getCurrent().map(entity => entity);
    }

    /**
     * Value cannot be set as clean if ID is missing in one of the entities.
     * @returns {EntityAttributeValue}
     */
    clean() {
        for (let i = 0; i < this.current.length; i++) {
            if (this.current[i] instanceof Entity) {
                if (!this.current[i].id) {
                    return this;
                }
            }
        }

        return super.clean();
    }
}

export default EntitiesAttributeValue;
