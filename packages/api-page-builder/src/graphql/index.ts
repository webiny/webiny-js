import { createCrud } from "./crud";
import graphql from "./graphql";
import upgrades from "./upgrades";
import multiTenancy from "./multiTenancy";

export default () => [createCrud(), graphql, upgrades(), multiTenancy()];
