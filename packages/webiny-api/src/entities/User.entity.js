// @flow
import Identity from "./Identity.entity";

class User extends Identity {
    constructor() {
        super();
        this.attr("email")
            .char()
            .setValidators("required,email")
            .onSet(value => value.toLowerCase().trim());

        this.attr("password")
            .password()
            .setValidators("required");
        this.attr("firstName").char();
        this.attr("lastName").char();
        // this.attr("avatar").image();
        this.attr("gravatar")
            .char()
            .setDynamic(() => import("md5").then(md5 => md5(this.email)));

        this.attr("enabled")
            .boolean()
            .setValue(true);

        // TODO: 2FactorAuth
        // TODO: Password recovery
    }
}

User.classId = "SecurityUser";
User.storageClassId = "Security_Users";

export default User;
