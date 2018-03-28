// @flow
import { EntityEndpoint } from "webiny-api";
import { User } from "./../";

class Users extends EntityEndpoint {
    getEntityClass() {
        return User;
    }
}

Users.classId = "Security.Users";
Users.version = "1.0.0";

export default Users;
