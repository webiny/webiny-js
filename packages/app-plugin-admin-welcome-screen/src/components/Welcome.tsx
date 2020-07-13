import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { Link } from "@webiny/react-router";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormContent,
    SimpleFormFooter
} from "@webiny/app-admin/components/SimpleForm";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";
import { getPlugins } from "@webiny/plugins";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Elevation } from "@webiny/ui/Elevation";

import GithubIcon from "../icons/github-logo.svg";
import SlackIcon from "../icons/slack-logo.svg";
import MediumIcon from "../icons/medium-logo.svg";
import TwitterIcon from "../icons/twitter-logo.svg";
import TextbookIcon from "../icons/textbook.svg";
import LaptopIcon from "../icons/laptop.svg";
import { AdminWelcomeScreenWidgetPlugin } from "../types";
import { SecureView } from "@webiny/app-security/components";

import { hasScopes } from "@webiny/app-security"; 

const linkStyle = css({
    textDecoration: "none",
    "&:hover": {
        textDecoration: "none"
    },
    color: "var(--mdc-theme-text-primary-on-background)"
});

const imageStyle = css({
    width: "30px",
    height: "30px",
    marginBottom: "5px"
});

const communityStyle = css({
    textAlign: "left"
});

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

const iconTextStyle = css({
    textAlign: "center"
});

const pFormContentStyle = css({
    fontWeight: 600
});

const pGetStartedStyle = css({
    paddingLeft: "1.5rem",
    paddingTop: "1.5rem"
});

const footerContainerStyle = css({
    display: "flex",
    padding: "1rem"
});

const widgetButtonStyle = css({
    textAlign: "center"
});

const footerTextStyle = css({
    backgroundColor: "var(--mdc-theme-on-background)",
    margin: "1rem"
});

const footerLinkTextStyle = css({
    fontWeight: 600,
    paddingLeft: "1rem"
});

const ContentTheme = styled("div")({
    color: "var(--mdc-theme-text-primary-on-background)"
});

const Widget = styled("div")({
    marginLeft: "1.5rem",
    marginRight: "1.5rem",
    marginBottom: "2rem"
});

const WelcomeScreenWidgetsWrapper = styled("div")({
    display: "flex",
    "@media (max-width: 479px)": {
        flexDirection: "column"
    }
});

const cellClass = css({
    "@media (max-width: 479px)": {
        "& .webiny-data-list": {
            margin: "0"
        }
    }
});

const Welcome = () => {
    const security = useSecurity();

    if (!security || !security.user) {
        return null;
    }

    const { fullName } = security.user;

    const canSeeAnyWidget = getPlugins<AdminWelcomeScreenWidgetPlugin>(
        "admin-welcome-screen-widget"
    ).some(pl => hasScopes(pl.scopes, { forceBoolean: true }));

    return (
        <Grid>
            <Cell span={12} className={cellClass}>
                <SimpleForm>
                    <SimpleFormHeader title={`Hi ${fullName.split(" ")[0]}!`} />
                    <SimpleFormContent>
                        <ContentTheme>
                            <Cell span={12}>
                                <Typography use={"headline6"}>
                                    {canSeeAnyWidget && 
                                        <p className={pGetStartedStyle}>
                                            To get started - pick one of the actions below:
                                        </p>
                                    }
                                    {!canSeeAnyWidget && 
                                        <p className={pGetStartedStyle}>
                                            Please contact administrator for permission to use the site's actions.
                                        </p>
                                    }
                                    <br />
                                </Typography>
                            </Cell>
                            <WelcomeScreenWidgetsWrapper>
                                {getPlugins<AdminWelcomeScreenWidgetPlugin>(
                                    "admin-welcome-screen-widget"
                                ).map(pl => {
                                    return (
                                        <SecureView scopes={pl.scopes}>
                                            <Widget key={pl.name}>
                                                <Elevation z={2} style={{ padding: 10 }}>
                                                    <Typography use={"headline6"}>
                                                        <p className={widgetTitleStyle}>
                                                            {pl.widget.title}
                                                        </p>
                                                    </Typography>
                                                    <Typography use={"body1"}>
                                                        <p className={widgetDescriptionStyle}>
                                                            {pl.widget.description}
                                                        </p>
                                                    </Typography>
                                                    <div className={widgetButtonStyle}>
                                                        {pl.widget.cta}
                                                    </div>
                                                </Elevation>
                                            </Widget>
                                        </SecureView>
                                    );
                                })}
                            </WelcomeScreenWidgetsWrapper>
                        </ContentTheme>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <Grid>
                            <Cell span={8}>
                                <Typography use={"headline6"} className={communityStyle}>
                                    <p className={pFormContentStyle}>Learn more about Webiny:</p>
                                </Typography>
                            </Cell>
                            <Cell span={4} style={{ marginLeft: "1rem" }}>
                                <Typography use={"headline6"} className={communityStyle}>
                                    <p className={pFormContentStyle}>Join our community:</p>
                                </Typography>
                            </Cell>
                            <Cell span={8}>
                                <Typography use={"body1"} className={communityStyle}>
                                    <p>
                                        Explore the Webiny documentation, learn about the
                                        architecture and check out code examples and guides:
                                    </p>
                                </Typography>
                            </Cell>
                            <Cell span={4} style={{ marginLeft: "1rem" }}>
                                <Typography use={"body1"} className={communityStyle}>
                                    <p>
                                        Get to know Webiny team members, discuss new ideas and get
                                        help:
                                    </p>
                                </Typography>
                            </Cell>
                            <Cell
                                span={4}
                                className={footerTextStyle}
                                style={{ margin: "1rem 1rem 1rem 0rem" }}
                            >
                                <Link to="https://docs.webiny.com/" className={linkStyle}>
                                    <Typography use={"headline5"}>
                                        <div className={footerContainerStyle}>
                                            <img
                                                className={imageStyle}
                                                src={TextbookIcon}
                                                alt={""}
                                            />
                                            <p className={footerLinkTextStyle}>Documentation</p>
                                        </div>
                                    </Typography>
                                </Link>
                            </Cell>
                            <Cell
                                span={4}
                                className={footerTextStyle}
                                style={{ margin: "1rem 1rem 1rem 9px" }}
                            >
                                <Link
                                    to="https://github.com/webiny/webiny-examples"
                                    className={linkStyle}
                                >
                                    <Typography use={"headline5"}>
                                        <span className={footerContainerStyle}>
                                            <img className={imageStyle} src={LaptopIcon} alt={""} />
                                            <p className={footerLinkTextStyle}>Code examples</p>
                                        </span>
                                    </Typography>
                                </Link>
                            </Cell>
                            <Cell span={1} className={iconTextStyle} align="middle">
                                <Link
                                    to="https://github.com/webiny/webiny-js"
                                    className={linkStyle}
                                >
                                    <img
                                        className={imageStyle}
                                        src={GithubIcon}
                                        alt={"Github logo"}
                                    />
                                    <p>Github</p>
                                </Link>
                            </Cell>
                            <Cell span={1} className={iconTextStyle} align="middle">
                                <Link to="https://www.webiny.com/slack/" className={linkStyle}>
                                    <img
                                        className={imageStyle}
                                        src={SlackIcon}
                                        alt={"Slack logo"}
                                    />
                                    <p>Slack</p>
                                </Link>
                            </Cell>
                            <Cell span={1} className={iconTextStyle} align="middle">
                                <Link to="https://blog.webiny.com" className={linkStyle}>
                                    <img
                                        className={imageStyle}
                                        src={MediumIcon}
                                        alt={"Medium logo"}
                                    />
                                    <p>Medium</p>
                                </Link>
                            </Cell>
                            <Cell span={1} className={iconTextStyle} align="middle">
                                <Link to="https://twitter.com/WebinyPlatform" className={linkStyle}>
                                    <img
                                        className={imageStyle}
                                        src={TwitterIcon}
                                        alt={"Twitter logo"}
                                    />
                                    <p>Twitter</p>
                                </Link>
                            </Cell>
                        </Grid>
                    </SimpleFormFooter>
                </SimpleForm>
            </Cell>
        </Grid>
    );
};

export default Welcome;
