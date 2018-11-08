// @flow
import youtube from "./youtube";
import vimeo from "./vimeo";
import soundcloud from "./soundcloud";

export default [...youtube(), ...vimeo(), ...soundcloud()];
