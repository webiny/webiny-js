/**
 * Create onSet callback for the specified Entity class.
 * The callback is used on `entities` attributes for Role, RoleGroup and Permission entities
 * to handle different types of data: id, slug, {id}, {slug}.
 *
 * @param EntityClass
 * @returns {function(*=)}
 */
export default EntityClass => {
    return async entities => {
        if (Array.isArray(entities)) {
            for (let i = 0; i < entities.length; i++) {
                let value = entities[i];
                // If not DB ids - load entities by slugs
                if (!EntityClass.isId(value)) {
                    if (typeof value === "string") {
                        value = await EntityClass.findOne({ query: { slug: value } });
                    } else if (value.id) {
                        value = value.id;
                    } else if (value.slug) {
                        value = await EntityClass.findOne({ query: { slug: value.slug } });
                    }
                }

                entities[i] = value;
            }

            entities = entities.filter(Boolean);
        }

        return entities;
    };
};
