import styled from "@emotion/styled";

export const Footer = styled("div")({
    backgroundColor: "var(--mdc-theme-background)",
    paddingBottom: 10,
    margin: "0 -15px -15px -15px",
    ".mdc-layout-grid": {
        padding: "15px 10px 10px 15px",
        ".mdc-layout-grid__cell.mdc-layout-grid__cell--span-4": {
            paddingRight: 10
        }
    }
});

type InputContainerProps = {
    width?: number | string;
    margin?: number | string;
};

export const InputContainer = styled<"div", InputContainerProps>("div")(props => ({
    "> .mdc-text-field.mdc-text-field--upgraded": {
        height: "30px !important",
        width: props.width || 50,
        margin: props.hasOwnProperty("margin") ? props.margin : "0 0 0 18px",
        ".mdc-text-field__input": {
            paddingTop: 16
        }
    }
}));

type ContentWrapperProps = {
    direction?: "row" | "row-reverse" | "column" | "column-reverse";
};

export const ContentWrapper = styled<"div", ContentWrapperProps>("div")(props => ({
    display: "flex",
    flexDirection: props.direction || "row"
}));

export const COLORS = {
    lightGray: "rgb(248,248,248)",
    gray: "rgb(234,233,234)",
    darkGray: "rgb(179,179,179)",
    darkestGray: "rgb(51,51,51)",
    black: "rgb(0,14,26)"
};

export const TopLeft = styled("div")({
    gridArea: "topLeft"
});
export const Top = styled("div")({
    gridArea: "top"
});
export const TopRight = styled("div")({
    gridArea: "topRight"
});
export const Left = styled("div")({
    gridArea: "left"
});
export const Center = styled("div")({
    gridArea: "center",
    backgroundColor: "rgb(204,229,255)",
    border: "1px dashed rgb(0,64,133)"
});
export const Right = styled("div")({
    gridArea: "right"
});
export const BottomLeft = styled("div")({
    gridArea: "bottomLeft"
});
export const Bottom = styled("div")({
    gridArea: "bottom"
});
export const BottomRight = styled("div")({
    gridArea: "bottomRight"
});
export const SpacingGrid = styled("div")({
    display: "grid",
    gridTemplateColumns: "1fr 2fr 1fr",
    gridTemplateRows: "1fr 1fr 1fr",
    gap: "0px 0px",
    gridTemplateAreas:
        '"topLeft top topRight"' + '"left center right"' + '"bottomLeft bottom bottomRight"',
    border: "1px dashed rgb(21,87,36)",
    backgroundColor: COLORS.lightGray,

    "& .text": {
        fontSize: 11,
        padding: "4px 8px"
    },
    "& .mono": {
        fontFamily: "monospace"
    },
    "& .align-center": {
        display: "flex",
        justifyContent: "center"
    }
});
