// @flow
import { EntityModel } from "webiny-entity";
import MySQLAttributesContainer from "./mysqlAttributesContainer";

class MySQLModel extends EntityModel {
    createAttributesContainer(): MySQLAttributesContainer {
        return new MySQLAttributesContainer(this);
    }
}

export default MySQLModel;
