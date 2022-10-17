import React, { useCallback } from "react";
import { createComponentPlugin, makeComposable } from "@webiny/app-admin";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useRouter } from "@webiny/react-router";
import { ButtonPrimary } from "@webiny/ui/Button";
import { EditorBar } from "~/editor";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { useBlock } from "~/blockEditor/hooks/useBlock";
import { SaveBlockActionEvent } from "~/blockEditor/config/eventActions/saveBlock/event";

const DefaultSaveBlockButton: React.FC = () => {
    const [block] = useBlock();
    const eventActionHandler = useEventActionHandler();
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const saveChanges = useCallback(() => {
        eventActionHandler.trigger(
            new SaveBlockActionEvent({
                debounce: false,
                onFinish: () => {
                    history.push(`/page-builder/page-blocks`);
                    showSnackbar(`Block "${block.name}" saved successfully!`);
                }
            })
        );
    }, [block.name]);

    return <ButtonPrimary onClick={saveChanges}>Save Changes</ButtonPrimary>;
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
