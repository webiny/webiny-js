module.exports = function unsetCdnDistributionForwardedHeader({ DistributionConfig, key }) {
    DistributionConfig.Origins.Items.forEach(origin => {
        let headerItemIndex = null;
        for (let i = 0; i < origin.CustomHeaders.Items.length; i++) {
            const item = origin.CustomHeaders.Items[i];
            if (item.HeaderName === key) {
                headerItemIndex = i;
                break;
            }
        }

        if (headerItemIndex !== null) {
            origin.CustomHeaders.Items.splice(headerItemIndex, 1);
            origin.CustomHeaders.Quantity--;
        }
    });

}

