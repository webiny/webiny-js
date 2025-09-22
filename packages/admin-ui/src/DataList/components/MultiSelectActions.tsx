import type { DataListProps } from "../types.js";
import type { ReactElement } from "react";

/**
 * TODO Fix with React 19.
 */
const MultiSelectActions = (props: DataListProps): ReactElement | null => {
    const { multiSelectActions } = props;
    if (!multiSelectActions) {
        return null;
    }
    // @ts-expect-error
    return multiSelectActions;
};

export { MultiSelectActions };
