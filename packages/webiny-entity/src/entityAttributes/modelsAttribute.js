// @flow
import { ModelsAttribute as BaseModelsAttribute } from "webiny-model";

class ModelsAttribute extends BaseModelsAttribute {
    getModelInstance() {
        const parentEntity = this.getParentModel().getParentEntity();
        const modelClass = this.getModelClass();
        return new modelClass({ parentEntity });
    }
}

export default ModelsAttribute;
