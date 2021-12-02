import crud from "./crud";
import graphql from "./graphql";
import upgrades from "./upgrades";
import multiTenancy from "./multiTenancy";

export default () => [crud, graphql, upgrades(), multiTenancy()];
