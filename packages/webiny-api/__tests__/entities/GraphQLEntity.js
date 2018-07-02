import { Entity } from "webiny-api/entities";
import { Model } from "webiny-model";

class ModelAttrModel extends Model {}
ModelAttrModel.classId = "ModelAttrModel";

class ModelsAttrModel extends Model {}
ModelsAttrModel.classId = "ModelsAttrModel";

class EntityAttrModel extends Model {}
EntityAttrModel.classId = "EntityAttrModel";

class EntitiesAttrModel extends Model {}
EntitiesAttrModel.classId = "EntitiesAttrModel";

class EntitiesAttrModeNonUsed extends Model {}
EntitiesAttrModeNonUsed.classId = "EntitiesAttrModeNonUsed";

export class GraphQLEntity extends Entity {
    constructor() {
        super();
        this.attr("char").char();
        this.attr("requiredChar")
            .char()
            .setValidators("required");
        this.attr("password").password();
        this.attr("boolean").boolean();
        this.attr("integer").integer();
        this.attr("float").float();
        this.attr("array").array();
        this.attr("buffer").buffer();
        this.attr("object").object();
        this.attr("date").date();

        this.attr("modelAttr").model(ModelAttrModel);
        this.attr("modelsAttr").models(ModelsAttrModel);

        this.attr("entityAttr").entity(EntityAttrModel);
        this.attr("entitiesAttr").entities(EntitiesAttrModel);
        this.attr("multipleEntitiesAttr").entity([
            EntityAttrModel,
            EntitiesAttrModel,
            EntitiesAttrModeNonUsed
        ]);
        this.attr("asteriskEntitiesAttr").entity([]);
    }
}

GraphQLEntity.classId = "GraphQLEntity";

export class GraphQLEntityWithSameModelEntityTypes extends Entity {
    constructor() {
        super();
        this.attr("modelAttr").model(ModelAttrModel);
        this.attr("modelsAttr").models(ModelsAttrModel);

        this.attr("entityAttr").entity(EntityAttrModel);
        this.attr("entitiesAttr").entities(EntitiesAttrModel);
    }
}

GraphQLEntityWithSameModelEntityTypes.classId = "GraphQLEntityWithSameModelEntityTypes";
