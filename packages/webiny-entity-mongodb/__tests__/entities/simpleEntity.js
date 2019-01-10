import _ from "lodash";
import Entity from "./entity";

class SimpleEntity extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("slug").char();
        this.attr("enabled")
            .boolean()
            .setDefaultValue(true);
        this.attr("tags").array();
        this.on("beforeSave", () => {
            this.slug = _.camelCase(this.name);
        });
    }
}

SimpleEntity.classId = "SimpleEntity";
export default SimpleEntity;
