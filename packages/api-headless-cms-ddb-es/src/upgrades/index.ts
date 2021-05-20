import upgrade500 from "./v5.0.0/index";
import upgrade580 from "./v5.8.0/index";

export default () => [upgrade500(), upgrade580()];
