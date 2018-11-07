// @flow
import tweetEmbed from "./twitter";
import instagramEmbed from "./instagram";
export default [...tweetEmbed(), ...instagramEmbed()];
