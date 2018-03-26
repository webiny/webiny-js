// @flow
import { AttributeValue } from "webiny-model";
import type { Attribute } from "webiny-model";

import Entity from "./../entity";
import EntityCollection from "./../entityCollection";

class EntitiesAttributeValue extends AttributeValue {
    initial: Array<mixed> | EntityCollection;

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

        const classes = this.attribute.classes;

        this.state.loading = true;

        if (
            this.attribute
                .getParentModel()
                .getParentEntity()
                .isExisting()
        ) {
            if (this.attribute.getToStorage()) {
                if (classes.using.class) {
                    if (this.hasInitialLinks()) {
                        this.links.initial = await classes.using.class.findByIds(
                            this.links.initial
                        );

                        this.initial = new EntityCollection();
                        for (let i = 0; i < this.links.initial.length; i++) {
                            this.initial.push(await this.links.initial[i][classes.using.attribute]);
                        }
                    }
                } else {
                    if (this.hasInitial()) {
                        this.initial = await classes.entities.class.findByIds(this.initial);
                    }
                }
            } else {
                let id = await this.attribute
                    .getParentModel()
                    .getAttribute("id")
                    .getStorageValue();

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

    setInitial(value: Array<mixed> | EntityCollection): this {
        this.initial = value;
        return this;
    }

    getInitial(): Array<mixed> | EntityCollection {
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
            currentEntitiesIds = this.getCurrent().map(entity => entity.id);

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
        this.initial = this.getCurrent().map(entity => entity);
    }

    async manageCurrent() {
        const current = this.getCurrent();

        for (let i = 0; i < current.length; i++) {
            const entity = current[i];
            await entity.set(
                this.attribute.classes.entities.attribute,
                this.attribute.getParentModel().getParentEntity()
            );
        }
    }

    getInitialLinks(): Array<mixed> | EntityCollection {
        return this.links.initial;
    }

    hasInitialLinks(): boolean {
        return this.getInitialLinks().length > 0;
    }

    setInitialLinks(value: mixed): this {
        this.links.initial = value;
        return this;
    }

    getCurrentLinks(): EntityCollection {
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
            // $FlowIgnore
            currentLinksIds = this.getCurrentLinks().map(entity => entity.id);

        for (let i = 0; i < initialLinks.length; i++) {
            const initial = initialLinks[i];
            // $FlowIgnore
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

    async manageCurrentLinks(): Promise<void> {
        const links = [],
            current = this.getCurrent(),
            currentLinks = this.getCurrentLinks();

        for (let i = 0; i < current.length; i++) {
            const currentEntity = current[i];

            // Following chunk actually represents: "_.find(currentLinks, link => link.group === current);".
            // "for" loop used because of async operations.
            let link = null;
            for (let j = 0; j < currentLinks.length; j++) {
                // $FlowIgnore
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
                const entity = new (this.attribute.getUsingClass())();
                await entity.set(this.attribute.getUsingAttribute(), currentEntity);
                await entity.set(
                    this.attribute.getEntitiesAttribute(),
                    this.attribute.getParentModel().getParentEntity()
                );
                links.push(entity);
            }
        }

        this.setCurrentLinks(links);
    }

    /**
     * Value cannot be set as clean if ID is missing in one of the entities.
     * @returns {this}
     */
    clean(): this {
        const current = this.getCurrent();
        for (let i = 0; i < current.length; i++) {
            if (current[i] instanceof Entity) {
                if (!current[i].id) {
                    return this;
                }
            }
        }

        return super.clean();
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
