import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

/**
 * @i18n.namespace Webiny.Ui.Search
 */
class Search extends Webiny.Ui.FormComponent {

    constructor(props) {
        super(props);

        _.assign(this.state, {
            query: '', // Value being searched
            preview: '', // Rendered value of selected value
            options: [],
            loading: false,
            selectedOption: -1, // Selected option index
            selectedData: null // Delected item data
        });

        this.warned = false;
        this.preventBlur = false;
        this.delay = null;
        this.currentValueIsId = false;
        this.filters = {};
        this.unwatch = _.noop;

        this.bindMethods(
            'loadOptions',
            'inputChanged',
            'selectItem',
            'selectCurrent',
            'onKeyUp',
            'onBlur',
            'renderPreview',
            'fetchValue',
            'getCurrentData',
            'applyFreeInput'
        );

        Webiny.Mixins.ApiComponent.extend(this);

        if (this.props.filterBy) {
            // Assume the most basic form of filtering (single string)
            let name = this.props.filterBy;
            let filter = this.props.filterBy;

            // Check if filterBy is defined as array (0 => name of the input to watch, 1 => filter by field)
            if (_.isArray(this.props.filterBy)) {
                name = this.props.filterBy[0];
                filter = this.props.filterBy[1];
            }

            // Check if filterBy is defined as object
            if (_.isPlainObject(this.props.filterBy)) {
                name = this.props.filterBy.name;
                filter = this.props.filterBy.filter;
            }

            this.filterName = name;
            this.filterField = filter;

            this.unwatch = this.props.form.watch(name, newValue => this.applyFilter(newValue, name, filter));
        }
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);

        if (_.isEqual(props.value, this.props.value)) {
            return;
        }

        this.normalizeValue(props);
    }

    componentWillMount() {
        super.componentWillMount();
        this.normalizeValue(this.props);
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.unwatch();
    }

    /** Custom methods */

    /**
     * We support 3 types of values:
     * - id
     * - object
     * - random string
     *
     * @param props
     */
    normalizeValue(props) {
        const value = props.value;

        const newState = {
            options: [],
            selectedOption: -1,
            query: ''
        };

        // Try to extract ID
        let id = null;
        if (value && _.isString(value) && value.match(/^[0-9a-fA-F]{24}$/)) {
            id = value;
        } else if (value && _.isPlainObject(value)) {
            id = value.id;
            newState['selectedData'] = value;
        }

        if (!id && value) {
            newState['preview'] = value;
        } else if (id && _.isPlainObject(value)) {
            newState['preview'] = this.renderPreview(value);
        } else if (id) {
            this.api.get(this.api.getUrl(value)).then(apiResponse => {
                const data = apiResponse.getData('entity');
                this.setState({selectedData: data, preview: this.renderPreview(data)});
            });
        }

        this.currentValueIsId = !!id;
        this.setState(newState);
    }


    getCurrentData() {
        return this.state.selectedData;
    }

    applyFilter(newValue, name, filter) {
        // If filter is a function, it needs to return a config for api created using new value
        if (_.isFunction(filter)) {
            const config = filter(newValue, this.api);
            if (_.isPlainObject(config)) {
                this.filters = config;
            }
        } else {
            // If filter is a string, create a filter object using that string as field name
            const filters = {};
            filters[filter] = _.isObject(newValue) ? newValue.id : newValue;
            this.filters = filters;
        }
        this.filters = _.pickBy(this.filters, v => !_.isNull(v) && !_.isUndefined(v) && v !== '');
    }

    loadOptions(query) {
        this.setState({query});
        clearTimeout(this.delay);

        this.delay = setTimeout(() => {
            if (_.isEmpty(this.state.query) || this.state.query.length < this.props.minQueryLength) {
                return;
            }

            if (this.isMounted()) {
                this.setState({loading: true});
                this.api.setQuery(_.merge({_searchQuery: this.state.query}, this.filters)).execute().then(apiResponse => {
                    const data = apiResponse.getData();
                    this.setState({options: _.get(data, 'list', data), loading: false}, () => {
                        this.props.onLoadOptions({options: this.state.options});
                    });
                });
            }
        }, this.props.allowFreeInput ? 300 : 500);
    }

    inputChanged(e) {
        if (this.props.value && this.currentValueIsId && this.props.allowFreeInput) {
            this.props.onChange(e.target.value);
        }
        this.setState({
            query: e.target.value,
            preview: '',
            selectedData: null
        });
        if (e.target.value.length >= 2) {
            this.loadOptions(e.target.value);
        }
    }

    onKeyUp(e) {
        this.key = e.key;

        if (e.metaKey || e.ctrlKey) {
            return;
        }

        switch (this.key) {
            case 'Backspace':
                if (_.isEmpty(this.state.query) || _.get(this.props, 'value')) {
                    // Reset only if it is a selected value with valid mongo ID or data object
                    const id = _.get(this.props, 'value');
                    if (this.props.allowFreeInput && _.isString(id) && !id.match(/^[0-9a-fA-F]{24}$/)) {
                        this.inputChanged(e);
                        break;
                    }
                    this.reset();
                    break;
                } else {
                    this.inputChanged(e);
                }
                break;
            case 'ArrowDown':
                this.selectNext();
                break;
            case 'ArrowUp':
                this.selectPrev();
                break;
            case 'Enter':
                e.stopPropagation();
                e.preventDefault();
                if (this.state.options.length > 0) {
                    this.selectCurrent();
                } else if (this.props.allowFreeInput) {
                    this.applyFreeInput();
                } else {
                    this.props.onEnter({event: e});
                }
                break;
            case 'Escape':
                this.onBlur();
                break;
            case 'Tab':
            case 'ArrowLeft':
            case 'ArrowRight':
                break;
            default:
                this.inputChanged(e);
                break;
        }
    }

    onBlur() {
        if (this.preventBlur) {
            return;
        }

        if (!this.props.allowFreeInput) {
            const state = {options: []};
            if (!_.get(this.props, 'value')) {
                state['query'] = '';
                state['selectedOption'] = -1;
            }
            this.setState(state, this.validate);
        }

        if (this.props.allowFreeInput) {
            this.applyFreeInput();
        }
    }

    applyFreeInput() {
        if (!this.state.selectedData && !(this.state.query === '' && this.state.preview !== '')) {
            this.props.onChange(this.state.query);
            setTimeout(this.validate, 10);
        }
    }

    selectItem(item) {
        this.preventBlur = true;
        this.setState({
            selectedOption: -1,
            query: '',
            options: [],
            preview: this.renderPreview(item),
            selectedData: item
        }, () => {
            this.props.onChange(this.props.useDataAsValue ? item : item[this.props.valueAttr]);
            setTimeout(this.validate, 10);
            this.preventBlur = false;
        });
    }

    selectNext() {
        if (!this.state.options.length) {
            return;
        }

        let selected = this.state.selectedOption + 1;
        if (selected >= this.state.options.length) {
            selected = this.state.options.length - 1;
        }

        this.setState({
            selectedOption: selected,
            preview: this.renderPreview(this.state.options[selected])
        });
    }

    selectPrev() {
        if (!this.state.options.length) {
            return;
        }

        let selected = this.state.options.length - 1;
        if (this.state.selectedOption <= selected) {
            selected = this.state.selectedOption - 1;
        }

        if (selected < 0) {
            selected = 0;
        }

        this.setState({
            selectedOption: selected,
            preview: this.renderPreview(this.state.options[selected])
        });
    }

    selectCurrent() {
        if (!this.state.options.length) {
            return;
        }

        if (this.state.selectedOption === -1) {
            return;
        }

        const current = this.state.options[this.state.selectedOption];
        this.selectItem(current);
    }

    reset() {
        this.setState({
            selectedOption: -1,
            query: '',
            preview: '',
            options: [],
            selectedData: null
        }, () => {
            this.props.onChange(null);
            this.props.onReset();
        });
    }

    fetchValue({data: item}) {
        let value = _.get(item, this.props.textAttr);
        if (DEVELOPMENT) {
            if (!value) {
                if (!this.warned) {
                    console.warn(`Warning: Item attribute '${this.props.textAttr}' was not found in the results of '${this.props.name}'
                component.\nMissing or misspelled 'fields' parameter?`);
                    this.warned = true;
                }
                value = item.id;
            }
        }
        return value;
    }

    renderPreview(item) {
        if (!item) {
            return null;
        }
        return this.props.selectedRenderer.call(this, {option: {data: item}});
    }
}

Search.defaultProps = Webiny.Ui.FormComponent.extendProps({
    searchOperator: 'or',
    valueAttr: 'id',
    textAttr: 'name',
    minQueryLength: 2,
    onEnter: _.noop,
    onChange: _.noop,
    onReset: _.noop,
    onLoadOptions: _.noop,
    inputIcon: 'icon-search',
    loadingIcon: 'icon-search',
    placeholder: Webiny.I18n('Type to search'),
    useDataAsValue: false,
    allowFreeInput: false,
    optionRenderer({option}) {
        const value = this.fetchValue(option);
        const content = {__html: value.replace(/\s+/g, '&nbsp;')};
        return <div dangerouslySetInnerHTML={content}/>;
    },
    selectedRenderer({option}) {
        return this.fetchValue(option);
    },
    renderOption({item, index}) {
        const {styles} = this.props;
        const itemClasses = {
            [styles.selected]: index === this.state.selectedOption
        };

        const linkProps = {
            onMouseDown: () => this.selectItem(item),
            onMouseOver: () => this.setState({selectedOption: index, preview: this.renderPreview(item)})
        };

        return (
            <li key={index} className={this.classSet(itemClasses)} {...linkProps}>
                <a href="javascript:void(0)">
                    {this.props.optionRenderer.call(this, {option: {data: item}})}
                </a>
            </li>
        );
    },
    renderSearchInput() {
        const inputProps = {
            type: 'text',
            readOnly: this.props.readOnly || false,
            placeholder: this.getPlaceholder(),
            autoComplete: 'off',
            spellCheck: 'false',
            dir: 'auto',
            onKeyDown: this.onKeyUp,
            onBlur: this.onBlur,
            value: this.state.query || this.state.preview || '',
            onChange: this.inputChanged,
            disabled: this.isDisabled()
        };

        // Render option
        const options = this.state.options.map((item, index) => this.props.renderOption.call(this, {item, index}));

        let dropdownMenu = null;
        const {styles} = this.props;
        if (this.state.options.length > 0) {
            dropdownMenu = (
                <div className={styles.autosuggest}>
                    <div className={styles.plainSearch}>
                        <ul>{options}</ul>
                    </div>
                </div>
            );
        }

        // Create search input
        const {Link, Icon} = this.props;
        return (
            <div className={styles.search}>
                <Link className={styles.btn}>
                    <Icon className={styles.icon} icon={this.props.loading ? this.props.loadingIcon : this.props.inputIcon}/>
                </Link>
                <input {...inputProps}/>
                {dropdownMenu}
            </div>
        );
    },
    renderer() {
        const {FormGroup} = this.props;

        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.renderLabel()}
                {this.renderInfo()}

                <div className="inputGroup">
                    {this.props.renderSearchInput.call(this, {$this: this})}
                </div>
                {this.renderDescription()}
                {this.renderValidationMessage()}
            </FormGroup>
        );
    }
});

export default Webiny.createComponent(Search, {modules: ['Link', 'Icon', 'FormGroup'], styles});