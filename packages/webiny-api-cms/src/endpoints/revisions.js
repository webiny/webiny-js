// @flow
import { EntityEndpoint } from "webiny-api";
import { Revision } from "./../";

class Revisions extends EntityEndpoint {
    getEntityClass() {
        return Revision;
    }
}

Revisions.classId = "Cms.Revisions";
Revisions.version = "1.0.0";

export default Revisions;
