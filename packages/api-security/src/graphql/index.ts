import { featureFlags } from "@webiny/feature-flags";

import interfaces from "./interfaces.gql";
import base from "./base.gql";
import apiKey from "./apiKey.gql";
import group from "./group.gql";
import team from "./team.gql";
import install from "./install.gql";
import identity from "./identity.gql";

export default [
    interfaces,
    base,
    apiKey,
    install,
    group,
    featureFlags?.aacl?.teams && team,
    identity
].filter(Boolean);
