// @flow
import bcrypt from "bcryptjs";
import { CharAttribute } from "webiny-model";
import { type EntityAttributesContainer } from "webiny-entity";

export default class PasswordAttribute extends CharAttribute {
    constructor(name: string, attributesContainer: EntityAttributesContainer) {
        super(name, attributesContainer);

        this.onSet(value => {
            if (value) {
                return bcrypt.hashSync(value, bcrypt.genSaltSync(10));
            }
            return this.value.getCurrent();
        });
    }
}
