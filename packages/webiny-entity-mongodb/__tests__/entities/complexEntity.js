import { Model } from "webiny-model";
import Entity from "./entity";

class VerificationModel extends Model {
    constructor() {
        super();
        this.attr("verified").boolean();
        this.attr("documentType")
            .char()
            .setValidators("in:id:driversLicense");
    }
}

class TagModel extends Model {
    constructor() {
        super();
        this.attr("slug").char();
        this.attr("label").char();
    }
}

class SimpleEntity extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

SimpleEntity.classId = "SimpleEntity";

class ComplexEntities2SimpleEntities extends Entity {
    constructor() {
        super();
        this.attr("complexEntity").char();
        this.attr("simpleEntity").char();
    }
}

ComplexEntities2SimpleEntities.classId = "ComplexEntities2SimpleEntities";

class ComplexEntity extends Entity {
    constructor() {
        super();
        this.attr("firstName").char();
        this.attr("lastName").char();
        this.attr("verification").model(VerificationModel);
        this.attr("tags").models(TagModel);
        this.attr("simpleEntity").entity(SimpleEntity);
        this.attr("simpleEntities").entities(SimpleEntity);
        this.attr("simpleEntitiesLoadedFromTable")
            .entities(SimpleEntity)
            .setAutoSave(false);
    }
}

ComplexEntity.classId = "ComplexEntity";

export { VerificationModel, TagModel, ComplexEntity, SimpleEntity, ComplexEntities2SimpleEntities };
