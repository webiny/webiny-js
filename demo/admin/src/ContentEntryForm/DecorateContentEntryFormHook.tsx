import React, { useState } from "react";
import styled from "@emotion/styled";
import { ReactComponent as SuccessIcon } from "@material-design-icons/svg/round/check_circle.svg";
import { ReactComponent as ErrorIcon } from "@material-design-icons/svg/round/remove_circle.svg";
import { DialogTitle, DialogContent, DialogActions } from "@webiny/ui/Dialog";
import { CircularProgress } from "@webiny/ui/Progress";
import { useCustomDialog, useDialogs } from "@webiny/app-admin";
import { useContentEntryForm } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/useContentEntryForm";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { Checkbox } from "@webiny/ui/Checkbox";
import { Typography } from "@webiny/ui/Typography";
import { Bind, useForm } from "@webiny/form";
import { useFieldTracker } from "./FieldTracker";
import { extractRichTextLinks, FieldLink } from "./extractFromRichText";
import { usePingUrl } from "./usePingUrl";

const ValidIcon = styled(SuccessIcon)`
    fill: #42a442;
`;

const InvalidIcon = styled(ErrorIcon)`
    fill: #ff3b3b;
`;

const UrlWithLoader = styled.div`
    position: relative;
    background-color: #eaeaea;
    border: 1px solid #48475b;
    margin: 5px;
    padding: 5px 5px 5px 36px;
    border-radius: 5px;
`;

const SpinnerWrapper = styled.div`
    position: absolute;
    left: 5px;
    width: 26px !important;
    height: 26px;

    > div {
        background: transparent;
    }
`;

interface ValidateUrlProps {
    url: string;
    onInvalid: () => void;
}

const ValidateUrl = ({ url, onInvalid }: ValidateUrlProps) => {
    const [valid, setValid] = useState<boolean | null>(null);

    usePingUrl(url, isValid => {
        setValid(isValid);
        if (!isValid) {
            onInvalid();
        }
    });

    return (
        <UrlWithLoader>
            <SpinnerWrapper>
                {valid === null ? <CircularProgress size={20} spinnerWidth={2} /> : null}
                {valid === true ? <ValidIcon /> : null}
                {valid === false ? <InvalidIcon /> : null}
            </SpinnerWrapper>
            <span>{url}</span>
        </UrlWithLoader>
    );
};

interface UrlValidatorProps {
    links: FieldLink[];
    onInvalid: () => void;
}

const UrlValidator = ({ links, onInvalid }: UrlValidatorProps) => {
    return (
        <div>
            {links.map(field => {
                return (
                    <div key={field.label + "_" + field.path}>
                        <h5>
                            {field.label}&nbsp;
                            <Typography use={"overline"}>({field.path})</Typography>
                        </h5>

                        {field.links.map(url => (
                            <ValidateUrl key={url} url={url} onInvalid={onInvalid} />
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

interface ArticleValidationDialogProps {
    links: FieldLink[];
}

const ArticleValidationDialog = ({ links }: ArticleValidationDialogProps) => {
    const { loading, closeDialog, submit } = useCustomDialog();
    const form = useForm();
    const [isValid, setValid] = useState(true);

    return (
        <>
            {loading && <CircularProgress label={"Saving article..."} />}
            <DialogTitle>Article Validation</DialogTitle>
            <DialogContent>
                <UrlValidator links={links} onInvalid={() => setValid(false)} />
                {!isValid ? (
                    <Bind name={"approved"}>
                        <Checkbox
                            label={
                                "I have reviewed the report and agree to save the article even with validation issues."
                            }
                        />
                    </Bind>
                ) : null}
            </DialogContent>
            <DialogActions>
                <ButtonDefault onClick={closeDialog}>Cancel</ButtonDefault>
                <ButtonPrimary disabled={!isValid && !form.data.approved} onClick={submit}>
                    Save article
                </ButtonPrimary>
            </DialogActions>
        </>
    );
};

export const DecorateContentEntryFormHook = useContentEntryForm.createDecorator(baseHook => {
    return params => {
        const { fields } = useFieldTracker();
        const { showCustomDialog } = useDialogs();
        const hook = baseHook(params);

        const links = extractRichTextLinks(fields);
        const articleHasLinks = Object.values(links).flat().length > 0;

        return {
            ...hook,
            onSubmit: async (data, form) => {
                if (!articleHasLinks) {
                    return hook.onSubmit(data, form);
                }

                return new Promise(resolve => {
                    showCustomDialog({
                        element: <ArticleValidationDialog links={links} />,
                        onSubmit: () => {
                            return resolve(hook.onSubmit(data, form));
                        }
                    });
                });
            }
        };
    };
});
