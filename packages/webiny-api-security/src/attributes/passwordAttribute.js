import bcrypt from "bcryptjs";
import { CharAttribute } from "webiny-model";

export default () => {
    return class PasswordAttribute extends CharAttribute {
        constructor(name, attributesContainer) {
            super(name, attributesContainer);

            this.onSet(value => {
                if (value) {
                    return bcrypt.hashSync(value, bcrypt.genSaltSync(10));
                }
                return this.value.getCurrent();
            });
        }
    };
};
