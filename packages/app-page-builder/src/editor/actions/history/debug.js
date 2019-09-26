// @flowIgnore
/* eslint-disable */
let __DEBUG__;
let displayBuffer;

const colors = {
    prevState: "#9E9E9E",
    action: "#03A9F4",
    nextState: "#4CAF50"
};

/* istanbul ignore next: debug messaging is not tested */
function initBuffer() {
    displayBuffer = {
        header: [],
        prev: [],
        action: [],
        next: [],
        msgs: []
    };
}

/* istanbul ignore next: debug messaging is not tested */
function printBuffer() {
    let { header, prev, next, action, msgs } = displayBuffer;
    if (console.group) {
        console.groupCollapsed(...header);
        console.log(...prev);
        console.log(...action);
        console.log(...next);
        console.log(...msgs);
        console.groupEnd();
    } else {
        console.log(...header);
        console.log(...prev);
        console.log(...action);
        console.log(...next);
        console.log(...msgs);
    }
}

/* istanbul ignore next: debug messaging is not tested */
function colorFormat(text, color, obj) {
    return [`%c${text}`, `color: ${color}; font-weight: bold`, obj];
}

/* istanbul ignore next: debug messaging is not tested */
function start(action, state) {
    initBuffer();
    if (__DEBUG__) {
        if (console.group) {
            displayBuffer.header = ["%credux-undo", "font-style: italic", "action", action.type];
            displayBuffer.action = colorFormat("action", colors.action, action);
            displayBuffer.prev = colorFormat("prev history", colors.prevState, state);
        } else {
            displayBuffer.header = ["redux-undo action", action.type];
            displayBuffer.action = ["action", action];
            displayBuffer.prev = ["prev history", state];
        }
    }
}

/* istanbul ignore next: debug messaging is not tested */
function end(nextState) {
    if (__DEBUG__) {
        if (console.group) {
            displayBuffer.next = colorFormat("next history", colors.nextState, nextState);
        } else {
            displayBuffer.next = ["next history", nextState];
        }
        printBuffer();
    }
}

/* istanbul ignore next: debug messaging is not tested */
function log(...args) {
    if (__DEBUG__) {
        displayBuffer.msgs = displayBuffer.msgs.concat([...args, "\n"]);
    }
}

/* istanbul ignore next: debug messaging is not tested */
function set(debug) {
    __DEBUG__ = debug;
}

export { set, start, end, log };
