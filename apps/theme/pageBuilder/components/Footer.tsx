import * as React from "react";
import { Link } from "@webiny/react-router";
import { ReactComponent as FacebookIcon } from "./assets/facebook-square-brands.svg";
import { ReactComponent as TwitterIcon } from "./assets/twitter-square-brands.svg";
import { ReactComponent as InstagramIcon } from "./assets/instagram-brands.svg";
import { PbPageData } from "@webiny/app-page-builder/types";

import styled from "@emotion/styled";
import { breakpoints, colors, typography } from "../theme";

const Wrapper = styled.footer`
    background-color: ${colors.color4};
    height: 100px;
`;

const Inner = styled.div`
    align-items: center;
    display: flex;
    flex-direction: row;
    height: 100%;
    justify-content: space-between;
    margin: 0 auto;
    max-width: 1200px;

    ${breakpoints.tablet} {
        flex-direction: column;
    }
`;

const Logo = styled.div`
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
        ${typography.paragraph2}
        color: ${colors.color6}
    }
`;

const Social = styled.div`
    text-align: right;

    ${breakpoints.tablet} {
        margin-bottom: 15px;
    }

    a {
        display: inline-block;

        svg {
            height: 25px;
            margin-left: 10px;
            opacity: 0.6;
            transition: opacity 0.3s;
            color: ${colors.color6};

            &:hover {
                opacity: 1;
            }
        }
    }
`;

interface FooterProps {
    settings: Record<string, any>;
    page: PbPageData;
}

const Footer: React.FC<FooterProps> = ({ settings }) => {
    const { name, logo, social } = settings;

    return (
        <Wrapper data-testid={"pb-footer"}>
            <Inner>
                <Logo className={"logo"}>
                    <Link to="/">{logo && logo.src && <img src={logo.src} alt={name} />}</Link>
                    <div className={"copy"}>
                        {name} © {new Date().getFullYear()}
                    </div>
                </Logo>
                {social && (
                    <Social className={"social"}>
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
                    </Social>
                )}
            </Inner>
        </Wrapper>
    );
};

export default Footer;
