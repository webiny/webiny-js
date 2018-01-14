export default (router, a, e) => {
    let url = a.href;

    // _blank links should not be intercepted
    if (a.target === '_blank') {
        return;
    }

    // Prevent scrolling to top when clicking on '#' link
    if (url.endsWith('#')) {
        e.preventDefault();
        return;
    }

    // Check if it's an anchor link
    if (url.indexOf('#') > -1) {
        return;
    }

    // Push state and let the Router process the rest
    if (url.startsWith(window.location.origin) || url.startsWith('file://')) {
        e.preventDefault();
        url = url.replace(window.location.origin, '').replace('file://', '');
        router.history.push(url, {
            title: a.getAttribute('data-document-title') || null,
            prevTitle: window.document.title,
            scrollY: a.getAttribute('data-prevent-scroll') === 'true' ? window.scrollY : false
        });
    }
};