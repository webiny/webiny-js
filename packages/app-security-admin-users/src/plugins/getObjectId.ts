import { ApolloCacheObjectIdPlugin, Object } from "@webiny/app/plugins/ApolloCacheObjectIdPlugin";

interface SecurityObject extends Object {
    slug: string;
    login: string;
}

export default new ApolloCacheObjectIdPlugin<SecurityObject>(obj => {
    switch (obj.__typename) {
        case "SecurityGroup":
            return obj.slug;
        case "SecurityUser":
            return obj.login;
        default:
            return undefined;
    }
});
