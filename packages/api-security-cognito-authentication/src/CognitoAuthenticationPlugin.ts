import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import fetch from "node-fetch";
import util from "util";
import { SecurityIdentity } from "@webiny/api-security";
import { HttpContext } from "@webiny/handler-http/types";
import { Context as HandlerContext } from "@webiny/handler/types";
import { AuthenticationPlugin } from "@webiny/api-security/plugins/AuthenticationPlugin";
const verify = util.promisify<string, string, Record<string, any>>(jwt.verify);

// All JWTs are split into 3 parts by two periods
const isJwt = token => token.split(".").length === 3;

type Context = HandlerContext<HttpContext>;

export interface Config {
    region: string;
    userPoolId: string;
    identityType: string;
    getIdentity?(
        params: { identityType: string; token: { [key: string]: any } },
        context: Context
    ): SecurityIdentity;
}

const jwksCache = new Map<string, Record<string, any>[]>();

export class CognitoAuthenticationPlugin extends AuthenticationPlugin {
    private _config: Config;

    constructor(config: Config) {
        super();
        this._config = config;
    }

    async authenticate(context: Context): Promise<SecurityIdentity | undefined> {
        const { method: httpMethod, headers = {} } = context.http.request;
        let idToken = headers["Authorization"] || headers["authorization"] || "";

        if (!idToken) {
            return;
        }

        idToken = idToken.replace(/bearer\s/i, "");

        if (isJwt(idToken) && httpMethod === "POST") {
            const jwks = await this.getJWKs();
            const { header } = jwt.decode(idToken, { complete: true });
            const jwk = jwks.find(key => key.kid === header.kid);

            if (!jwk) {
                return;
            }

            const token = await verify(idToken, jwkToPem(jwk));
            if (token.token_use !== "id") {
                const error = new Error("idToken is invalid!");
                throw Object.assign(error, {
                    code: "SECURITY_COGNITO_INVALID_TOKEN"
                });
            }

            if (typeof this._config.getIdentity === "function") {
                return this._config.getIdentity(
                    { identityType: this._config.identityType, token },
                    context
                );
            }

            return new SecurityIdentity({
                id: token.email,
                type: this._config.identityType,
                displayName: `${token.given_name} ${token.family_name}`,
                firstName: token.given_name,
                lastName: token.family_name
            });
        }
    }

    private getJWKsURL() {
        const { region, userPoolId } = this._config;
        return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    }

    private async getJWKs() {
        const { region, userPoolId } = this._config;
        const key = `${region}:${userPoolId}`;

        if (!jwksCache.has(key)) {
            const response = await fetch(this.getJWKsURL()).then(res => res.json());
            jwksCache.set(key, response.keys);
        }

        return jwksCache.get(key);
    }
}
