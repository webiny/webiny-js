// @flow
import document from "./document";
import row from "./row";
import block from "./block";
import column from "./column";
import image from "./image";
import text from "./text";
import spacer from "./spacer";
import button from "./button";
import embeds from "./embeds";

export default [document(), row(), block(), column(), image(), text(), spacer(), button(), ...embeds];
