// @flowIgnore
export const ActionTypes = {
    UNDO: "@@redux-undo/UNDO",
    REDO: "@@redux-undo/REDO",
    JUMP_TO_FUTURE: "@@redux-undo/JUMP_TO_FUTURE",
    JUMP_TO_PAST: "@@redux-undo/JUMP_TO_PAST",
    JUMP: "@@redux-undo/JUMP",
    CLEAR_HISTORY: "@@redux-undo/CLEAR_HISTORY"
};

export const ActionCreators = {
    undo() {
        return { type: ActionTypes.UNDO };
    },
    redo() {
        return { type: ActionTypes.REDO };
    },
    jumpToFuture(index) {
        return { type: ActionTypes.JUMP_TO_FUTURE, index };
    },
    jumpToPast(index) {
        return { type: ActionTypes.JUMP_TO_PAST, index };
    },
    jump(index) {
        return { type: ActionTypes.JUMP, index };
    },
    clearHistory() {
        return { type: ActionTypes.CLEAR_HISTORY };
    }
};
