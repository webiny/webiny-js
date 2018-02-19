import { Identity } from "../../lib";

class MyCompany extends Identity {
    constructor() {
        super();
        this.attr("companyId")
            .char()
            .setValidators("required");
        this.attr("password").password();
    }
}

MyCompany.classId = "MyCompany";
export default MyCompany;
