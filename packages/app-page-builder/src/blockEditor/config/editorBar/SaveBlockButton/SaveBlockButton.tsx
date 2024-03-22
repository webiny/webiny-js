import React, { useCallback, useState } from "react";
import styled from "@emotion/styled";
import { useLocation, useNavigate } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { useBlock } from "~/blockEditor/hooks/useBlock";
import { SaveBlockActionEvent } from "~/blockEditor/config/eventActions/saveBlock/event";
import { useDisplayMode } from "~/editor/hooks/useDisplayMode";
import { DisplayMode } from "~/types";
import { usePageBlocks } from "~/admin/contexts/AdminPageBuilder/PageBlocks/usePageBlocks";
import { UpdatePageBlockInput } from "~/admin/contexts/AdminPageBuilder/PageBlocks/BlockGatewayInterface";

const SpinnerWrapper = styled.div`
    position: relative;
    width: 18px !important;
    margin-left: -4px !important;
`;

export const SaveBlockButton = () => {
    const [block] = useBlock();
    const eventActionHandler = useEventActionHandler();
    const { key } = useLocation();
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const { setDisplayMode } = useDisplayMode();
    const { updateBlock } = usePageBlocks();

    const saveChanges = useCallback(() => {
        setLoading(true);
        setDisplayMode(DisplayMode.DESKTOP);
        setTimeout(() => {
            eventActionHandler.trigger(
                new SaveBlockActionEvent({
                    execute({ blockCategory, ...data }: UpdatePageBlockInput) {
                        return updateBlock({
                            ...data,
                            category: blockCategory
                        });
                    },
                    debounce: false,
                    onFinish: () => {
                        setLoading(false);
                        // If location.key is "default", then we are in a new tab.
                        if (key === "default") {
                            navigate(`/page-builder/page-blocks?category=${block.blockCategory}`);
                        } else {
                            navigate(-1);
                        }
                        showSnackbar(`Block "${block.name}" saved successfully!`);
                    }
                })
            );
        }, 200);
    }, [block.name]);

    return (
        <ButtonPrimary
            onClick={saveChanges}
            disabled={loading}
            data-testid={"pb-blocks-editor-save-changes-btn"}
        >
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
