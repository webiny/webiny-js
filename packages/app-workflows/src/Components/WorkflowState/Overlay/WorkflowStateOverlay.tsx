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
        <div className={"w-full h-full relative"}>
            <div
                className={
                    "w-full h-full absolute inset-0 bg-neutral-base/80 flex items-center justify-center z-30"
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
