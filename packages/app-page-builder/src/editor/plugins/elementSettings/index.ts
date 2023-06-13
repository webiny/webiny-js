import advanced from "./advanced";
import animation from "./animation";
import deleteElement from "./delete";
import clone from "./clone";
import background from "./background";
import border from "./border";
import shadow from "./shadow";
import padding from "./padding";
import margin from "./margin";
import mirrorCell from "./mirror-cell";
import width from "./width";
import height from "./height";
import align from "./align";
import save from "./save";
import link from "./link";
import action from "./action";
import grid from "./grid";
import cell from "./cell";

export default [
    advanced,
    animation,
    background,
    border,
    shadow,
    padding,
    margin,
    mirrorCell,
    ...align,
    clone,
    deleteElement,
    width,
    height,
    save,
    link,
    action,
    grid,
    cell
];
