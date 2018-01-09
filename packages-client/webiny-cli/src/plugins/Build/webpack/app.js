module.exports = () => {
    if (process.env.NODE_ENV === 'production') {
        return require('./app.prod.js');
    } else {
        return require('./app.dev.js');
    }
};