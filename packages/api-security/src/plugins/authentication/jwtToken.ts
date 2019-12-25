import jwt from "jsonwebtoken";

interface JwtTokenConfig {
    secret: string;
}

export class JwtTokenError extends Error {
    message: string;
    code: string;
    constructor(message: string, code: string) {
        super();
        this.message = message;
        this.code = code;
    }
}

export class JwtToken {
    config: Record<string, any>;

    constructor(config: JwtTokenConfig) {
        this.config = config;
    }

    async encode(data: { [key: string]: any }, expiresOn: number): Promise<string> {
        return jwt.sign({ data, exp: expiresOn }, this.config.secret);
    }

    decode(token: string): Promise<{ [key: string]: any }> {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.config.secret, (err, data) => {
                if (err) {
                    reject(
                        new JwtTokenError(
                            err.message,
                            err.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "TOKEN_INVALID"
                        )
                    );

                    return;
                }

                resolve(data);
            });
        });
    }
}
