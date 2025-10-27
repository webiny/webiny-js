import React from "react";
import { useWorkflowState } from "../useWorkflowState.js";
import { observer } from "mobx-react-lite";
import type { IWorkflowState } from "~/types.js";

interface IWorkflowStateOverlayPropsChildrenProps {
    state: IWorkflowState | undefined;
}

interface IWorkflowStateOverlayPropsChildren {
    (props: IWorkflowStateOverlayPropsChildrenProps): React.ReactNode;
}

interface IWorkflowStateOverlayProps {
    children: React.ReactNode | IWorkflowStateOverlayPropsChildren;
}

interface IOverlayProps {
    children: React.ReactNode;
}
// TODO create overlay as a component in the Admin UI.
const Overlay = ({ children }: IOverlayProps) => {
    return (
        <div className={"wby-w-full wby-h-full wby-relative"}>
            <div
                className={
                    "wby-w-full wby-h-full wby-absolute wby-inset-0 wby-bg-neutral-base/80 wby-flex wby-items-center wby-justify-center wby-z-30"
                }
            />
            {children}
        </div>
    );
};

export const WorkflowStateOverlay = observer(({ children }: IWorkflowStateOverlayProps) => {
    const { presenter } = useWorkflowState();
    if (!presenter.vm.state) {
        if (typeof children === "function") {
            return children({ state: undefined });
        }
        return children;
    }
    if (typeof children === "function") {
        return <Overlay>{children({ state: presenter.vm.state })}</Overlay>;
    }
    return <Overlay>{children}</Overlay>;
});
