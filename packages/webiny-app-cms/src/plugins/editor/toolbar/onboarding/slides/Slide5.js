//@flow
import React from "react";
import { css } from "emotion";
import { keyframes } from "react-emotion";
import classnames from "classnames";

import SlideOutline from "./SlideOutline";

import { ReactComponent as BlocksIcon } from "../assets/slide-5-icon.svg";
import { ReactComponent as HandIcon } from "../assets/hand-icon.svg";
import { ReactComponent as BlockMock } from "../assets/block-mock.svg";
import { ReactComponent as Hover } from "../assets/slide-4-hover.svg";
import { ReactComponent as ElementList } from "../assets/slide-5-element-list.svg";

const handPulsateSlide5 = keyframes`
    0% { 
        display: none; 
        visibility: hidden;
        opacity: 0; 
    }
    50% { 
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

const elementListAppearSlide5 = keyframes`
    0% { 
        opacity: 0; 
    }
    90% { 
        opacity: 0;
        transform: translateX(-25px);
    }
    100% { 
        transform: translateX(0px);
        opacity: 1;  
    }
`;

const svgElement = css({
    display: "none",
    position: "absolute"
});

const handStylesSlide5 = css({
    display: "block",
    left: 38,
    top: 36,
    width: 25,
    height: "auto",
    zIndex: 10,
    animationName: handPulsateSlide5,
    animationIterationCount: 1,
    animationTimingFunction: "ease-in",
    animationDuration: "2s"
});

const blockMockStyleSlide5 = css({
    position: "absolute",
    display: "block",
    left: 115,
    top: 85
});

const hoverStyleSlide5 = css({
    position: "absolute",
    left: 110,
    top: 81,
    display: "block"
});

const elementListStyleSlide5 = css({
    left: 43,
    top: 32,
    display: "block",
    animationName: elementListAppearSlide5,
    animationIterationCount: 1,
    animationTimingFunction: "ease-in",
    animationDuration: "2s"
});

type Props = {
    currentSlide: number
};

class Slide5 extends React.Component<Props> {
    slideNumber = 5;
    editorContent = () => {
        return (
            <React.Fragment>
                <HandIcon
                    className={classnames(svgElement, {
                        [handStylesSlide5]: this.props.currentSlide === this.slideNumber
                    })}
                />
                <BlockMock className={blockMockStyleSlide5} />
                <Hover className={hoverStyleSlide5} />
                <ElementList
                    className={classnames(svgElement, {
                        [elementListStyleSlide5]: this.props.currentSlide === this.slideNumber
                    })}
                />
            </React.Fragment>
        );
    };

    render() {
        return (
            <SlideOutline
                title={"Content"}
                description={
                    "Content resides inside columns. You can add different types of content, such as text, \n" +
                    "images, videos, buttons, and many more. Using those basic elements you can \n" +
                    "create a whole plethora of different content."
                }
                learnMoreText={"Click here to learn more about Content."}
                learnMoreLink={"https://docs.webiny.com/cms/content"}
                icon={<BlocksIcon />}
                editorContent={this.editorContent()}
            />
        );
    }
}

export default Slide5;
