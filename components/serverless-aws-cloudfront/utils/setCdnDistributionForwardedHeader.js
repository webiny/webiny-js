module.exports = function setCdnDistributionForwardedHeader({ DistributionConfig, key, value }) {
    DistributionConfig.Origins.Items.forEach(origin => {
        let hasHeader = false;
        for (let i = 0; i < origin.CustomHeaders.Items.length; i++) {
            const item = origin.CustomHeaders.Items[i];
            if (item.HeaderName === key) {
                item.HeaderValue = value;
                hasHeader = true;
                break;
            }
        }

        if (!hasHeader) {
            origin.CustomHeaders.Quantity++;
            origin.CustomHeaders.Items.push({
                HeaderName: key,
                HeaderValue: value
            });
        }
    });
}

