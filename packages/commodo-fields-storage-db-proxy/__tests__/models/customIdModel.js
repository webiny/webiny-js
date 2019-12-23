import { Model } from "webiny-model";
import MongoDbDriver from "../..";
import { database } from "./../database";

class CustomIdModel extends Model {
    constructor() {
        super();
        this.attr("name").char();
    }
}

CustomIdModel.driver = new MongoDbDriver({
    database
});

export default CustomIdModel;
