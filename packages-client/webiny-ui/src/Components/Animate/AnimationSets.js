import _ from 'lodash';
import dynamics from 'dynamics.js';

class AnimationSets {
    static fadeIn(el, callback) {
        dynamics.animate(el, {
            opacity: 1
        }, {
            type: dynamics.spring,
            duration: 250,
            complete: callback
        });
    }

    static fadeOut(el, callback) {
        dynamics.animate(el, {
            opacity: 0
        }, {
            type: dynamics.easeInOut,
            duration: 250,
            complete: callback
        });
    }

    static custom(anim, el, callback) {
        dynamics.animate(el, anim, {
            type: dynamics[_.get(anim, 'ease', 'easeIn')],
            duration: _.get(anim, 'duration', 250),
            friction: _.get(anim, 'friction', null),
            frequency: _.get(anim, 'frequency', null),
            bounciness: _.get(anim, 'bounciness', null),
            elasticity: _.get(anim, 'elasticity', null),
            complete: callback
        });
    }
}

export default AnimationSets;