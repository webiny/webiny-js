// @flow
import { EntityEndpoint } from "webiny-api";
import { Category } from "./../";

class Categories extends EntityEndpoint {
    getEntityClass() {
        return Category;
    }
}

Categories.classId = "Cms.Categories";
Categories.version = "1.0.0";

export default Categories;
