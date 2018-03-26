import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './../../Views/styles.css';

class Carousel extends Webiny.Ui.View {

}

Carousel.defaultProps = {
    renderer() {
        const {Carousel} = this.props;
        return (
            <div className={styles.carousel}>
                <Carousel nav={true} lazyLoad={true} items={1} dots={true} mouseDrag={true}>
                    {this.props.images.map(image => {
                        return <img className="owl-lazy" data-src={image} key={image}/>;
                    })}
                </Carousel>
            </div>
        );
    }
};

export default Webiny.createComponent(Carousel, {styles, modules: ['Carousel']});