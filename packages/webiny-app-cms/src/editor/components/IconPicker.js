// @flow
import * as React from "react";
import { getPlugins } from "webiny-app/plugins";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { Typography } from "webiny-ui/Typography";

const renderItem = item => {
    return (
        <React.Fragment>
            <span dangerouslySetInnerHTML={{ __html: item.svg }} />{" "}
            <Typography use={"body2"}>{item.name}</Typography>
        </React.Fragment>
    );
};

let icons = null;

const IconPicker = (props: Object) => {
    if (!icons) {
        icons = getPlugins("cms-icons").reduce((icons: Array<Object>, pl: Object) => {
            return icons.concat(pl.getIcons());
        }, []);
    }
    return <AutoComplete options={icons} {...props} renderItem={renderItem} />;
};

export default IconPicker;
