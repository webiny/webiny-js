import { initializeSwiper } from "./initializeSwiper";

export const registerCarousel = () => {
    new Promise<void>(async resolve => {
        await initializeSwiper();
        resolve();
    });
};
