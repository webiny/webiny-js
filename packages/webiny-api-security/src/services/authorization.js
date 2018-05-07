// @flow
import type { IAuthorization } from "../../types";
import { app } from "webiny-api";

class Authorization implements IAuthorization {
    getEntityClasses() {
        return app.entities.getEntityClasses();
    }

    generateEntitiesAttributesList() {
        const classes = this.getEntityClasses();
        const output = [];

        classes.forEach(Entity => {
            const entity = new Entity();
            output.push({
                name: entity.getClassName(),
                id: entity.classId,
                attributes: Object.keys(entity.getAttributes()).map(key => {
                    const attribute = entity.getAttribute(key);
                    return {
                        name: attribute.getName(),
                        class: typeof attribute
                    };
                })
            });
        });

        return output;
    }
}

export default Authorization;
