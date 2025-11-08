export const isJwt = (token: string) => token.split(".").length === 3;
