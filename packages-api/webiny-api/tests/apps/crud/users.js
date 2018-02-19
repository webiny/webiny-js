import { EntityEndpoint } from "webiny-api";
import User from "./entities/user";

class Users extends EntityEndpoint {
    getEntityClass() {
        return User;
    }
}

Users.version = "1.0.0";
Users.classId = "Crud.Users";
export default Users;
