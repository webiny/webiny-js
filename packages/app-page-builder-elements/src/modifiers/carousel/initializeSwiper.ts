let pbCarouselCheck: Promise<void>;

export const initializeSwiper = async () => {
    if (typeof window === "undefined") {
        return;
    }

    if (!pbCarouselCheck) {
        pbCarouselCheck = new Promise<void>(resolve => {
            const interval = setInterval(() => {
                if (document.querySelector("swiper-container")) {
                    clearInterval(interval);
                    resolve();
                }
            }, 333);
        });
    }

    await pbCarouselCheck;

    const register = await import("swiper/element/bundle");

    register.register();
};
