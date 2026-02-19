import icons from "./icons.js";
import contentFormTransformers from "./transformers/index.js";
import defaultBar from "./editor/defaultBar/index.js";
import formSettings from "./editor/formSettings/index.js";
import getObjectId from "./getObjectId.js";

export default () => [icons, contentFormTransformers(), defaultBar, formSettings, getObjectId];
