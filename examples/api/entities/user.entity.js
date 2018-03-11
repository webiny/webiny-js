// @flow
import { Identity } from "webiny-api-security";

class User extends Identity {
    constructor() {
        super();

        this.attr("email")
            .char()
            .setValidators("required,email")
            .onSet(value => value.toLowerCase().trim());

        this.attr("password").password();
        this.attr("firstName").char();
        this.attr("lastName").char();
        this.attr("gravatar").dynamic(() => import("md5").then(md5 => md5(this.email)));
        this.attr("avatar")
            .image()
            .setTags(["user", "avatar"]);
        // this.attr("passwordRecoveryCode").char();
        this.attr("enabled")
            .boolean()
            .setDefaultValue(true);
        // TODO: 2FactorAuth
    }
}

User.classId = "User";
User.tableName = "Users";

export default User;
