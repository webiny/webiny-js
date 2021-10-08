import base from "./graphql/base.gql";
import install from "./graphql/install.gql";
import user from "./graphql/user.gql";
import group from "./graphql/group.gql";
import pat from "./graphql/pat.gql";
import apiKey from "./graphql/apiKey.gql";

export default () => [base, install, user, group, pat, apiKey];
