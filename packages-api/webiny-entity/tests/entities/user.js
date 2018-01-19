import Entity from './../../src/entity'

class User extends Entity {
    constructor() {
        super();
        this.attr('firstName').char();
        this.attr('lastName').char();
        this.attr('age').integer();
        this.attr('enabled').boolean();
        this.attr('totalSomething').dynamic(() => 555);
    }
}

User.classId = 'User';

export default User;