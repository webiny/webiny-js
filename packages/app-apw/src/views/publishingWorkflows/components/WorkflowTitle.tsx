import React, { useState, useCallback, SyntheticEvent } from "react";
import { Input } from "@webiny/ui/Input";
import { Tooltip } from "@webiny/ui/Tooltip";
import styled from "@emotion/styled";
import { css } from "emotion";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Box } from "~/components/Layout";

declare global {
    interface Window {
        Cypress: any;
    }
}

export const TitleInputWrapper = styled("div")({
    width: "100%",
    display: "flex",
    alignItems: "center",
    position: "relative",
    "> .mdc-text-field--upgraded": {
        height: 35,
        marginTop: "0 !important",
        paddingLeft: 10,
        paddingRight: 40
    }
});

export const TitleWrapper = styled(Box)({
    color: "var(--mdc-theme-text-primary-on-background)",
    position: "relative"
});

export const PageTitle = styled("div")({
    border: "1px solid transparent",
    fontSize: 20,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%",
    lineHeight: "120%",
    "&:hover": {
        border: "1px solid var(--mdc-theme-on-background)"
    }
});

export const pageTitleWrapper = css({
    maxWidth: "calc(100% - 50px)"
});

const Title: React.FunctionComponent<{ value: string; onChange: Function }> = ({
    value,
    onChange
}) => {
    const [editTitle, setEdit] = useState<boolean>(false);
    const [stateTitle, setTitle] = useState<string | null>(null);
    let title = stateTitle === null ? value : stateTitle;

    const enableEdit = useCallback(() => setEdit(true), []);

    const onBlur = useCallback(() => {
        if (title === "") {
            title = "Untitled";
            setTitle(title);
        }
        setEdit(false);
        onChange(title);
    }, [title]);

    const onKeyDown = useCallback(
        (e: SyntheticEvent) => {
            // @ts-ignore
            switch (e.key) {
                case "Escape":
                    e.preventDefault();
                    setEdit(false);
                    onChange(value);
                    break;
                case "Enter":
                    if (title === "") {
                        title = "Untitled";
                        setTitle(title);
                    }

                    e.preventDefault();
                    setEdit(false);

                    onChange(title);
                    break;
                default:
                    return;
            }
        },
        [title]
    );

    // Disable autoFocus because for some reason, blur event would automatically be triggered when clicking
    // on the page title when doing Cypress testing. Not sure if this is RMWC or Cypress related issue.
    const autoFocus = !window.Cypress;

    return editTitle ? (
        <TitleInputWrapper>
            <Input
                autoFocus={autoFocus}
                fullwidth
                value={title}
                onChange={setTitle}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
            />
        </TitleInputWrapper>
    ) : (
        <TitleWrapper width={"100%"}>
            <Tooltip
                className={pageTitleWrapper}
                placement={"bottom"}
                content={<span>Rename</span>}
            >
                <PageTitle data-testid="apw-workflow-title" onClick={enableEdit}>
                    {title}
                </PageTitle>
            </Tooltip>
        </TitleWrapper>
    );
};

export default React.memo(Title);

const header = css({
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    color: "var(--mdc-theme-text-primary-on-background)"
});

const title = css({
    display: "flex",
    alignItems: "center"
});

export const WorkflowFormHeader = (props: { Title: React.ReactElement }) => {
    return (
        <Grid className={header}>
            <Cell span={12} className={title}>
                {props.Title}
            </Cell>
        </Grid>
    );
};
