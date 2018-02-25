/**
 * Create onSet callback for the specified Entity class.
 * The callback is used on `entities` attributes for Role, RoleGroup and Permission entities
 * to handle different types of data: id, slug, {id}, {slug}.
 *
 * @param EntityClass
 * @returns {function(*=)}
 */
import { EntityCollection } from "webiny-entity";

export default EntityClass => {
    return async entities => {
        if (Array.isArray(entities)) {
            for (let i = 0; i < entities.length; i++) {
                let value = entities[i];
                let query = { id: value };
                // If not DB ids - load entities by slugs
                if (!EntityClass.isId(value)) {
                    if (typeof value === "string") {
                        query = { slug: value };
                    } else if (value.id) {
                        query = { id: value.id };
                    } else if (value.slug) {
                        query = { slug: value.slug };
                    }
                }

                // TODO: ne bi htio loadati entitet tu jer to je samo populate
                entities[i] = await EntityClass.findOne({ query });
            }

            return new EntityCollection(entities.filter(Boolean));
        }

        return entities;
    };
};
