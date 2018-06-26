// @flow
import jwt from "jsonwebtoken";
import type { Identity } from "./../../entities";
import type { IToken } from "../../../types";
import AuthenticationError from "../../services/AuthenticationError";

type JwtTokenConfig = {
    secret: string,
    data?: (identity: Identity) => Object
};

class JwtToken implements IToken {
    config: Object;

    constructor(config: JwtTokenConfig) {
        this.config = config;
    }

    data(identity: Identity): Promise<Object> {
        if (typeof this.config.data === "function") {
            return this.config.data(identity);
        }

        // Data to encode into a token
        return Promise.resolve({
            identityId: identity.id,
            classId: identity.classId
        });
    }

    async encode(identity: Identity, expiresOn: number): Promise<string> {
        const token = jwt.sign(
            {
                data: await this.data(identity),
                exp: expiresOn
            },
            this.config.secret
        );

        return Promise.resolve(token);
    }

    decode(token: string): Promise<Object> {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.config.secret, (err, data) => {
                if (err) {
                    if (err.name === "TokenExpiredError") {
                        reject(
                            new AuthenticationError(err.message, AuthenticationError.TOKEN_EXPIRED)
                        );
                    } else {
                        reject(
                            new AuthenticationError(err.message, AuthenticationError.TOKEN_INVALID)
                        );
                    }
                    return;
                }

                resolve(data);
            });
        });
    }
}

export default JwtToken;
