import { PersonalAccessTokenAuthenticationPlugin } from "~/plugins/PersonalAccessTokenAuthenticationPlugin";

export default ({ identityType }) => {
    return new PersonalAccessTokenAuthenticationPlugin({ identityType });
};
