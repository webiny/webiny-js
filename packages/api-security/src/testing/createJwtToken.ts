import jwt from "jsonwebtoken";

export const JWT_TOKEN_SIGN_SECRET = "simple-string-for-testing";
export const JWT_TOKEN_EXPIRES_ON = 86400;
export const DEFAULT_IDENTITY_ID = "ab1dab1dab1dab1dab1dab1d";
export const DEFAULT_IDENTITY_EMAIL = "john@webiny.com";
export const DEFAULT_IDENTITY_DISPLAY_NAME = "John Doe";

type CreateJwtParams = {
    jwtTokenSignSecret?: string;
    jwwTokenExpiresOn?: number;
    id?: string;
    scopes?: string[];
    displayName?: string;
    email?: string;
};

export const createJwtToken = (params: CreateJwtParams = {}) => {
    const data = {
        data: {
            id: params.id || DEFAULT_IDENTITY_ID,
            email: params.email || DEFAULT_IDENTITY_EMAIL,
            displayName: params.displayName || DEFAULT_IDENTITY_DISPLAY_NAME,
            scopes: params.scopes || ["*"]
        },
        exp: new Date().getTime() + (params.jwwTokenExpiresOn || JWT_TOKEN_EXPIRES_ON)
    };
    const secret = params.jwtTokenSignSecret || JWT_TOKEN_SIGN_SECRET;

    return jwt.sign(data, secret);
};
