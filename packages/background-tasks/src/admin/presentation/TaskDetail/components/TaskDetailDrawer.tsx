import React from "react";

interface TaskDetailDrawerProps {
    task: any;
    open: boolean;
    onClose: () => void;
    onAbort: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export const TaskDetailDrawer = (_props: TaskDetailDrawerProps) => {
    return null;
};
