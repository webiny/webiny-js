//@flow
import React from "react";
import { css } from "emotion";
import { keyframes } from "react-emotion";
import classnames from "classnames";

import SlideOutline from "./SlideOutline";

import { ReactComponent as BlocksIcon } from "../assets/slide-2-icon.svg";
import { ReactComponent as HandIcon } from "../assets/hand-icon.svg";
import { ReactComponent as BlockMock } from "../assets/block-mock.svg";
import { ReactComponent as Hover } from "../assets/slide-2-hover.svg";

const handPulsateSlide2 = keyframes`
    0% { 
        display: none; 
        visibility: hidden;
        opacity: 0; 
    }
    100% { 
        display: block; 
        visibility: block;
        opacity: 1;  
    }
`;

const blockAppearSlide2 = keyframes`
    0% { 
        transform: translateY(-100px);
        opacity: 0; 
    }
    100% { 
        transform: translateY(0px);
        opacity: 1;  
    }
`;

const hoverAppearSlide2 = keyframes`
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

const handStylesSlide2 = css({
    display: "block",
    right: 49,
    bottom: -14,
    width: 50,
    height: "auto",
    zIndex: 10,
    animationName: handPulsateSlide2,
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in",
    animationDuration: "3s"
});

const blockMockStyleSlide2 = css({
    display: "block",
    left: 115,
    top: 85,
    animationName: blockAppearSlide2,
    animationIterationCount: 1,
    animationTimingFunction: "ease-in",
    animationDuration: "1s"
});

const hoverStyleSlide2 = css({
    left: 75,
    top: 55,
    display: "block",
    animationName: hoverAppearSlide2,
    animationIterationCount: 1,
    animationTimingFunction: "ease-in",
    animationDuration: "2s"
});

type Props = {
    currentSlide: number
};

class Slide2 extends React.Component<Props> {
    slideNumber = 2;

    editorContent = () => {
        return (
            <React.Fragment>
                <HandIcon
                    className={classnames(svgElement, {
                        [handStylesSlide2]: this.props.currentSlide === this.slideNumber
                    })}
                />
                <BlockMock
                    className={classnames(svgElement, {
                        [blockMockStyleSlide2]: this.props.currentSlide === this.slideNumber
                    })}
                />
                <Hover
                    className={classnames(svgElement, {
                        [hoverStyleSlide2]: this.props.currentSlide === this.slideNumber
                    })}
                />
            </React.Fragment>
        );
    };

    render() {
        return (
            <SlideOutline
                title={"Blocks"}
                description={
                    "Blocks, are the main sections of your page inside which all content is placed.\n" +
                    "To add a block, click the green button in the lower right corner.\n" +
                    "You can start with an empty block. or use one of the pre-built ones."
                }
                learnMoreText={"Click here to learn more about Blocks."}
                learnMoreLink={"https://docs.webiny.com/cms/blocks"}
                icon={<BlocksIcon />}
                editorContent={this.editorContent()}
            />
        );
    }
}

export default Slide2;
