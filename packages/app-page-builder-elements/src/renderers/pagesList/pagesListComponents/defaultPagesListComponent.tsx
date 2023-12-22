import * as React from "react";
import { PagesListComponent, PagesListPage } from "./../types";
import { LinkComponent } from "~/types";
import { DefaultLinkComponent } from "~/renderers/components";
import styled from "@emotion/styled";
import { CSSObject } from "@emotion/react";
import { usePageElements } from "~/hooks/usePageElements";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-pages-list-default": any;
            "pb-pages-list-default-list": any;
            "pb-pages-list-default-loading": any;
            "pb-pages-list-default-list-li": any;
            "pb-pages-list-default-list-li-img": any;
            "pb-pages-list-default-list-li-info": any;
            "pb-pages-list-default-navigation": any;
        }
    }
}

// Instead of importing icons from ".svg" files, we've decided to have them inline here so that
// we don't cause unnecessary build tools / loaders-related issues.
const nextIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24">
        <path fill="none" d="M0 0h24v24H0V0z" />
        <path
            fill="currentColor"
            d="M9.31 6.71c-.39.39-.39 1.02 0 1.41L13.19 12l-3.88 3.88c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l4.59-4.59c.39-.39.39-1.02 0-1.41L10.72 6.7c-.38-.38-1.02-.38-1.41.01z"
        />
    </svg>
);

const prevIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24">
        <path fill="none" d="M0 0h24v24H0V0z" />
        <path
            fill="currentColor"
            d="M14.91 6.71c-.39-.39-1.02-.39-1.41 0L8.91 11.3c-.39.39-.39 1.02 0 1.41l4.59 4.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L11.03 12l3.88-3.88c.38-.39.38-1.03 0-1.41z"
        />
    </svg>
);

const formatDate = (date: string | Date): string => {
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

/**
 * Figure out better data type.
 */
export interface PageItemProps {
    data: PagesListPage;
    LinkComponent: LinkComponent;
}

const PagesListItem = ({ data, LinkComponent }: PageItemProps) => {
    const image = data?.images.general?.src;

    return (
        <pb-pages-list-default-list-li>
            <LinkComponent href={data.url}>
                {image ? (
                    <pb-pages-list-default-list-li-img
                        style={{
                            backgroundImage: `url("${image}?width=500")`
                        }}
                    />
                ) : (
                    <pb-pages-list-default-list-li-img style={{ backgroundColor: "lightgray" }} />
                )}

                <pb-pages-list-default-list-li-info>
                    <h3>{data.title}</h3>
                    <p>{data.snippet}</p>
                    <div>{formatDate(data.publishedOn)}</div>
                </pb-pages-list-default-list-li-info>
            </LinkComponent>
        </pb-pages-list-default-list-li>
    );
};

const SkeletonPagesListItem = () => {
    return (
        <pb-pages-list-default-list-li>
            <pb-pages-list-default-list-li-img style={{ backgroundColor: "lightgray" }} />
            <pb-pages-list-default-list-li-info>
                <h3>&nbsp;</h3>
                <div>&nbsp;</div>
            </pb-pages-list-default-list-li-info>
        </pb-pages-list-default-list-li>
    );
};

export interface CreateDefaultPagesListComponentParams {
    linkComponent?: LinkComponent;
}

interface PbPagesListDefaultProps {
    className?: string;
    style: React.CSSProperties;
    children: React.ReactNode;
}

const PbPagesListDefault = ({ className, style, children }: PbPagesListDefaultProps) => (
    <pb-pages-list-default class={className} style={style}>
        {children}
    </pb-pages-list-default>
);

export const createDefaultPagesListComponent = (
    params?: CreateDefaultPagesListComponentParams
): PagesListComponent =>
    function DefaultPagesListComponent(props) {
        const {
            loading,
            initialLoading,
            data,
            hasNextPage,
            nextPage,
            hasPreviousPage,
            previousPage
        } = props;

        const { theme } = usePageElements();

        const LinkComponent = params?.linkComponent || DefaultLinkComponent;

        const styles: CSSObject = {
            a: {
                textDecoration: "none",
                color: theme.styles.colors.color1
            },
            "pb-pages-list-default-list": {
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-evenly",
                "pb-pages-list-default-list-li": {
                    flex: "0 0 280px",
                    marginBottom: "35px",
                    width: "280px",
                    "pb-pages-list-default-list-li-img": {
                        display: "block",
                        backgroundSize: "cover",
                        height: "180px",
                        width: "100%"
                    },
                    "pb-pages-list-default-list-li-info": {
                        h3: theme.styles.typography.headings.stylesById("heading3"),
                        p: theme.styles.typography.paragraphs.stylesById("paragraph1"),
                        div: {
                            ...theme.styles.typography.paragraphs.stylesById("paragraph1"),
                            color: "#616161",
                            fontSize: ".8rem",
                            fontWeight: 400,
                            letterSpacing: ".03125em",
                            lineHeight: "1.2rem"
                        }
                    }
                }
            },
            "pb-pages-list-default-navigation": {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                width: "100%",
                a: {
                    ...theme.styles.typography.paragraphs.stylesById("paragraph1"),
                    color: theme.styles.colors.color1,
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer"
                }
            }
        };

        const StyledPagesListDefault = styled(PbPagesListDefault)(styles);

        return (
            <StyledPagesListDefault style={{ opacity: loading ? 0.5 : 1 }}>
                <pb-pages-list-default-list>
                    {loading && initialLoading ? (
                        <>
                            <SkeletonPagesListItem />
                            <SkeletonPagesListItem />
                            <SkeletonPagesListItem />
                        </>
                    ) : (
                        data?.data.map(page => (
                            <PagesListItem
                                key={page.id}
                                data={page}
                                LinkComponent={LinkComponent}
                            />
                        ))
                    )}
                </pb-pages-list-default-list>
                <pb-pages-list-default-navigation>
                    {hasPreviousPage && (
                        <LinkComponent onClick={previousPage}>{prevIcon} Prev page</LinkComponent>
                    )}
                    {hasNextPage && (
                        <LinkComponent onClick={nextPage}>Next page {nextIcon}</LinkComponent>
                    )}
                </pb-pages-list-default-navigation>
            </StyledPagesListDefault>
        );
    };
