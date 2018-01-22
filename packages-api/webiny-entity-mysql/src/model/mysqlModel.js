import { EntityModel } from "webiny-entity";
import AttributesContainer from "./mysqlAttributesContainer";

class MySQLModel extends EntityModel {
    createAttributesContainer() {
        return new AttributesContainer(this);
    }
}

export default MySQLModel;
