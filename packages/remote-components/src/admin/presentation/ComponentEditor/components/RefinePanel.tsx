import React, { useCallback, useEffect } from "react";
import { Button, Text } from "@webiny/admin-ui";
import { FormView, useFieldRenderers } from "@webiny/app-admin";
import { useWebsockets } from "@webiny/app-websockets";
import { ReactComponent as SparklesIcon } from "@webiny/icons/auto_awesome.svg";
import type { IComponentEditorPresenter } from "../abstractions.js";

const WS_ACTION_CONTENT = "remoteComponents.refineComponent.content";
const WS_ACTION_ERROR = "remoteComponents.refineComponent.error";

interface RefinePanelProps {
    presenter: IComponentEditorPresenter;
}

export const RefinePanel = ({ presenter }: RefinePanelProps) => {
    const websockets = useWebsockets();
    const renderers = useFieldRenderers();
    const { vm } = presenter;

    useEffect(() => {
        const contentSub = websockets.onMessage(WS_ACTION_CONTENT, (message: any) => {
            presenter.onRefineResult({
                source: message.data.source,
                css: message.data.css
            });
        });

        const errorSub = websockets.onMessage(WS_ACTION_ERROR, (message: any) => {
            presenter.onRefineError(message.data.message);
        });

        return () => {
            contentSub.off();
            errorSub.off();
        };
    }, [presenter, websockets]);

    const handleRefine = useCallback(() => {
        presenter.refine();
    }, [presenter]);

    return (
        <div className="flex flex-col gap-md p-md">
            <FormView name="RefineComponent" form={vm.refineForm} renderers={renderers} />
            <Text size="sm" className="text-neutral-strong">
                The AI sees the current JSX, CSS and input schema — describe only the change.
            </Text>
            <Button
                variant="primary"
                icon={<SparklesIcon />}
                text={vm.refining ? "Generating..." : "Generate"}
                onClick={handleRefine}
                disabled={vm.refining}
            />
        </div>
    );
};
