import elements from "./../plugins/elements";
import pageSettings from "./../plugins/pageSettings";
import elementSettings from "./../plugins/elementSettings";

export default () => [...elements, ...pageSettings(), ...elementSettings];
