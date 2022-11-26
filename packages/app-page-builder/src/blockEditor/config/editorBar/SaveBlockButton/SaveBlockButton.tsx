import React, { useCallback, useState } from "react";
import styled from "@emotion/styled";
import { createComponentPlugin, makeComposable } from "@webiny/app-admin";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useRouter } from "@webiny/react-router";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { EditorBar } from "~/editor";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { useBlock } from "~/blockEditor/hooks/useBlock";
import { SaveBlockActionEvent } from "~/blockEditor/config/eventActions/saveBlock/event";

const LoadingWrapper = styled("div")({
    position: "absolute",
    width: "100vw",
    height: "100vh",
    top: 0,
    right: 0,
    color: "var(--mdc-theme-text-primary-on-background)"
});

const DefaultSaveBlockButton: React.FC = () => {
    const [block] = useBlock();
    const eventActionHandler = useEventActionHandler();
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);

    const saveChanges = useCallback(() => {
        setLoading(true);
        eventActionHandler.trigger(
            new SaveBlockActionEvent({
                debounce: false,
                onFinish: () => {
                    setLoading(false);
                    history.push(`/page-builder/page-blocks`);
                    showSnackbar(`Block "${block.name}" saved successfully!`);
                }
            })
        );
    }, [block.name]);

    return (
        <>
            {loading && (
                <LoadingWrapper>
                    <CircularProgress label={"Saving block..."} />
                </LoadingWrapper>
            )}
            <ButtonPrimary onClick={saveChanges}>Save Changes</ButtonPrimary>
        </>
    );
};

export const SaveBlockButton = makeComposable("SaveBlockButton", DefaultSaveBlockButton);

export const SaveBlockButtonPlugin = createComponentPlugin(EditorBar.RightSection, RightSection => {
    return function AddSaveBlockButton(props) {
        return (
            <RightSection>
                <SaveBlockButton />
                {props.children}
            </RightSection>
        );
    };
});
