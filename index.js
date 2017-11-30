/* eslint-env node */
'use strict';
var fastbootTransform = require('fastboot-transform');

module.exports = {
  name: 'ember-pikaday',
  options: {
    nodeAssets: {
      'pikaday-time': {
        vendor: ['pikaday.js', 'css/pikaday.css'],
        processTree(input) {
          return fastbootTransform(input);
        }
      }
    }
  },
  included() {
    this._super.included.apply(this, arguments);

    this.import('vendor/pikaday-time/pikaday.js');
    this.import('vendor/pikaday-time/css/pikaday.css');
  }
};
