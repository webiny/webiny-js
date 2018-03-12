// @flow
import Identity from "./identity.entity";

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
        this.attr("enabled")
            .boolean()
            .setDefaultValue(true);
        // TODO: 2FactorAuth
        // TODO: Password recovery
    }
}

User.classId = "Security.User";
User.tableName = "Security_Users";

export default User;
