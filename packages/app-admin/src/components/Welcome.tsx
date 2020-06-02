import React from "react";

import { Link } from "@webiny/react-router";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormContent,
    SimpleFormFooter
} from "@webiny/app-admin/components/SimpleForm";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Elevation } from "@webiny/ui/Elevation";
import GithubIcon from "../assets/icons/github-logo.svg";
import SlackIcon from "../assets/icons/slack-logo.svg";
import MediumIcon from "../assets/icons/medium-logo.svg";
import TwitterIcon from "../assets/icons/twitter-logo.svg";
import TextbookIcon from "../assets/icons/textbook.svg";
import LaptopIcon from "../assets/icons/laptop.svg";

import { useSecurity } from "@webiny/app-security/hooks/useSecurity";

import { css } from "emotion";
import styled from "@emotion/styled";
import { AdminWelcomeScreenWidgetPlugin } from "@webiny/app-admin/types";
import { getPlugins } from "@webiny/plugins";

const linkStyle = css({
    textDecoration: "none",
    "&:hover": {
        textDecoration: "none"
    },
    color: "var(--mdc-theme-text-primary-on-background)"
});

const imageStyle = css({
    width: "30px",
    height: "30px"
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
    textAlign: "center",
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

const Welcome = () => {
    const security = useSecurity();

    if (!security || !security.user) {
        return null;
    }

    const { fullName } = security.user;

    return (
        <Grid>
            <Cell span={12}>
                <SimpleForm>
                    <SimpleFormHeader title={`Hi ${fullName.split(" ")[0]}!`} />
                    <SimpleFormContent>
                        <ContentTheme>
                            <Cell span={12}>
                                <Typography use={"headline6"}>
                                    <p className={pGetStartedStyle}>
                                        To get started - pick one of the actions below:
                                    </p>
                                    <br></br>
                                </Typography>
                            </Cell>
                            <div style={{ display: "flex" }}>
                                {getPlugins<AdminWelcomeScreenWidgetPlugin>(
                                    "admin-welcome-screen-widget"
                                ).map(pl => {
                                    return (
                                        <Widget key={pl.name}>
                                            <Elevation z={2}>
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
                                    );
                                })}
                            </div>
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
                                            <img className={imageStyle} src={TextbookIcon} />
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
                                        <div className={footerContainerStyle}>
                                            <img className={imageStyle} src={LaptopIcon} />
                                            <p className={footerLinkTextStyle}>Code examples</p>
                                        </div>
                                    </Typography>
                                </Link>
                            </Cell>
                            <Cell span={1} className={iconTextStyle} align="middle">
                                <img className={imageStyle} src={GithubIcon} />
                                <Link
                                    to="https://github.com/webiny/webiny-js"
                                    className={linkStyle}
                                >
                                    <p>Github</p>
                                </Link>
                            </Cell>
                            <Cell span={1} className={iconTextStyle} align="middle">
                                <img className={imageStyle} src={SlackIcon} />
                                <Link to="https://www.webiny.com/slack/" className={linkStyle}>
                                    <p>Slack</p>
                                </Link>
                            </Cell>
                            <Cell span={1} className={iconTextStyle} align="middle">
                                <img className={imageStyle} src={MediumIcon} />
                                <Link to="https://blog.webiny.com" className={linkStyle}>
                                    <p>Medium</p>
                                </Link>
                            </Cell>
                            <Cell span={1} className={iconTextStyle} align="middle">
                                <img className={imageStyle} src={TwitterIcon} />
                                <Link to="https://twitter.com/WebinyPlatform" className={linkStyle}>
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
