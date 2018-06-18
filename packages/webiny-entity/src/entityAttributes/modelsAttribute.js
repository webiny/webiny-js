// @flow
import { ModelsAttribute as BaseModelsAttribute } from "webiny-model";
import EntityModel from "./../EntityModel";

class ModelsAttribute extends BaseModelsAttribute {
    getModelInstance() {
        const parentModel = ((this.getParentModel(): any): EntityModel);
        const parentEntity = parentModel.getParentEntity();

        const modelClass = ((this.getModelClass(): any): Class<EntityModel>);
        return new modelClass({ parentEntity });
    }
}

export default ModelsAttribute;
