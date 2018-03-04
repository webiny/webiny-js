// @flow
import { Identity } from "webiny-api-security";
import webiny from "webiny-api";

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
        // TODO
        const storage = webiny.serviceManager.get("MyStorage");
        this.attr("avatar")
            .file()
            .setTags("user", "avatar")
            .setStorage(storage);
        // this.attr("passwordRecoveryCode").char();
        this.attr("enabled")
            .boolean()
            .setDefaultValue(true);
        // this.attr("meta").object();
        // TODO: 2FactorAuth
    }
}

User.classId = "User";
User.tableName = "Users";

export default User;
