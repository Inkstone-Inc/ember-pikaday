/* globals Pikaday */
import Mixin from '@ember/object/mixin';

import { assign } from '@ember/polyfills';
import { isPresent } from '@ember/utils';
import { run } from '@ember/runloop';
import { getProperties, computed, get, set } from '@ember/object';
import moment from 'moment';

export default Mixin.create({

  _options: computed('options', 'i18n', {
    get() {
      let options = this._defaultOptions();

      if (isPresent(get(this, 'i18n'))) {
        if (isPresent(get(this, 'i18n').t)) {
          options.i18n = {
            previousMonth : get(this, 'i18n').t('previousMonth').toString(),
            nextMonth     : get(this, 'i18n').t('nextMonth').toString(),
            months        : get(this, 'i18n').t('months').toString().split(','),
            weekdays      : get(this, 'i18n').t('weekdays').toString().split(','),
            weekdaysShort : get(this, 'i18n').t('weekdaysShort').toString().split(',')
          };
        } else {
          options.i18n = get(this, 'i18n');
        }
      }
      if (isPresent(get(this, 'position'))) {
        options.position = get(this, 'position');
      }
      if (isPresent(get(this, 'reposition'))) {
        options.reposition = get(this, 'reposition');
      }

      assign(options, get(this, 'options') || {});
      return options;
    }
  }),

  _defaultOptions() {
    const firstDay = get(this, 'firstDay');

    return {
      field: get(this, 'field'),
      container: get(this, 'pikadayContainer'),
      bound: get(this, 'pikadayContainer') ? false : true,
      onOpen: run.bind(this, this.onPikadayOpen),
      onClose: run.bind(this, this.onPikadayClose),
      onSelect: run.bind(this, this.onPikadaySelect),
      onDraw: run.bind(this, this.onPikadayRedraw),
      firstDay: (typeof firstDay !== 'undefined') ? parseInt(firstDay, 10) : 1,
      format: get(this, 'format') || 'DD.MM.YYYY',
      yearRange: this.determineYearRange(),
      minDate: get(this, 'minDate') || null,
      maxDate: get(this, 'maxDate') || null,
      defaultDate: get(this, 'defaultDate') || null,
      setDefaultDate: !!get(this, 'defaultDate'),
      theme: get(this, 'theme') || null,

      // Options for the time picker
      // showTime: true,
      showMinutes: true,
      showSeconds: false,
      use24hour: false,
      incrementHourBy: 1,
      incrementMinuteBy: 1,
      incrementSecondBy: 1,
      autoClose: true,
      timeLabel: null, // optional string added to left of time select
      i18n: {
        previousMonth : 'Previous Month',
        nextMonth     : 'Next Month',
        months        : ['January','February','March','April','May','June','July','August','September','October','November','December'],
        weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
        weekdaysShort : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
        midnight      : 'Midnight',
        noon          : 'Noon'
      }
    };
  },

	/**
	 * When updating attrs, we need to reset some things in case they've changed.
	 * @public
	 * @memberOf {Mixins.Pikaday}
	 * @return {undefined}
	 */
  didUpdateAttrs() {
    run.later(() => {
      // Do not set or update anything when the component is destroying.
      if (get(this, 'isDestroying') || get(this, 'isDestroyed')) { return; }

      this.setMinDate();
      this.setMaxDate();
      this.setPikadayDate();

      if (get(this, 'options')) {
        this._updateOptions();
      }
    });
  },

  didRender() {
    this._super();
    this.autoHideOnDisabled();
  },

  setupPikaday() {
    let pikaday = new Pikaday(get(this, '_options'));

    if (get(this, 'defaultDate')) {
      set(this, 'value', get(this, 'defaultDate'));
    }

    set(this, 'pikaday', pikaday);
    this.setPikadayDate();
  },

  willDestroyElement() {
    this._super();
    get(this, 'pikaday').destroy();
  },

  setPikadayDate: function() {
    const format = 'YYYY-MM-DD';
    const value = get(this, 'value');

    if (!value) {
      get(this, 'pikaday').setDate(value, true);
    } else {
      const date = get(this, 'useUTC') ? moment(moment.utc(value).format(format), format).toDate() : value;

      get(this, 'pikaday').setDate(date, true);
    }
  },

  setMinDate: function() {
    const { pikaday, minDate, value } = getProperties(this, [ 'pikaday', 'minDate', 'value' ]);

    if (minDate) {
      minDate.setSeconds(0);
      run.later(() => {
        pikaday.setMinDate(minDate);
      });

      // If the current date is lower than minDate we set date to minDate
      run.schedule('sync', () => {
        if (value && moment(value, get(this, 'format')).isBefore(minDate, 'day')) {
          pikaday.setDate(minDate);
        }
      });
    }
  },

  setMaxDate: function() {
    const { pikaday, maxDate, value }  = getProperties(this, [ 'pikaday', 'maxDate', 'value' ]);

    if (maxDate) {
      maxDate.setSeconds(0);
      run.later(() => {
        pikaday.setMaxDate(maxDate);
      });

      // If the current date is greater than maxDate we set date to maxDate
      run.schedule('sync', () => {
        if (value > maxDate) {
          pikaday.setDate(maxDate);
        }
      });
    }
  },

  onOpen() {},
  onClose() {},
  onSelection() {},
  onDraw() {},

  onPikadaySelect: function() {
    this.userSelectedDate();
  },

  onPikadayRedraw: function() {
    get(this, 'onDraw')();
  },

  userSelectedDate: function() {
    var selectedDate = get(this, 'pikaday').getDate();

    if (get(this, 'useUTC')) {
      selectedDate = moment.utc([selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()]).toDate();
    }

    get(this, 'onSelection')(selectedDate);
  },

  determineYearRange: function() {
    var yearRange = get(this, 'yearRange');

    if (yearRange) {
      if (yearRange.indexOf(',') > -1) {
        var yearArray = yearRange.split(',');

        if (yearArray[1] === 'currentYear') {
          yearArray[1] = new Date().getFullYear();
        }

        return yearArray;
      } else {
        return yearRange;
      }
    } else {
      return 10;
    }
  },

  autoHideOnDisabled() {
    if (get(this, 'disabled') && get(this, 'pikaday')) {
      get(this, 'pikaday').hide();
    }
  },

  _updateOptions() {
    get(this, 'pikaday').config(get(this, '_options'));
  }
});
