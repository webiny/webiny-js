# webiny-compose

This library is used to compose multiple functions into a connect-style middleware with one difference: it is ONLY intended to be used with arbitrary data.

Often we need to create a queue of functions to process an input, and we need to be able to control the flow.
Usually we would use a publish/subscribe pattern, but it is not often straightforward and not easily controllable due to the nature of events, propagation, and order of events.

Middleware lets us specify the exact order of execution which is especially useful in configurations where you DO have control over your code.

# How to use
```js
import compose from 'webiny-compose';

const middleware = compose([
    /**
    * @param {mixed} params Arbitrary data sent to the middleware 
    * @param {Function} next Execute next function in middleware queue 
    * @param {Function} finish Finish middleware execution and return the data passed as parameter from the middleware 
    */
    (params, next, finish) => {
        // Do something with the params
        params.key = 10;
        // Execute next function
        next();
    },
    (params, next, finish) => {
        if (params.key > 0) {
            // Finish execution and return data
            finish({success: true});
            return;
        }
        next();
    },
    (params, next) => {
        // This function will only be executed if `next` was called in the previous function
        params.optional = 'value';
        next();
    }
]);

// Now execute the middleware
const params = {};
middleware(params).then(result => {
    if (!result) {
        // `finish` was not called
        // `params.optional` will equal to `value` since `params` is modified by reference
    } else {
        // `finish` was called
        // `result.success` will equal to `true`     
    }
});
```

 