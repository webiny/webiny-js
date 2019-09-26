//@flow
import React from "react";
import { css } from "emotion";
import { keyframes } from "emotion";
import classnames from "classnames";

import SlideOutline from "./SlideOutline";

import { ReactComponent as BlocksIcon } from "../assets/slide-4-icon.svg";
import { ReactComponent as BlockMock } from "../assets/block-mock.svg";
import { ReactComponent as Hover } from "../assets/slide-4-hover.svg";

const hoverAppearSlide4 = keyframes`
    0% { 
        opacity: 0; 
    }
    66% { 
        opacity: 0;
    }
    100% { 
        opacity: 1;  
    }
`;

const svgElement = css({
    display: "none",
    position: "absolute"
});

const blockMockStyleSlide4 = css({
    position: "absolute",
    display: "block",
    left: 115,
    top: 85
});

const hoverStyleSlide4 = css({
    left: 110,
    top: 81,
    display: "block",
    animationName: hoverAppearSlide4,
    animationIterationCount: 1,
    animationTimingFunction: "ease-in",
    animationDuration: "2s"
});

type Props = {
    currentSlide: number
};

class Slide4 extends React.Component<Props> {
    slideNumber = 4;

    editorContent = () => {
        return (
            <React.Fragment>
                <BlockMock className={blockMockStyleSlide4} />
                <Hover
                    className={classnames(svgElement, {
                        [hoverStyleSlide4]: this.props.currentSlide === this.slideNumber
                    })}
                />
            </React.Fragment>
        );
    };

    render() {
        return (
            <SlideOutline
                title={"Columns"}
                description={
                    "Inside each row, you can have one or more columns stacked horizontally. You will \n" +
                    "find columns under the same section a Rows."
                }
                learnMoreText={"Click here to learn more about Columns."}
                learnMoreLink={"https://docs.webiny.com/cms/columns"}
                icon={<BlocksIcon />}
                editorContent={this.editorContent()}
            />
        );
    }
}

export default Slide4;
