import React from "react";
import { AddPreviewPane } from "./admin/AddPreviewPane";
import { LivePreviewEditor } from "./admin/LivePreviewEditor";

export default function Admin() {
    return (
        <>
            <AddPreviewPane />
            <LivePreviewEditor />
        </>
    );
}
