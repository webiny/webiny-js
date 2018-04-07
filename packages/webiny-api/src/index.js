import Api from "./app";
const app = new Api();

export { app };

export { default as graphql } from "./graphql/middleware";
export { Entity, File, Image } from "./entities";
export { default as MySQLTable } from "./tables/mySQL";
