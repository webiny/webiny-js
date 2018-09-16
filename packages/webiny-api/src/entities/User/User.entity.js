// @flow
import md5 from "md5";
import Identity from "../Identity/Identity.entity";
import File from "../File/File.entity";

class User extends Identity {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    gravatar: string;
    avatar: {name: string, size: number, type: string, src: string};
    enabled: boolean;
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
        this.attr("fullName").char().setDynamic(() => {
            return `${this.firstName} ${this.lastName}`.trim()
        });

        this.attr("avatar").entity(File);

        this.attr("gravatar")
            .char()
            .setDynamic(() => "https://www.gravatar.com/avatar/" + md5(this.email));

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
