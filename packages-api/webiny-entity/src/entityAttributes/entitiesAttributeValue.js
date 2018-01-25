// @flow
import { AttributeValue } from "webiny-model";
import Entity from "./../entity";
import EntityCollection from "./../entityCollection";
import _ from "lodash";

class EntitiesAttributeValue extends AttributeValue {
    initial: EntityCollection;

    constructor(attribute: IAttribute) {
        super(attribute);

        this.current = new EntityCollection();
        this.initial = new EntityCollection();

        this.links = {
            current: new EntityCollection(),
            initial: new EntityCollection()
        };

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
    async load(callback: ?Function) {
        if (this.isLoaded()) {
            typeof callback === "function" && (await callback());
            return this.current;
        }

        if (this.isLoading()) {
            return new Promise(resolve => {
                this.queue.push(async () => {
                    typeof callback === "function" && (await callback());
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
                if (this.hasCurrent()) {
                    if (classes.using.class) {
                        // TODO: finish this.
                        this.current = await classes.using.class.findByIds(this.current);
                    } else {
                        this.current = await classes.entities.class.findByIds(this.current);
                    }
                }
            } else {
                let id = await this.attribute
                    .getParentModel()
                    .getAttribute("id")
                    .getStorageValue();

                if (classes.using.class) {
                    this.links.current = await classes.using.class.find({
                        query: { [classes.using.attribute]: id }
                    });

                    this.current = new EntityCollection();
                    for (let i = 0; i < this.links.current.length; i++) {
                        // TODO: HC Ovo je krivo!
                        // this.current.push(await this.links.current[i][classes.using.attribute]);
                        this.current.push(await this.links.current[i]["group"]);
                    }
                } else {
                    this.current = await classes.entities.class.find({
                        query: { [classes.entities.attribute]: id }
                    });
                }
            }
        }

        // Set current entities as new values.
        this.syncInitial();

        typeof callback === "function" && (await callback());

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

    isLoaded(): boolean {
        return this.status.loaded;
    }

    isLoading(): boolean {
        return this.status.loading;
    }

    setInitial(value: EntityCollection): this {
        this.initial = value;
        return this;
    }

    getInitial(): EntityCollection {
        return this.initial;
    }

    hasInitial(): boolean {
        return this.initial.length > 0;
    }

    hasCurrent(): boolean {
        return this.current.length > 0;
    }

    hasInitialLinks(): boolean {
        return this.links.initial.length > 0;
    }

    hasCurrentLinks(): boolean {
        return this.links.current.length > 0;
    }

    getCurrentLinks(): EntityCollection {
        return this.links.current;
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

    async deleteInitial(): Promise<void> {
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
    syncInitial(): void {
        this.initial = this.getCurrent().map(entity => entity);

        if (this.attribute.getUsingClass()) {
            this.links.initial = this.getCurrentLinks().map(entity => entity);
        }
    }

    async syncLinks(): Promise<void> {
        const links = [];

        for (let i = 0; i < this.getCurrent().length; i++) {
            const current = this.getCurrent()[i];
            // TODO: HC
            const link = _.find(this.getCurrentLinks(), link => link.group === current);

            if (link) {
                links.push(link);
            } else {
                const entity = new (this.attribute.getUsingClass())();
                await entity.set("group", current);
                await entity.set("user", this.attribute.getParentModel().getParentEntity());
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
        for (let i = 0; i < this.getCurrent().length; i++) {
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
