import * as React from "react";
import { Link } from "@webiny/react-router";
import { ReactComponent as FacebookIcon } from "./assets/facebook-square-brands.svg";
import { ReactComponent as TwitterIcon } from "./assets/twitter-square-brands.svg";
import { ReactComponent as InstagramIcon } from "./assets/instagram-brands.svg";
import { ReactComponent as LinkedInIcon } from "./assets/linkedin-brands.svg";

import styled from "@emotion/styled";
import { usePage } from "@webiny/app-page-builder-elements";

export const Footer = () => {
    const { layoutProps } = usePage();
    const { name, logo, social } = layoutProps["settings"];

    return (
        <FooterWrapper data-testid={"pb-footer"}>
            <FooterBody>
                <FooterLogo className={"logo"}>
                    <Link to="/">{logo && logo.src && <img src={logo.src} alt={name} />}</Link>
                    <div className={"copy"}>
                        {name} © {new Date().getFullYear()}
                    </div>
                </FooterLogo>
                {social && (
                    <FooterSocial className={"social"}>
                        {social.facebook && (
                            <a href={social.facebook}>
                                <FacebookIcon />
                            </a>
                        )}
                        {social.twitter && (
                            <a href={social.twitter}>
                                <TwitterIcon />
                            </a>
                        )}
                        {social.instagram && (
                            <a href={social.instagram}>
                                <InstagramIcon />
                            </a>
                        )}
                        {social.linkedIn && (
                            <a href={social.linkedIn}>
                                <LinkedInIcon />
                            </a>
                        )}
                    </FooterSocial>
                )}
            </FooterBody>
        </FooterWrapper>
    );
};

const FooterWrapper = styled.footer`
    background-color: ${props => props.theme.styles.colors["color5"]};
    height: 100px;
`;

const FooterBody = styled.div`
    align-items: center;
    display: flex;
    flex-direction: row;
    height: 100%;
    justify-content: space-between;
    margin: 0 auto;
    max-width: 1200px;

    ${props => props.theme.breakpoints["tablet"]} {
        flex-direction: column;
    }
`;

const FooterLogo = styled.div`
    align-items: center;
    display: flex;
    flex: 1;

    a {
        line-height: 80%;
    }

    img {
        margin-right: 10px;
        max-height: 25px;
    }

    .copy {
        ${props => props.theme.styles.typography["paragraphs"].stylesById("paragraph2")}
        color: ${props => props.theme.styles.colors["color4"]}
    }
`;

const FooterSocial = styled.div`
    text-align: right;

    ${props => props.theme.breakpoints["tablet"]} {
        margin-bottom: 15px;
    }

    a {
        display: inline-block;

        svg {
            height: 25px;
            margin-left: 10px;
            opacity: 0.6;
            transition: opacity 0.3s;
            color: ${props => props.theme.styles.colors["color4"]};

            &:hover {
                opacity: 1;
            }
        }
    }
`;
