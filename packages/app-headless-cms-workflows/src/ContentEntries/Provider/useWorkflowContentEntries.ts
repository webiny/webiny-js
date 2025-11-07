import { ContentEntriesProviderContext } from "./WorkflowContentEntriesProvider.js";
import React from "react";

export const useWorkflowContentEntries = () => {
    const context = React.useContext(ContentEntriesProviderContext);
    if (context) {
        return context;
    }
    throw new Error("useWorkflowContentEntries must be used within a ContentEntriesProvider");
};
