// @flow
import Identity from "./Identity.entity";
import { api } from "./..";

class ApiToken extends Identity {
    name: string;
    description: string;
    token: string;
    constructor() {
        super();
        this.attr("name").char();
        this.attr("description").char();
        this.attr("token")
            .char()
            .setValidators();
    }

    async activate(): Promise<ApiToken> {
        // 2147483647 = maximum value of unix timestamp (year 2038).
        this.token = await api.services.get("security").createToken(this, 2147483647);
        return this;
    }
}

ApiToken.classId = "SecurityApiToken";
ApiToken.storageClassId = "Security_ApiTokens";

export default ApiToken;
