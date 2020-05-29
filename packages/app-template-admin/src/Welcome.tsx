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
import GithubIcon from "./assets/icons/github-logo.svg";
import SlackIcon from "./assets/icons/slack-logo.svg";
import MediumIcon from "./assets/icons/medium-logo.svg";
import TwitterIcon from "./assets/icons/twitter-logo.svg";

import { css } from "emotion";


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
    textAlign: "left",
});

const welcomeStyle = css({
    color: "var(--mdc-theme-text-primary-on-background)"
})

const Welcome = () => {
    return (
        <Grid>
            <Cell span={2} />
            <Cell span={8}>
                <SimpleForm>
                    <SimpleFormHeader title={"Welcome!"} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={12}>
                                <Typography use={"body1"} className={welcomeStyle}>
                                    Now that you have created your first admin account, here is a tip on where to get started:<br></br>
                                    Using Webiny, you can create your landing page without having to code using the Page Builder application.<br></br>
                                    To start, creating a form is as easy as using our drag and drop interface within File Builder.<br></br>
                                    Each form you create is classified as a Content Model, so a good place to start building is to create your first Content Model:
                                </Typography>
                            </Cell>
                            <Cell span={6}>
                                <Link to="cms/content-models" className={linkStyle}>
                                    <ButtonPrimary>
                                        Create Content Model
                                    </ButtonPrimary>   
                                </Link>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <Grid>
                            <Cell span={12}>
                                <Typography use={"headline6"} className={communityStyle}>
                                    <p>Join our community:</p>
                                </Typography>
                            </Cell>
                            <Cell span={1}>
                                <img
                                    className={imageStyle}
                                    src={SlackIcon}
                                    align="left"
                                />
                            </Cell>
                                <Cell span={5} align="middle">
                                    <Link to="https://www.webiny.com/slack/" className={linkStyle}>
                                        <p style={{textAlign: "left"}}>Slack</p>
                                    </Link>
                                </Cell>
                            <Cell span={1}>
                                <img
                                    className={imageStyle}
                                    src={GithubIcon}
                                    align="left"
                                />
                            </Cell>
                            <Cell span={5} align="middle">
                                <Link to="https://github.com/webiny/webiny-js" className={linkStyle}>
                                    <p style={{textAlign: "left"}}>Github</p>
                                </Link>
                            </Cell>
                            <Cell span={1}>
                                <img
                                    className={imageStyle}
                                    src={MediumIcon}
                                    align="left"
                                />
                            </Cell>
                            <Cell span={5} align="middle">
                                <Link to="https://blog.webiny.com" className={linkStyle}>
                                    <p style={{textAlign: "left"}}>Medium</p>
                                </Link>
                            </Cell>
                            <Cell span={1}>
                                <img
                                    className={imageStyle}
                                    src={TwitterIcon}
                                    align="left"
                                />
                            </Cell>
                            <Cell span={5} align="middle">
                                <Link to="https://twitter.com/WebinyPlatform" className={linkStyle}>
                                    <p style={{textAlign: "left"}}>Twitter</p>
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
