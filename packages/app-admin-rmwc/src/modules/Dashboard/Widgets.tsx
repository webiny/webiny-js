import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import { Typography } from "@webiny/ui/Typography";
import { Cell } from "@webiny/ui/Grid";
import { Elevation } from "@webiny/ui/Elevation";
import { useDashboardConfig } from "@webiny/app-admin";
import { ButtonSecondary } from "@webiny/ui/Button";
import { Link } from "@webiny/react-router";

const widgetTitleStyle = css({
    fontWeight: 600,
    paddingTop: "1rem",
    paddingBottom: "1rem",
    textAlign: "center"
});

const widgetDescriptionStyle = css({
    textAlign: "center",
    paddingLeft: "20px",
    paddingRight: "20px"
});

const pGetStartedStyle = css({
    paddingLeft: "1.5rem",
    paddingTop: "1.5rem"
});

const widgetButtonStyle = css`
    text-align: center;
    margin-top: auto;
`;

const ContentTheme = styled("div")({
    color: "var(--mdc-theme-text-primary-on-background)"
});

const Widget = styled.div`
    margin-left: 1.5rem;
    margin-right: 1.5rem;
    margin-bottom: 2rem;
    flex: 1 1 21%;
    max-width: 25%;
    min-height: 250px;
`;

const WelcomeScreenWidgetsWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    @media (max-width: 479px) {
        flex-direction: column;
    }
`;

const elevation = css`
    padding: 10px;
    height: calc(100% - 20px);
    display: flex;
    flex-direction: column;
`;

const linkStyle = css`
    text-decoration: none;
    &:hover {
        text-decoration: none;
    }
    color: var(--mdc-theme-text-primary-on-background);
`;

const buttonStyle = css`
    margin: 1rem auto 1rem auto;
`;

const defaultTitle = "To get started - pick one of the actions below:";

export const Widgets = ({ title = defaultTitle }: { title?: string }) => {
    const { widgets } = useDashboardConfig();

    const canSeeAnyWidget = widgets.length > 0;

    return (
        <SimpleFormContent>
            <ContentTheme>
                <Cell span={12}>
                    <Typography use={"headline6"}>
                        {canSeeAnyWidget && <p className={pGetStartedStyle}>{title}</p>}
                        {!canSeeAnyWidget && (
                            <p className={pGetStartedStyle}>
                                Please contact the administrator for permissions to access Webiny
                                apps.
                            </p>
                        )}
                        <br />
                    </Typography>
                </Cell>
                <WelcomeScreenWidgetsWrapper>
                    {widgets.map(widget => {
                        return (
                            <Widget key={widget.name} data-testid={widget.name}>
                                <Elevation z={2} className={elevation}>
                                    <Typography use={"headline6"}>
                                        <p className={widgetTitleStyle}>{widget.label}</p>
                                    </Typography>
                                    <Typography use={"body1"}>
                                        <p className={widgetDescriptionStyle}>
                                            {widget.description}
                                        </p>
                                    </Typography>
                                    <div className={widgetButtonStyle}>
                                        {React.isValidElement(widget.cta) ? (
                                            widget.cta
                                        ) : (
                                            <Link to={widget.cta.path} className={linkStyle}>
                                                <ButtonSecondary className={buttonStyle}>
                                                    {widget.cta.label}
                                                </ButtonSecondary>
                                            </Link>
                                        )}
                                    </div>
                                </Elevation>
                            </Widget>
                        );
                    })}
                </WelcomeScreenWidgetsWrapper>
            </ContentTheme>
        </SimpleFormContent>
    );
};
