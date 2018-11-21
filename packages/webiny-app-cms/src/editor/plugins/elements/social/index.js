// @flow
import tweetEmbed from "./twitter";
import instagramEmbed from "./instagram";
import pinterestEmbed from "./pinterest";
export default [...tweetEmbed(), ...instagramEmbed(), ...pinterestEmbed()];
