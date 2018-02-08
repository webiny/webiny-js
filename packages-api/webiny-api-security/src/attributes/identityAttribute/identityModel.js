// @flow
import { EntityModel } from "webiny-entity";
import type { IAuthentication } from "../../../types";

export default (authentication: IAuthentication) => {
    return class IdentityModel extends EntityModel {
        constructor(params: ?(Function | Object)) {
            super(params);
            this.attr("classId")
                .char()
                .setValidators();
            this.attr("identity").entity(() => {
                return this.constructor.getIdentityClass(this.classId);
            });
        }

        static getIdentityClass(classId: string) {
            return authentication.getIdentityClass(classId);
        }
    };
};
