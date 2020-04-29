import * as React from "react";
import { PbPageDetailsPlugin } from "@webiny/app-page-builder/types";
import RevisionSelector from "./revisionSelector/RevisionSelector";

const plugins: PbPageDetailsPlugin[] = [
    {
        name: "cms-content-revision-selector",
        type: "cms-content-header",
        render(props) {
            return <RevisionSelector {...props} />;
        }
    }
];

export default plugins;
