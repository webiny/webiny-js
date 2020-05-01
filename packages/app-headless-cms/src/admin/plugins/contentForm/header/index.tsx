import * as React from "react";
import RevisionSelector from "./revisionSelector/RevisionSelector";

const plugins: any[] = [
    {
        name: "cms-content-revision-selector",
        type: "cms-content-header",
        render(props) {
            return <RevisionSelector {...props} />;
        }
    }
];

export default plugins;
