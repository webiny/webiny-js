import { Entity } from "./../../";

class User extends Entity {
    constructor() {
        super();
        this.attr("firstName").char();
        this.attr("lastName").char();
        this.attr("age").integer();
        this.attr("enabled").boolean();
        this.attr("totalSomething").dynamic(() => 555);
        this.attr("dynamicWithArgs").dynamic((a, b, c) => {
            return a + b + c;
        });
    }
}

User.classId = "User";

export default User;
