// @flow
import { EntityEndpoint } from "webiny-api";
import { Page } from "./../";

class Pages extends EntityEndpoint {
    getEntityClass() {
        return Page;
    }
}

Pages.classId = "Cms.Pages";
Pages.version = "1.0.0";

export default Pages;
