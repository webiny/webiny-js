import React from "react";
import { css } from "emotion";
import { Link } from "@webiny/react-router";
import { SimpleFormFooter } from "@webiny/app-admin/components/SimpleForm";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { ReactComponent as YouTubeIcon } from "./icons/youtube.svg";
import { ReactComponent as GithubIcon } from "./icons/github.svg";
import { ReactComponent as SlackIcon } from "./icons/slack.svg";
import { ReactComponent as TwitterIcon } from "./icons/twitter.svg";
import { ReactComponent as TextbookIcon } from "./icons/textbook.svg";
import { ReactComponent as LaptopIcon } from "./icons/laptop.svg";

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

const iconTextStyle = css({
    textAlign: "center"
});

const pFormContentStyle = css({
    fontWeight: 600
});

const footerContainerStyle = css({
    display: "flex",
    padding: "1rem"
});

const footerTextStyle = css({
    backgroundColor: "var(--mdc-theme-on-background)",
    margin: "1rem"
});

const footerLinkTextStyle = css({
    fontWeight: 600,
    paddingLeft: "1rem"
});

export const Footer = () => {
    return (
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
                            Explore the Webiny documentation, learn about the architecture and check
                            out code examples and guides:
                        </p>
                    </Typography>
                </Cell>
                <Cell span={4} style={{ marginLeft: "1rem" }}>
                    <Typography use={"body1"} className={communityStyle}>
                        <p>Get to know Webiny team members, discuss new ideas and get help:</p>
                    </Typography>
                </Cell>
                <Cell
                    span={4}
                    className={footerTextStyle}
                    style={{ margin: "1rem 1rem 1rem 0rem" }}
                >
                    <Link
                        to="https://www.webiny.com/docs"
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
                        to="https://twitter.com/WebinyCMS"
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
    );
};
