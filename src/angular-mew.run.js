(function () {
    'use strict';
    angular
        .module('angular-mew')
        .run(run);

    run.$inject = ['Hawk', 'HawkErrors', 'HawkConfiguration'];
    function run(Hawk, HawkErrors, HawkConfiguration) {
        if (Hawk == null) {
            throw HawkErrors.HAWK_UNAVAILABLE;
        }
    }
})();