import React from "react";
import { Link } from "@webiny/react-router";
import classNames from "classnames";
import GitHubButton from "react-github-btn";
import Button from "../Button";
// assets
import { ReactComponent as RightArrowIcon } from "./assets/arrow-right.svg";
import { ReactComponent as DownArrowIcon } from "./assets/down-arrow-black.svg";

// styles
import * as Styled from "./styled";

const getSection = (arr, title) => {
    return arr.find(item => item.title === title);
};

interface MenuItemListProps {
    items: any[];
    handleVideoPlay?: (videoId: string) => void;
    sticky: boolean;
}

const MenuItemList: React.FunctionComponent<MenuItemListProps> = ({
    items,
    handleVideoPlay,
    sticky
}) => {
    const handleClick = ({ action }, cb) => {
        cb(action.link);
        return null;
    };

    return (
        <React.Fragment>
            <ul className="menu--left">
                {items.map(menu => {
                    const secondaryLinks = getSection(menu.children, "Secondary").children.filter(
                        a => a.type === "link"
                    );

                    return (
                        <Styled.MenuItem key={menu.id}>
                            {menu.link ? (
                                <Link rel="prerender" to={menu.link} className={"root-link"}>
                                    {menu.title}
                                </Link>
                            ) : (
                                <a className={"root-link"}>{menu.title}</a>
                            )}
                            {getSection(menu.children, "Primary") && (
                                <React.Fragment>
                                    <DownArrowIcon
                                        className={classNames("arrow-icon", Styled.downArrowClass)}
                                    />
                                    {/* @ts-ignore */}
                                    <Styled.DropDown className={menu.className}>
                                        <div className={Styled.dropdownArrow} />
                                        <div className="section--primary">
                                            {/* @ts-ignore */}
                                            {getSection(menu.children, "Primary").children.map(
                                                menuItem => {
                                                    if (
                                                        menuItem.type === "folder" &&
                                                        menuItem.title === "Spacer"
                                                    ) {
                                                        return (
                                                            <div
                                                                className={"spacer"}
                                                                key={menuItem.id}
                                                            />
                                                        );
                                                    }

                                                    return (
                                                        <Link
                                                            key={menuItem.id}
                                                            className={"link"}
                                                            rel="prerender"
                                                            to={menuItem.url}
                                                        >
                                                            {menuItem.action ? (
                                                                <span
                                                                    onClick={() => {
                                                                        menuItem.action();
                                                                    }}
                                                                >
                                                                    {menuItem.label}
                                                                </span>
                                                            ) : (
                                                                menuItem.title
                                                            )}
                                                        </Link>
                                                    );
                                                }
                                            )}
                                        </div>
                                        {/* @ts-ignore */}
                                        {secondaryLinks.length > 0 && (
                                            <div className="section--primary has-border">
                                                {/* @ts-ignore */}
                                                {secondaryLinks.map(menuItem => {
                                                    console.log("Secondary => ", menuItem);
                                                    if (
                                                        menuItem.type === "folder" &&
                                                        menuItem.title === "Spacer"
                                                    ) {
                                                        return (
                                                            <div
                                                                className={"spacer"}
                                                                key={menuItem.id}
                                                            />
                                                        );
                                                    }

                                                    return (
                                                        <Link
                                                            key={menuItem.id}
                                                            className={"link"}
                                                            rel="prerender"
                                                            to={menuItem.url}
                                                        >
                                                            {menuItem.action ? (
                                                                <span
                                                                    onClick={() => {
                                                                        menuItem.action();
                                                                    }}
                                                                >
                                                                    {menuItem.title}
                                                                </span>
                                                            ) : (
                                                                menuItem.title
                                                            )}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* @ts-ignore */}
                                        {getSection(menu.children, "Secondary") && (
                                            <div className="section--secondary">
                                                {/* @ts-ignore */}
                                                {getSection(menu.children, "Secondary")
                                                    .children.filter(a => a.type === "card")
                                                    .map(item => (
                                                        <Styled.Card
                                                            key={item.id}
                                                            onClick={() =>
                                                                handleClick(item, handleVideoPlay)
                                                            }
                                                        >
                                                            <img
                                                                src={item.poster.url.src}
                                                                alt={item.poster.alt}
                                                                className="card__img"
                                                            />
                                                            <h4 className="card__title">
                                                                {item.title}
                                                            </h4>
                                                            <p className="card__link">
                                                                {item.action.label}

                                                                <RightArrowIcon
                                                                    className={"icon"}
                                                                />
                                                            </p>
                                                        </Styled.Card>
                                                    ))}
                                            </div>
                                        )}
                                    </Styled.DropDown>
                                </React.Fragment>
                            )}
                        </Styled.MenuItem>
                    );
                })}

                <Styled.MenuItem className={Styled.githubMenu}>
                    <div
                        onClick={() => {
                            // trackGoToGithub({ placement: "header-github-star" });
                        }}
                    >
                        <GitHubButton
                            href="https://github.com/webiny/webiny-js"
                            data-icon="octicon-star"
                            data-show-count="true"
                            aria-label="Star webiny/webiny-js on GitHub"
                        >
                            Star
                        </GitHubButton>
                    </div>
                </Styled.MenuItem>
            </ul>
            <ul className="menu--right">
                <Styled.MenuItem>
                    <div
                        onClick={() => {
                            // trackBookADemo({ placement: "header" });
                        }}
                    >
                        <Button
                            className={Styled.buttonOutlinePrimary}
                            link="https://calendly.com/webiny/30min"
                            type={sticky && "outline"}
                        >
                            Book a demo
                        </Button>
                    </div>
                </Styled.MenuItem>
                <Styled.MenuItem>
                    <Button link="/docs/webiny/introduction/" type={sticky && "primary"}>
                        Get Started
                    </Button>
                </Styled.MenuItem>
            </ul>
        </React.Fragment>
    );
};

export default MenuItemList;
