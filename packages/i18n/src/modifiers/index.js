// @flow

// Built-in modifiers
import countModifiers from "./countModifier";
import genderModifier from "./genderModifier";
import ifModifier from "./ifModifier";
import pluralModifier from "./pluralModifier";
import dateModifier from "./dateModifier";
import dateTimeModifier from "./dateTimeModifier";
import timeModifier from "./timeModifier";
import numberModifier from "./numberModifier";
import priceModifier from "./priceModifier";

export default [
    countModifiers,
    genderModifier,
    ifModifier,
    pluralModifier,
    dateModifier,
    dateTimeModifier,
    timeModifier,
    numberModifier,
    priceModifier
];
