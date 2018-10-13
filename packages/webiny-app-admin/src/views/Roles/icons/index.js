// @flow
import * as React from "react";
import { IconButton } from "webiny-ui/Button";

import { ReactComponent as ExportSvg } from "./round-cloud_upload-24px.svg";
import { ReactComponent as ImportSvg } from "./round-cloud_download-24px.svg";

export const ExportIcon = (props: Object = {}) => {
    return <IconButton icon={<ExportSvg />} {...props} />;
};

export const ImportIcon = (props: Object = {}) => {
    return <IconButton icon={<ImportSvg />} {...props} />;
};
