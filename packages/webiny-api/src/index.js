import Api from "./app";
const app = new Api();

export { app };

export { default as graphql } from "./graphql/middleware";
export { default as InvalidAttributesError } from "./graphql/utils/crud/InvalidAttributesError";
export { Entity, File, Image, Settings, SecuritySettings, Group, User, Identity } from "./entities";
export { default as MySQLTable } from "./mysql";

export { default as JwtToken } from "./security/tokens/jwtToken";
export { default as credentialsStrategy } from "./security/strategies/credentialsStrategy";
