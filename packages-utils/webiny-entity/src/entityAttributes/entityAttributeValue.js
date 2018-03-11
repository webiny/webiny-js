// @flow
import { AttributeValue } from "webiny-model";
import type { Attribute } from "webiny-model";
import { Entity } from "webiny-entity";
import _ from "lodash";

class EntityAttributeValue extends AttributeValue {
    queue: Array<Function>;
    initial: ?mixed;
    constructor(attribute: Attribute) {
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
    async load() {
        if (this.isLoading()) {
            return new Promise(resolve => {
                this.queue.push(resolve);
            });
        }

        if (this.isLoaded()) {
            return;
        }

        this.state.loading = true;

        // Only if we have a valid ID set, we must load linked entity.
        const initial = this.getInitial();
        if (
            this.attribute
                .getParentModel()
                .getParentEntity()
                .isId(initial)
        ) {
            const entity = await this.attribute.getEntityClass().findById(initial);
            this.setInitial(entity);
            // If current value is not dirty, than we can set initial value as current, otherwise we
            // assume that something else was set as current value like a new entity.
            if (this.isClean()) {
                this.setCurrent(entity);
            }
        }

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
        const initial = this.getInitial();
        if (initial instanceof Entity && _.get(initial, "id") !== _.get(this.getCurrent(), "id")) {
            await initial.delete();
        }
    }

    syncInitial() {
        this.setInitial(this.getCurrent());
    }

    setInitial(value: mixed) {
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
