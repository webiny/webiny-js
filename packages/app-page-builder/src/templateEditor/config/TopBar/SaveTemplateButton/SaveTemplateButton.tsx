import React, { useCallback, useState } from "react";
import styled from "@emotion/styled";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useRouter } from "@webiny/react-router";
import { ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { useTemplate } from "~/templateEditor/hooks/useTemplate";
import { SaveTemplateActionEvent } from "~/templateEditor/config/eventActions/saveTemplate/event";

const SpinnerWrapper = styled.div`
    position: relative;
    width: 18px !important;
    margin-left: -4px !important;
`;

export const SaveTemplateButton = () => {
    const [template] = useTemplate();
    const eventActionHandler = useEventActionHandler();
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);

    const saveChanges = useCallback(() => {
        setLoading(true);
        eventActionHandler.trigger(
            new SaveTemplateActionEvent({
                debounce: false,
                onFinish: () => {
                    setLoading(false);
                    history.push(`/page-builder/page-templates`);
                    showSnackbar(`Template "${template.title}" saved successfully!`);
                }
            })
        );
    }, [template.title]);

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
