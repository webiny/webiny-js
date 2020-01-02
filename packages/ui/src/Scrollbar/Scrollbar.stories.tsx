import * as React from "react";
import { storiesOf } from "@storybook/react";
import { Story, StoryReadme, StorySandbox } from "@webiny/storybook-utils/Story";
import readme from "./../Scrollbar/README.md";
import { Scrollbar } from "./Scrollbar";

const story = storiesOf("Components/Scrollbar", module);

story.add(
    "usage",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox title={"Scrollbar demo"}>
                    <Scrollbar style={{ width: 300, height: 200 }}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec lorem leo,
                        aliquam aliquet arcu vel, faucibus feugiat est. Nulla facilisi. Donec
                        lobortis metus dictum sem egestas, non lobortis erat suscipit. Nunc
                        fermentum tempor nisi, nec venenatis odio egestas at. Nulla facilisi. Fusce
                        sed venenatis velit, ac rhoncus ligula. Integer hendrerit egestas ante,
                        tristique posuere augue auctor non. Curabitur accumsan, ipsum cursus euismod
                        volutpat, enim ligula interdum diam, id suscipit ipsum lectus id ligula. Ut
                        nec odio vel lacus volutpat commodo. In hac habitasse platea dictumst. Donec
                        nunc lacus, venenatis non tellus vel, semper porta quam. Ut fermentum mattis
                        urna non imperdiet. Fusce tincidunt enim nec tincidunt dapibus. Aliquam eu
                        ligula quis ligula pretium tincidunt non sit amet velit. Curabitur vel
                        interdum enim, ut molestie ligula.
                    </Scrollbar>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [Scrollbar] } }
);
