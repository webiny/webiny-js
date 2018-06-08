// @flow
import Identity from "./identity.entity";
import md5 from "md5";

class ApiToken extends Identity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("description").char();
        this.attr("token")
            .char()
            .setValidators("required,maxLength:100")
            .setOnce();

        this.attr("enabled")
            .boolean()
            .setValue(true);
    }
}

ApiToken.on("beforeCreate", ({ entity }) => {
    entity.token = md5(new Date());
});

ApiToken.classId = "SecurityApiToken";
ApiToken.tableName = "Security_ApiTokens";

export default ApiToken;
