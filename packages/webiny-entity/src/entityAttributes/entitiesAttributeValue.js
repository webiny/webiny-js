// @flow
import { AttributeValue, type Attribute } from "webiny-model";
import type { EntitiesAttribute, EntityModel } from "../index";

import Entity from "./../entity";
import EntityCollection from "./../entityCollection";
import _ from "lodash";

class EntitiesAttributeValue extends AttributeValue {
    initial: EntityCollection<$Subtype<Entity>>;
    links: Object;
    queue: Array<Function>;
    parentModel: EntityModel;
    constructor(attribute: Attribute) {
        super(attribute);

        this.current = new EntityCollection();
        this.initial = new EntityCollection();

        this.links = {
            dirty: false,
            set: false,
            current: new EntityCollection(),
            initial: new EntityCollection()
        };

        this.state = {
            loading: false,
            loaded: false
        };

        this.queue = [];

        this.parentModel = (this.attribute.getParentModel(): any);
    }

    /**
     * Ensures data is loaded correctly, and in the end returns current value.
     * @returns {Promise<*>}
     */
    async load() {
        if (this.isLoading()) {
            return new Promise(resolve => this.queue.push(resolve));
        }

        if (this.isLoaded()) {
            return;
        }

        const attribute: EntitiesAttribute = (this.attribute: any);
        const classes = attribute.classes;

        this.state.loading = true;

        if (this.parentModel.getParentEntity().isExisting()) {
            const idAttribute: Attribute = (this.parentModel
                .getParentEntity()
                .getAttribute("id"): any);
            let id = await idAttribute.getStorageValue();

            if (classes.using.class) {
                this.links.initial = await classes.using.class.find({
                    query: { [classes.entities.attribute]: id }
                });

                this.initial = new EntityCollection();
                for (let i = 0; i < this.links.initial.length; i++) {
                    this.initial.push(await this.links.initial[i][classes.using.attribute]);
                }
            } else {
                this.initial = await classes.entities.class.find({
                    query: { [classes.entities.attribute]: id }
                });
            }

            if (this.isClean()) {
                const initial = this.getInitial();
                const initialLinks = this.getInitialLinks();
                if (Array.isArray(initial) && Array.isArray(initialLinks)) {
                    this.setCurrent(new EntityCollection(initial), { skipDifferenceCheck: true });
                    if (classes.using.class) {
                        this.setCurrentLinks(new EntityCollection(initialLinks), {
                            skipDifferenceCheck: true
                        });
                    }
                }
            }
        }

        this.state.loading = false;
        this.state.loaded = true;

        await this.__executeQueue();

        return this.current;
    }

    setInitial(value: EntityCollection<Entity>): this {
        this.initial = value;
        return this;
    }

    getInitial(): EntityCollection<Entity> {
        return this.initial;
    }

    hasInitial(): boolean {
        return this.getInitial().length > 0;
    }

    hasCurrent(): boolean {
        return this.getCurrent().length > 0;
    }

    async deleteInitial(): Promise<void> {
        // If initial is empty, that means nothing was ever loaded (attribute was not accessed) and there is nothing to do.
        // Otherwise, deleteInitial method will internally delete only entities that are not needed anymore.
        if (!this.hasInitial()) {
            return;
        }

        const initial = this.getInitial(),
            currentEntitiesIds = this.getCurrent().map(entity => _.get(entity, "id"));

        for (let i = 0; i < initial.length; i++) {
            const currentInitial: mixed = initial[i];
            if (currentInitial instanceof Entity) {
                if (!currentEntitiesIds.includes(currentInitial.id)) {
                    await currentInitial.delete();
                }
            }
        }
    }

    /**
     * Creates a new array that contains all currently loaded entities.
     */
    syncInitial(): void {
        this.initial = new EntityCollection(this.getCurrent().map(entity => entity));
    }

    async manageCurrent() {
        const current = this.getCurrent();

        for (let i = 0; i < current.length; i++) {
            const entity = current[i];
            if (entity instanceof Entity) {
                const attribute: EntitiesAttribute = (this.attribute: any);
                const classes = attribute.classes;

                await entity.set(classes.entities.attribute, this.parentModel.getParentEntity());
            }
        }
    }

    getCurrent(): EntityCollection<$Subtype<Entity>> {
        return ((super.getCurrent(): any): EntityCollection<$Subtype<Entity>>);
    }

    getInitialLinks(): Array<$Subtype<Entity>> | EntityCollection<$Subtype<Entity>> {
        return this.links.initial;
    }

    hasInitialLinks(): boolean {
        return this.getInitialLinks().length > 0;
    }

    setInitialLinks(value: mixed): this {
        this.links.initial = value;
        return this;
    }

    getCurrentLinks(): EntityCollection<$Subtype<Entity>> {
        return this.links.current;
    }

    hasCurrentLinks(): boolean {
        return this.getCurrentLinks().length > 0;
    }

    setCurrentLinks(value: mixed, options: Object = {}): this {
        this.links.set = true;

        if (!options.skipDifferenceCheck) {
            if (this.isDifferentFrom(value)) {
                this.links.dirty = true;
            }
        }

        this.links.current = value;
        return this;
    }

    async deleteInitialLinks(): Promise<void> {
        // If initial is empty, that means nothing was ever loaded (attribute was not accessed) and there is nothing to do.
        // Otherwise, deleteInitial method will internally delete only entities that are not needed anymore.
        if (!this.hasInitialLinks()) {
            return;
        }

        const initialLinks = this.getInitialLinks(),
            // $FlowFixMe
            currentLinksIds = this.getCurrentLinks().map(entity => entity.id);

        for (let i = 0; i < initialLinks.length; i++) {
            const initial = initialLinks[i];
            // $FlowFixMe
            if (!currentLinksIds.includes(initial.id)) {
                initial instanceof Entity && (await initial.delete());
            }
        }
    }

    /**
     * Creates a new array that contains all currently loaded entities.
     */
    syncInitialLinks(): void {
        this.links.initial = this.getCurrentLinks().map(entity => entity);
    }

    /**
     * Sets current links, based on initial and currently set entities.
     *
     * How links-management works?
     * When entities are set, on "__save" event, attribute will be first loaded - meaning all initial (from storage)
     * linked entities and its links will be loaded ("this.initial" / "this.links.initial"). After that, this method
     * will iterate over all newly set entities, and check if for each a link is already existing. If so, it will
     * use it, otherwise a new instance is created, linking parent and set entity together.
     *
     * Additional note: previously, there was an idea that link entities could also contain additional information.
     * This still could works for lists in which entities are all unique, meaning all entities show only once in
     * the list. In cases where a single entity can appear more than once, this might not be the best solution, since
     * linking problems can appear.
     *
     * Eg. if user has a list of entities: A - A - B - C, and if links have a specific information, reordering
     * first two A entities wouldn't make a difference, and nothing would be updated.
     *
     * But generally, this is a bad approach to have, in cases where links need to have additional data, a new entity
     * would have to be made, linking the A product and containing all needed information.
     *
     * Basic example of this is a cart, with added products. Added product might appear many times, in different
     * colors and sizes, so here it would be best to just create CartItem entity, that links the product and contains
     * needed information.
     *
     * Link entities can be extended with additional attributes where it's sure that no duplicates can occur.
     * @returns {Promise<void>}
     */
    async manageCurrentLinks(): Promise<void> {
        const links = [],
            current = this.getCurrent(),
            currentLinks = this.getInitialLinks();

        for (let i = 0; i < current.length; i++) {
            const currentEntity = current[i];

            // Following chunk actually represents: "_.find(currentLinks, link => link.<entity> === current);".
            // "for" loop used because of async operations.
            let link = null;
            for (let j = 0; j < currentLinks.length; j++) {
                // $FlowFixMe
                const linkedEntity = await currentLinks[j][this.attribute.getUsingAttribute()];
                if (linkedEntity === currentEntity) {
                    link = currentLinks[j];
                    break;
                }
            }

            // If entity has an already existing link instance, it will be used. Otherwise a new instance will be created.
            // Links array cannot contain two same instances.
            if (link && !links.includes(link)) {
                links.push(link);
            } else {
                const attr: Object = {
                    instance: ((this.attribute: any): EntitiesAttribute)
                };

                attr.usingClass = attr.instance.getUsingClass();
                attr.usingAttribute = attr.instance.getUsingAttribute();
                attr.entitiesAttribute = attr.instance.getEntitiesAttribute();

                if (attr.usingClass && attr.usingAttribute && attr.entitiesAttribute) {
                    const entity = new attr.usingClass();
                    await entity.set(attr.usingAttribute, currentEntity);
                    await entity.set(
                        attr.entitiesAttribute,
                        attr.instance.getParentModel().getParentEntity()
                    );
                    links.push(entity);
                }
            }
        }

        this.setCurrentLinks(links);
    }

    /**
     * Value cannot be set as clean if ID is missing in one of the entities.
     * @returns {this}
     */
    clean(): EntitiesAttributeValue {
        const current = this.getCurrent();
        for (let i = 0; i < current.length; i++) {
            if (current[i] instanceof Entity) {
                if (!current[i].id) {
                    return this;
                }
            }
        }

        super.clean();
        return this;
    }

    isDirty(): boolean {
        if (super.isDirty()) {
            return true;
        }
        if (Array.isArray(this.current)) {
            for (let i = 0; i < this.current.length; i++) {
                if (this.current[i] instanceof Entity && this.current[i].isDirty()) {
                    return true;
                }
            }
        }
        return false;
    }

    isClean(): boolean {
        return !this.isDirty();
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

export default EntitiesAttributeValue;
