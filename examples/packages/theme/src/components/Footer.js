//@flow
import * as React from "react";
import { Link } from "react-router-dom";
import { getFooterData } from "./graphql";
import { Query } from "react-apollo";
import { get } from "lodash";

import { ReactComponent as FacebookIcon } from "./assets/facebook-square-brands.svg";
import { ReactComponent as TwitterIcon } from "./assets/twitter-square-brands.svg";
import { ReactComponent as InstagramIcon } from "./assets/instagram-brands.svg";

const Footer = () => {
    return (
        <Query query={getFooterData}>
            {({ data: response }) => {
                const { name, logo, social } = get(response, "pageBuilder.getSettings.data") || {};

                return (
                    <div className={"webiny-pb-section-footer"}>
                        <div className="webiny-pb-section-footer__wrapper">
                            <div className={"webiny-pb-section-footer__logo"}>
                                <Link to="/">
                                    {logo && logo.src && <img src={logo.src} alt={name} />}
                                </Link>
                                <div
                                    className={
                                        "webiny-pb-section-footer__copy webiny-pb-typography-description"
                                    }
                                >
                                    {name} © {new Date().getFullYear()}
                                </div>
                            </div>
                            {social && (
                                <div className={"webiny-pb-section-footer__social"}>
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
                                </div>
                            )}
                        </div>
                    </div>
                );
            }}
        </Query>
    );
};

export { Footer };
