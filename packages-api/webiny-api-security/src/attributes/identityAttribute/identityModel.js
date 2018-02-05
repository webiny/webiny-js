// @flow
import { EntityModel } from "webiny-entity";

export default class IdentityModel extends EntityModel {
    constructor(params: ?(Function | Object)) {
        super(params);
        this.attr("classId")
            .char()
            .setValidators();
        this.attr("identity").entity(() => {
            return this.constructor.getIdentityClass(this.classId);
        });
    }

    /**
     * TODO: this has to return class from Authentication service.
     */
    static getIdentityClass(classId: string) {
        return classId;
        // return services.get("Authentication").getIdentityClass(classId);
    }
}
