import { app, Entity } from 'webiny-api/src';

class User extends Entity {
    constructor() {
        super();
        this.attr('id').integer();
        this.attr('email').char();
        this.attr('password').char().onSet(value => {
            if (value) {
                return app.getAuth().hashPasswordSync(value);
            }
            return this.password;
        });
    }
}

User.classId = 'User';

export default User;