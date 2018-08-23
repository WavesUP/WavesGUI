(function () {
    'use strict';

    /**
     * @return {Queue}
     */
    const factory = function () {

        class SimpleQueue {

            get length() {
                return this._list.length;
            }

            get list() {
                return this._list.slice();
            }

            /**
             * @param {IQueueOptions} options
             */
            constructor(options) {
                /**
                 * @type {number}
                 * @private
                 */
                this._queueLimit = options.queueLimit;
                /**
                 * @type {Array<*>}
                 * @private
                 */
                this._list = [];
            }

            /**
             * @param {*} item
             */
            push(item) {
                if (this.length === this._queueLimit) {
                    this._list.shift();
                }
                this._list.push(item);
            }

            pop() {
                return this._list.pop();
            }

            clear() {
                this._list = [];
            }

        }

        return SimpleQueue;
    };

    angular.module('app').factory('SimpleQueue', factory);
})();

/**
 * @typedef {object} IQueueOptions
 * @property {number} queueLimit
 */

/**
 * @typedef {object} ISimpleQueueItem
 * @property {Promise} promise
 * @property {string} id
 */
