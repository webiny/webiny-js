import React, { useCallback, useState } from "react";
import styled from "@emotion/styled";
import { createComponentPlugin, makeComposable } from "@webiny/app-admin";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useRouter } from "@webiny/react-router";
import { ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { EditorBar } from "~/editor";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { useBlock } from "~/blockEditor/hooks/useBlock";
import { SaveBlockActionEvent } from "~/blockEditor/config/eventActions/saveBlock/event";

const SpinnerWrapper = styled.div`
    position: relative;
`;

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
        <ButtonPrimary onClick={saveChanges} disabled={loading}>
            {loading && (
                <ButtonIcon
                    icon={
                        <SpinnerWrapper>
                            <CircularProgress
                                size={20}
                                spinnerWidth={2}
                                style={{ background: "transparent" }}
                            />
                        </SpinnerWrapper>
                    }
                />
            )}
            Save Changes
        </ButtonPrimary>
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
