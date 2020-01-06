// @flow
import elements from "./../plugins/elements";
import slate from "./../plugins/slate";
import pageSettings from "./../plugins/pageSettings";
import elementSettings from "./../plugins/elementSettings";

export default [...elements, ...slate, ...pageSettings, ...elementSettings];
