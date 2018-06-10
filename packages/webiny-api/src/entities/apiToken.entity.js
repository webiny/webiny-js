// @flow
import Identity from "./identity.entity";
import { app } from "./..";

class ApiToken extends Identity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("description").char();
        this.attr("token")
            .char()
            .setValidators();

        this.on("beforeUpdate", async () => {
            if (!this.token) {
                // 2147483647 = maximum value of unix timestamp (year 2038).
                this.token = await app.services.get("security").createToken(this, 2147483647);
            }
        });
    }
}

ApiToken.classId = "SecurityApiToken";
ApiToken.tableName = "Security_ApiTokens";

export default ApiToken;
