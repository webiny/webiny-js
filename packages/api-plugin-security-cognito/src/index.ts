import authentication from "./authentication";
import userManagement from "./userManagement";

export default options => [authentication(options), userManagement(options)];
