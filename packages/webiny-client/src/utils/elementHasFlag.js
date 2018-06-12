import React from "react";
import _ from "lodash";

export default (element, flag) => {
    if (React.isValidElement(element)) {
        return _.get(element.type, "options." + flag, false);
    }

    return false;
};
