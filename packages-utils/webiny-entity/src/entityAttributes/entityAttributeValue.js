import { AttributeValue } from "webiny-model";
import _ from "lodash";

class EntityAttributeValue extends AttributeValue {
    constructor(attribute) {
        super(attribute);
        this.queue = [];

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
        if (this.isLoading()) {
            return new Promise(resolve => {
                this.queue.push(async () => {
                    _.isFunction(callback) && (await callback());
                    resolve(this.getCurrent());
                });
            });
        }

        if (this.isLoaded()) {
            this.state.loading = true;
            _.isFunction(callback) && (await callback());
            this.state.loading = false;

            await this.__executeQueue();

            return this.getCurrent();
        }

        this.state.loading = true;

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

        this.state.loading = false;
        this.state.loaded = true;

        await this.__executeQueue();

        return this.getCurrent();
    }

    async deleteInitial() {
        if (!this.hasInitial()) {
            return;
        }

        // Initial value will always be an existing (already saved) Entity instance.
        if (_.get(this.getInitial(), "id") !== _.get(this.getCurrent(), "id")) {
            await this.getInitial().delete();
        }
    }

    syncInitial() {
        this.setInitial(this.getCurrent());
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

    async __executeQueue() {
        if (this.queue.length) {
            for (let i = 0; i < this.queue.length; i++) {
                await this.queue[i]();
            }
            this.queue = [];
        }
    }
}

export default EntityAttributeValue;
