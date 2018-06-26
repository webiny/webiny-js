// @flow
import { ModelAttribute as BaseModelAttribute } from "webiny-model";
import { EntityModel } from "../index";

class ModelAttribute extends BaseModelAttribute {
    getModelInstance() {
        const parentModel = ((this.getParentModel(): any): EntityModel);
        const parentEntity = parentModel.getParentEntity();
        const modelClass = ((this.getModelClass(): any): Class<EntityModel>);
        return new modelClass({ parentEntity });
    }
}

export default ModelAttribute;
