// @flow
import addDays from "date-fns/add_days";
import jwt from "jsonwebtoken";
import type { Identity } from "./../index";
import type { IToken } from "../../types";
import AuthenticationError from "../services/authenticationError";

declare type JwtTokenConfig = {
    secret: string,
    expiresOn?: (identity: Identity) => number,
    data?: (identity: Identity) => Object
};

class JwtToken implements IToken {
    config: Object;

    constructor(config: JwtTokenConfig) {
        this.config = config;
    }

    expiresOn(identity: Identity): Promise<number> {
        if (typeof this.config.expiresOn === "function") {
            return this.config.expiresOn(identity);
        }

        // Seconds since epoch
        return Promise.resolve(Math.floor(addDays(new Date(), 30).getTime() / 1000));
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

    async encode(identity: Identity, expiresOn: ?number): Promise<string> {
        const token = jwt.sign(
            {
                data: await this.data(identity),
                exp: expiresOn || (await this.expiresOn(identity))
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
