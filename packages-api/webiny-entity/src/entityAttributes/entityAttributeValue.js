import { AttributeValue } from "webiny-model";
import _ from "lodash";

class EntityAttributeValue extends AttributeValue {
    constructor(attribute) {
        super(attribute);
        this.queue = [];
        this.status = { loaded: false, loading: false };

        // Contains initial value received upon loading from storage. If the current value becomes different from initial,
        // upon save, old entity must be removed. This is only active when auto delete option on the attribute is enabled,
        // which then represents a one to one relationship.
        this.initial = null;
    }

    /**
     * Ensures data is loaded correctly, and in the end returns current value.
     * @returns {Promise<*>}
     */
    async load(callback) {
        if (this.isLoaded()) {
            _.isFunction(callback) && (await callback());
            return this.getCurrent();
        }

        if (this.isLoading()) {
            return new Promise(resolve => {
                this.queue.push(async () => {
                    _.isFunction(callback) && (await callback());
                    resolve(this.getCurrent());
                });
            });
        }

        this.status.loading = true;

        // Only if we have a valid ID set, we must load linked entity.
        if (
            this.attribute
                .getParentModel()
                .getParentEntity()
                .isId(this.getCurrent())
        ) {
            this.setCurrent(await this.attribute.getEntityClass().findById(this.getCurrent()));
        }

        // Set current entity as new initial value.
        this.syncInitial();

        _.isFunction(callback) && (await callback());

        this.status.loading = false;
        this.status.loaded = true;

        if (this.queue.length) {
            for (let i = 0; i < this.queue.length; i++) {
                await this.queue[i]();
            }
            this.queue = [];
        }

        return this.getCurrent();
    }

    async deleteInitial() {
        if (!this.hasInitial()) {
            return;
        }

        if (_.get(this.getInitial(), "id") !== _.get(this.getCurrent(), "id")) {
            await this.getInitial().delete();
        }
    }

    syncInitial() {
        this.setInitial(this.getCurrent());
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
        return this.initial instanceof this.attribute.getEntityClass();
    }

    /**
     * Value cannot be set as clean if there is no ID present.
     * @returns {EntityAttributeValue}
     */
    clean() {
        if (_.get(this.getCurrent(), "id")) {
            return super.clean();
        }

        return this;
    }
}

export default EntityAttributeValue;
