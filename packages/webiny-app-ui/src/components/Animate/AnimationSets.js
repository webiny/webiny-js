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
        const options = [
            'ease',
            'duration',
            'friction',
            'frequency',
            'bounciness',
            'elasticity'
        ];
        
        dynamics.animate(el,
            _.omit(anim, options),
            {
                type: dynamics[_.get(anim, 'ease', 'easeIn')],
                complete: callback,
                ..._.pick(anim, options)
            }
        );
    }
}

export default AnimationSets;