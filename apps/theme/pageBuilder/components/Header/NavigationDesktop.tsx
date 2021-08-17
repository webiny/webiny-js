import React from "react";
import * as Styled from "./styled";
import MenuItemList from "./MenuItems";

interface NavigationProps {
    data: {
        items: [];
        title: null;
        slug: null;
    };
}

const NavigationDesktop: React.FunctionComponent<NavigationProps> = ({ data }) => {
    /**
     * Bail out early if there is no menu items.
     */
    if (data.items.length === 0) {
        return null;
    }

    return (
        <Styled.Menu>
            <MenuItemList
                items={data.items}
                sticky={true}
                handleVideoPlay={videoId => {
                    // TODO: @ashutohsh implement video player
                    console.log(`video ID: ${videoId}`);
                    // setModalOpen(true);
                    // setVideoId(videoId);
                }}
            />
        </Styled.Menu>
    );
};

export default NavigationDesktop;
