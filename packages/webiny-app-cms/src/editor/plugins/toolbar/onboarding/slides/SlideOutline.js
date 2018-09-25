//@flow
import * as React from "react";
import styled from "react-emotion";
import { Typography } from "webiny-ui/Typography";
import { List, ListItem, ListItemGraphic, ListItemMeta } from "webiny-ui/List";

import { ReactComponent as EditorMockIcon } from "../assets/editor-mock.svg";
import { ReactComponent as LearnMoreHelpIcon } from "../assets/help-learn-more.svg";
import { ReactComponent as LearnMoreRightArrowIcon } from "../assets/learn-more-right-arrow.svg";

const SlideContainer = styled("div")({
    display: "flex",
    flexDirection: "column",
    width: 800,
    height: 600,
    alignItems: "center",
    justifyContent: "flex-end"
});

const EditorMock = styled("div")({
    width: "100%",
    textAlign: "center",
    marginBottom: -10,
    position: "relative",
    ">svg.editor-mock": {
        width: 725,
        height: "100%"
    }
});

const TextHolder = styled("div")({
    backgroundColor: "#B7A2BF",
    width: "100%",
    height: 245,
    display: "flex",
    zIndex: 1
});

const IconHolder = styled("div")({
    backgroundColor: "#72457F",
    width: 200,
    height: 245,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
});

const TextHolderInner = styled("div")({
    width: 600,
    height: 245,
    padding: 25,
    boxSizing: "border-box",
    color: "white",
    position: "relative"
});

const LearnMore = styled("div")({
    width: 520,
    color: "white",
    backgroundColor: "#72457F",
    position: "absolute",
    bottom: 25,
    ">.mdc-list": {
        padding: "0 !important",
        ".mdc-list-item": {
            color: "white"
        },
        ".mdc-list-item__meta": {
            color: "white",
            width: 24,
            height: 24,
            display: "inline-flex",
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center"
        }
    }
});

type Props = {
    icon: React.Node,
    title: string,
    description: string,
    learnMoreText: string,
    learnMoreLink: string,
    editorContent: React.Node
};

const SlideOutline = (props: Props) => {
    return (
        <SlideContainer>
            <EditorMock>
                <EditorMockIcon className={"editor-mock"} />
                {props.editorContent}
            </EditorMock>
            <TextHolder>
                <IconHolder>{props.icon}</IconHolder>
                <TextHolderInner>
                    <h4>
                        <Typography use={"headline4"}>{props.title}</Typography>
                    </h4>
                    <p>
                        <Typography use={"body1"}>{props.description}</Typography>
                    </p>
                    <LearnMore>
                        <List nonInteractive={true}>
                            <ListItem onClick={() => window.open(props.learnMoreLink, "_blank")}>
                                <ListItemGraphic>
                                    <LearnMoreHelpIcon />
                                </ListItemGraphic>
                                {props.learnMoreText}
                                <ListItemMeta>
                                    <LearnMoreRightArrowIcon />
                                </ListItemMeta>
                            </ListItem>
                        </List>
                    </LearnMore>
                </TextHolderInner>
            </TextHolder>
        </SlideContainer>
    );
};

export default SlideOutline;
