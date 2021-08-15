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
import { plugins } from "@webiny/plugins";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Elevation } from "@webiny/ui/Elevation";
// Icons
import { ReactComponent as YouTubeIcon } from "../icons/youtube.svg";
import { ReactComponent as GithubIcon } from "../icons/github.svg";
import { ReactComponent as SlackIcon } from "../icons/slack.svg";
import { ReactComponent as TwitterIcon } from "../icons/twitter.svg";
import { ReactComponent as TextbookIcon } from "../icons/textbook.svg";
import { ReactComponent as LaptopIcon } from "../icons/laptop.svg";
import { AdminWelcomeScreenWidgetPlugin } from "../types";

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
    justifyContent: "center",
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
    const { identity } = useSecurity();

    if (!identity) {
        return null;
    }

    const widgets = plugins
        .byType<AdminWelcomeScreenWidgetPlugin>("admin-welcome-screen-widget")
        .filter(pl => {
            if (pl.permission) {
                return identity.getPermission(pl.permission);
            }
            return true;
        });

    const canSeeAnyWidget = widgets.length > 0;

    return (
        <Grid>
            <Cell span={12} className={cellClass}>
                <SimpleForm>
                    <SimpleFormHeader title={`Hi ${identity.firstName}!`} />
                    <SimpleFormContent>
                        <ContentTheme>
                            <Cell span={12}>
                                <Typography use={"headline6"}>
                                    {canSeeAnyWidget && (
                                        <p className={pGetStartedStyle}>
                                            To get started - pick one of the actions below:
                                        </p>
                                    )}
                                    {!canSeeAnyWidget && (
                                        <p className={pGetStartedStyle}>
                                            Please contact the administrator for permissions to
                                            access Webiny apps.
                                        </p>
                                    )}
                                    <br />
                                </Typography>
                            </Cell>
                            <WelcomeScreenWidgetsWrapper>
                                {widgets.map(pl => {
                                    return (
                                        <Widget key={pl.name} data-testid={pl.name}>
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
                                <Link
                                    to="https://docs.webiny.com/"
                                    className={linkStyle}
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                >
                                    <Typography use={"headline5"}>
                                        <div className={footerContainerStyle}>
                                            <TextbookIcon className={imageStyle} />
                                            <p className={footerLinkTextStyle}>Documentation</p>
                                        </div>
                                    </Typography>
                                </Link>
                            </Cell>
                            <Cell
                                span={4}
                                className={footerTextStyle}
                                style={{ margin: "1rem 1rem 1rem 9px", visibility: "hidden" }}
                            >
                                <Link
                                    to="https://github.com/webiny/webiny-examples"
                                    className={linkStyle}
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                >
                                    <Typography use={"headline5"}>
                                        <span className={footerContainerStyle}>
                                            <LaptopIcon className={imageStyle} />
                                            <p className={footerLinkTextStyle}>Code examples</p>
                                        </span>
                                    </Typography>
                                </Link>
                            </Cell>
                            <Cell span={1} className={iconTextStyle} align="middle">
                                <Link
                                    to="https://github.com/webiny/webiny-js"
                                    className={linkStyle}
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                >
                                    <GithubIcon className={imageStyle} />
                                    <p>Github</p>
                                </Link>
                            </Cell>
                            <Cell span={1} className={iconTextStyle} align="middle">
                                <Link
                                    to="https://www.webiny.com/slack/"
                                    className={linkStyle}
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                >
                                    <SlackIcon className={imageStyle} />
                                    <p>Slack</p>
                                </Link>
                            </Cell>
                            <Cell span={1} className={iconTextStyle} align="middle">
                                <Link
                                    to="https://youtube.com/webiny"
                                    className={linkStyle}
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                >
                                    <YouTubeIcon className={imageStyle} />
                                    <p>YouTube</p>
                                </Link>
                            </Cell>
                            <Cell span={1} className={iconTextStyle} align="middle">
                                <Link
                                    to="https://twitter.com/WebinyPlatform"
                                    className={linkStyle}
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                >
                                    <TwitterIcon className={imageStyle} />
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
