module.exports = function setCdnDistributionForwardedHeader({
    DistributionConfig,
    customErrorResponse
}) {
    if (!Array.isArray(DistributionConfig.CustomErrorResponses.Items)) {
        DistributionConfig.CustomErrorResponses.Items = [];
    }

    const existingErrorCodeIndex = DistributionConfig.CustomErrorResponses.Items.findIndex(
        item => item.ErrorCode === customErrorResponse.ErrorCode
    );

    if (existingErrorCodeIndex >= 0) {
        DistributionConfig.CustomErrorResponses.Items[existingErrorCodeIndex] = customErrorResponse;
    } else {
        DistributionConfig.CustomErrorResponses.Items.push(customErrorResponse);
    }

    // Update total items count.
    DistributionConfig.CustomErrorResponses.Quantity =
        DistributionConfig.CustomErrorResponses.Items.length;
};
