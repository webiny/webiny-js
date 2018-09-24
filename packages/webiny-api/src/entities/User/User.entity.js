// @flow
import md5 from "md5";
import Identity from "../Identity/Identity.entity";
import File from "../File/File.entity";

class UserAvatar extends File {}
UserAvatar.classId = "SecurityUserAvatar";

class User extends Identity {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    gravatar: string;
    avatar: Promise<File>;
    enabled: boolean;
    constructor() {
        super();
        this.attr("email")
            .char()
            .setValidators("required,email")
            .onSet(value => {
                if (value !== this.email) {
                    this.on("beforeSave", async () => {
                        const existingUser = await User.findOne({ query: { email: value } });
                        if (existingUser) {
                            throw Error("User with given e-mail already exists.");
                        }
                    }).setOnce();
                }

                return value.toLowerCase().trim();
            });

        this.attr("password")
            .password()
            .setValidators("required");
        this.attr("firstName").char();
        this.attr("lastName").char();
        this.attr("fullName")
            .char()
            .setDynamic(() => {
                return `${this.firstName} ${this.lastName}`.trim();
            });

        this.attr("avatar")
            .entity(UserAvatar)
            .onSet(value => {
                if (value) {
                    this.on("afterSave", async () => {
                        // Let's make sure assigned avatar File is actually owned by this user.
                        const avatar = await this.avatar;
                        avatar.owner = this;
                        await avatar.save();
                    }).setOnce();
                }
                return value;
            });

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
