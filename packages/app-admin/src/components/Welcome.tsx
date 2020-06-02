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
import { ButtonPrimary } from "@webiny/ui/Button";
import { Elevation } from "@webiny/ui/Elevation";
import GithubIcon from "../assets/icons/github-logo.svg";
import SlackIcon from "../assets/icons/slack-logo.svg";
import MediumIcon from "../assets/icons/medium-logo.svg";
import TwitterIcon from "../assets/icons/twitter-logo.svg";

import { useSecurity } from "@webiny/app-security/hooks/useSecurity";

import { css } from "emotion";
import styled from "@emotion/styled";
import { AdminWelcomeScreenWidgetPlugin } from "@webiny/app-admin/types";
import { getPlugins } from "@webiny/plugins";

const linkStyle = css({
    textDecoration: "none",
    "&:hover": {
        textDecoration: "none"
    }
});

const imageStyle = css({
    width: "30px",
    height: "30px"
});

const communityStyle = css({
    textAlign: "left"
});

const welcomeStyle = css({
    color: "var(--mdc-theme-text-primary-on-background)"
});

const pFormContentStyle = css({
    fontWeight: "bold"
});

const Widget = styled("div")({
    width: 400
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
                    <SimpleFormHeader title={`Welcome ${fullName.split(" ")[0]}!`} />
                    <SimpleFormContent>
                        <Cell span={12}>
                            <Typography use={"body1"} className={welcomeStyle}>
                                To get started - pick one of the actions below:<br></br>
                            </Typography>
                        </Cell>
                        {getPlugins<AdminWelcomeScreenWidgetPlugin>(
                            "admin-welcome-screen-widget"
                        ).map(pl => {
                            return (
                                <Elevation z={2} key={pl.name}>
                                    <Widget>
                                        <Typography use={"headline6"} className={welcomeStyle}>
                                            {pl.widget.title}
                                        </Typography>
                                        <Typography use={"body1"} className={communityStyle}>
                                            {pl.widget.description}
                                        </Typography>
                                        {pl.widget.cta}
                                    </Widget>
                                </Elevation>
                            );
                        })}
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <Grid>
                            <Cell span={8}>
                                <Typography use={"headline6"} className={communityStyle}>
                                    <p className={pFormContentStyle}>Learn more about Webiny:</p>
                                </Typography>
                            </Cell>
                            <Cell span={4}>
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
                            <Cell span={4}>
                                <Typography use={"body1"} className={communityStyle}>
                                    <p>
                                        Get to know Webiny team members, discuss new ideas and get
                                        help:
                                    </p>
                                </Typography>
                            </Cell>
                            <Cell span={4}>
                                <Link to="cms/content-models" className={linkStyle}>
                                    <ButtonPrimary>Documentation</ButtonPrimary>
                                </Link>
                            </Cell>
                            <Cell span={4}>
                                <Link to="cms/content-models" className={linkStyle}>
                                    <ButtonPrimary>Code examples</ButtonPrimary>
                                </Link>
                            </Cell>
                            <Cell span={1}>
                                <img className={imageStyle} src={SlackIcon} />
                                <Link to="https://www.webiny.com/slack/" className={linkStyle}>
                                    <p style={{ textAlign: "left" }}>Slack</p>
                                </Link>
                            </Cell>
                            <Cell span={1}>
                                <img className={imageStyle} src={GithubIcon} />
                                <Link
                                    to="https://github.com/webiny/webiny-js"
                                    className={linkStyle}
                                >
                                    <p style={{ textAlign: "left" }}>Github</p>
                                </Link>
                            </Cell>
                            <Cell span={1}>
                                <img className={imageStyle} src={MediumIcon} />
                                <Link to="https://blog.webiny.com" className={linkStyle}>
                                    <p style={{ textAlign: "left" }}>Medium</p>
                                </Link>
                            </Cell>
                            <Cell span={1}>
                                <img className={imageStyle} src={TwitterIcon} />
                                <Link to="https://twitter.com/WebinyPlatform" className={linkStyle}>
                                    <p style={{ textAlign: "left" }}>Twitter</p>
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
