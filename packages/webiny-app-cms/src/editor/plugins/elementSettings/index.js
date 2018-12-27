// @flow
import animation from "./animation";
import bar from "./bar";
import deleteElement from "./delete";
import clone from "./clone";
import background from "./background";
import border from "./border";
import shadow from "./shadow";
import padding from "./padding";
import margin from "./margin";
import width from "./width";
import columnWidth from "./columnWidth";
import height from "./height";
import align from "./align";
import divider from "./divider";
import save from "./save";

export default [
    animation,
    bar,
    divider,
    background,
    border,
    shadow,
    padding,
    margin,
    ...align,
    clone,
    deleteElement,
    width,
    columnWidth,
    height,
    save
];
