import crud from "./crud";
import graphql from "./graphql";
import upgrades from "./upgrades";

export default () => [crud, graphql, upgrades()];
