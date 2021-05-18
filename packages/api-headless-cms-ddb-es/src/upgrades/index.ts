import upgrade500 from "./v5.0.0/index";
import upgrade570 from "./v5.7.0/index";

export default () => [upgrade500(), upgrade570()];
