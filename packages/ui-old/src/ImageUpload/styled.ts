import styled from "@emotion/styled";

export const AddImageIconWrapper = styled("div")({
    color: "var(--mdc-theme-text-secondary-on-background)",
    ">svg": {
        width: "100%",
        height: "100%",
        maxWidth: 50,
        maxHeight: 50,
        display: "block",
        opacity: 0.5,
        margin: "0 auto"
    }
});

export const AddImageWrapper = styled("div")({
    width: "100%",
    height: "100%",
    minHeight: 50,
    minWidth: 50,
    textAlign: "center",
    backgroundColor: "var(--mdc-theme-on-background)",
    borderRadius: 0,
    borderBottom: "1px solid var(--mdc-theme-text-hint-on-background)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "column",
    transition: "color 0.2s",
    cursor: "pointer",
    padding: 10,
    boxSizing: "border-box",
    "&:hover": {
        backgroundColor: "rgba(0,0,0, 0.5)",
        borderBottom: "1px solid var(--mdc-theme-on-surface)"
    }
});

export const AddImageWrapperRound = styled(AddImageWrapper)({
    margin: "auto",
    width: "150px",
    height: "150px",
    borderRadius: "50%"
});

export const RemoveImage = styled("div")({
    position: "absolute",
    cursor: "pointer",
    top: 10,
    right: 10,
    display: "none",
    color: "white",
    opacity: 0.5,
    "&:hover": {
        opacity: 0.75
    }
});

export const EditImage = styled("div")({
    position: "absolute",
    cursor: "pointer",
    top: 10,
    left: 10,
    display: "none",
    color: "white",
    opacity: 0.5,
    "&:hover": {
        opacity: 0.75
    }
});

export const ImagePreviewWrapper = styled("div")({
    width: "100%",
    height: "100%",
    minHeight: 50,
    minWidth: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "column",
    boxSizing: "border-box",
    position: "relative",
    // @ts-expect-error
    [AddImageWrapper]: {
        position: "absolute",
        display: "none",
        top: 0,
        height: "100%",
        zIndex: 1,
        backgroundColor: "rgba(0,0,0, 0.75)",
        // @ts-expect-error
        [AddImageIconWrapper]: {
            top: "50%",
            left: "50%",
            transform: "translateY(-50%) translateX(-50%)",
            position: "absolute",
            color: "white"
        }
    },
    "&:hover": {
        // @ts-expect-error
        [AddImageWrapper]: {
            display: "block"
        },
        // @ts-expect-error
        [RemoveImage]: {
            display: "block",
            zIndex: 2
        },
        // @ts-expect-error
        [EditImage]: {
            display: "block",
            zIndex: 2
        }
    }
});
