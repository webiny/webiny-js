// @flow
import { AttributeValue, type Attribute } from "webiny-model";
import { Entity, EntityModel, type EntityAttribute } from "../index";
import _ from "lodash";

class EntityAttributeValue extends AttributeValue {
    queue: Array<Function>;
    initial: ?mixed;
    parentModel: EntityModel;
    constructor(attribute: Attribute) {
        super(attribute);
        this.queue = [];

        // Contains initial value received upon loading from storage. If the current value becomes different from initial,
        // upon save, old entity must be removed. This is only active when auto delete option on the attribute is enabled,
        // which then represents a one to one relationship.
        this.initial = null;

        this.parentModel = (this.attribute.getParentModel(): any);
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
        if (this.parentModel.getParentEntity().isId(initial)) {
            const attribute: EntityAttribute = (this.attribute: any);
            const entityClass = attribute.getEntityClass();

            if (entityClass) {
                const entity = await entityClass.findById(initial);
                this.setInitial(entity);
                // If current value is not dirty, than we can set initial value as current, otherwise we
                // assume that something else was set as current value like a new entity.
                if (this.isClean()) {
                    this.setCurrent(entity, { skipDifferenceCheck: true });
                }
            }
        }

        this.state.loading = false;
        this.state.loaded = true;

        await this.__executeQueue();

        return this.getCurrent();
    }

    async deleteInitial(options: ?{}) {
        if (!this.hasInitial()) {
            return;
        }

        // Initial value will always be an existing (already saved) Entity instance.
        const initial = this.getInitial();
        if (
            Entity.isEntityInstance(initial) &&
            _.get(initial, "id") !== _.get(this.getCurrent(), "id")
        ) {
            await initial.delete(options);
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
        const attribute: EntityAttribute = (this.attribute: any);
        return Entity.isInstanceOf(this.initial, attribute.getEntityClass());
    }

    isDirty(): boolean {
        if (super.isDirty()) {
            return true;
        }
        return Entity.isEntityInstance(this.current) && this.current.isDirty();
    }

    isClean(): boolean {
        return !this.isDirty();
    }

    /**
     * Value cannot be set as clean if there is no ID present.
     * @returns {EntityAttributeValue}
     */
    clean(): EntityAttributeValue {
        if (_.get(this.getCurrent(), "id")) {
            super.clean();
        }

        return this;
    }

    isDifferentFrom(value: mixed): boolean {
        const currentId = _.get(this.current, "id", this.current);

        if (Entity.isEntityInstance(value)) {
            return !value.id || value.id !== currentId;
        }

        if (value instanceof Object) {
            if (!value.id) {
                return true;
            }
            return value.id !== currentId || Object.keys(value).length > 1;
        }

        return currentId !== value;
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
