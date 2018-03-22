import { Entity } from "../../src";

class Entity1 extends Entity {
    constructor() {
        super();
        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("number").integer();
        this.attr("type")
            .char()
            .setValidators("in:cat:dog:mouse:parrot");
        this.attr("markedAsCannotDelete").boolean();
        this.on("delete", () => {
            if (this.markedAsCannotDelete) {
                throw Error("Cannot delete Entity1 entity");
            }
        });
    }
}
Entity1.classId = "Entity1";

class Entity2 extends Entity {
    constructor() {
        super();
        this.attr("firstName")
            .char()
            .setValidators("required");
        this.attr("lastName")
            .char()
            .setValidators("required");
        this.attr("enabled").boolean();
        this.attr("markedAsCannotDelete").boolean();
        this.attr("entity1Entities").entities(Entity1);
        this.on("delete", () => {
            if (this.markedAsCannotDelete) {
                throw Error("Cannot delete Entity2 entity");
            }
        });
    }
}
Entity2.classId = "Entity2";

class MainEntity extends Entity {
    constructor() {
        super();
        this.attr("attribute1").entities(Entity1);
        this.attr("attribute2").entities(Entity2);
    }
}

MainEntity.classId = "MainEntity";

class MainSetOnceEntity extends Entity {
    constructor() {
        super();
        this.attr("attribute1")
            .entities(Entity1)
            .setOnce();
        this.attr("attribute2").entities(Entity2);
    }
}

MainSetOnceEntity.classId = "MainSetOnceEntity";

class MainEntityWithStorage extends Entity {
    constructor() {
        super();
        this.attr("attribute1")
            .entities(Entity1)
            .setToStorage();
        this.attr("attribute2")
            .entities(Entity2)
            .setToStorage();
    }
}

MainEntityWithStorage.classId = "MainEntityWithStorage";

export { Entity1, Entity2, MainEntity, MainSetOnceEntity, MainEntityWithStorage };
