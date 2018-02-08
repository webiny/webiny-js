import bcrypt from "bcryptjs";
import { CharAttribute } from "webiny-model";

export default () => {
    return class PasswordAttribute extends CharAttribute {
        constructor() {
            super();

            this.onSet(value => {
                if (value) {
                    return bcrypt.hashSync(value, bcrypt.genSaltSync(10));
                }
                return this.password;
            });
        }
    };
};
