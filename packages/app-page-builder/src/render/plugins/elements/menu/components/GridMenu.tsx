import * as React from "react";
import { get } from "lodash";
import { Link } from "@webiny/react-router";
//alter this for menu not page lists
import { ReactComponent as PrevIcon } from "./icons/round-navigate_before-24px.svg";
import { ReactComponent as NextIcon } from "./icons/round-navigate_next-24px.svg";

const formatDate = date => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    return monthNames[month] + " " + day + ", " + year;
};

export type MenuItemProps = {
    data: any; // TODO: create a better type
    className?: string;
};

const MenuItem = ({ data, className }: MenuItemProps) => {
    console.log("MENU ITEM FROM RENDER::::::::::::");
    return (
        <Link to={data.fullUrl} className={"webiny-pb-page-element-menu__item " + className}>
            <div
                className={"webiny-pb-page-element-menu__media"}
                style={{
                    backgroundImage: `url("${get(data, "settings.general.image.src")}?width=500")`
                }}
            />
            <div className={"webiny-pb-page-element-menu__content"}>
                <h3 className={"webiny-pb-page-element-menu__title webiny-pb-typography-h3"}>
                    {data.title}
                </h3>
                <p
                    className={
                        "webiny-pb-page-element-menu__snippet webiny-pb-typography-description"
                    }
                >
                    {data.snippet}
                </p>
                <div
                    className={
                        "webiny-pb-page-element-menu__date webiny-pb-typography-description"
                    }
                >
                    {formatDate(data.publishedOn)}
                </div>
            </div>
        </Link>
    );
};

const GridMenu = ({ data, nextPage, prevPage }) => {
    console.log("GRID MENU FROM RENDER::::::::::::");
    return (
        <div className={"webiny-pb-page-element-menu webiny-pb-page-element-menu--grid"}>
            <div className={"webiny-pb-page-element-menu__items"}>
                {data.map(page => (
                    <MenuItem key={page.id} data={page} />
                ))}
            </div>
            <div className={"webiny-pb-page-element-menu__navigation"}>
                {prevPage && (
                    <a onClick={prevPage}>
                        <PrevIcon /> Prev page
                    </a>
                )}
                {nextPage && (
                    <a onClick={nextPage}>
                        Next page <NextIcon />
                    </a>
                )}
            </div>
        </div>
    );
};

export default GridMenu;
