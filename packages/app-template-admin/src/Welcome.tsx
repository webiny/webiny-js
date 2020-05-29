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

import { css } from "emotion";


const linkStyle = css({
    textDecoration: "none",
    "&:hover": {
        textDecoration: "none"
    },
    marginTop: "6px"
});

const noteStyle = css({
    marginLeft: "20px",
    marginTop: "20px"
});

const imageStyle = css({
    width: "30px",
    height: "30px"
});

const communityStyle = css({
    textAlign: "left",
});

const Welcome = () => {
    return (
        <Grid>
            <Cell span={2} />
            <Cell span={8}>
                <SimpleForm>
                    <SimpleFormHeader title={"Welcome!"} />
                    <SimpleFormContent>
                        <Typography use={"headline6"}>
                            <p className={noteStyle}>Get started by creating your first Content Model below:</p>
                        </Typography>
                        <Grid>
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
                                    <p>Join us on:</p>
                                </Typography>
                            </Cell>
                            <Cell span={1}>
                                <img
                                    className={imageStyle}
                                    src={SlackIcon}
                                    align="left"
                                />
                            </Cell>
                                <Cell span={1} align="middle">
                                    <Link to="https://www.webiny.com/slack/" className={linkStyle}>
                                        Slack
                                    </Link>
                                </Cell>
                            <Cell span={1}>
                                <img
                                    className={imageStyle}
                                    src={GithubIcon}
                                    align="left"
                                />
                            </Cell>
                            <Cell span={1} align="middle">
                                <Link to="https://github.com/webiny/webiny-js" className={linkStyle}>
                                    Github
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
