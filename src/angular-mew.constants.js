(function (hawkLib) {
    'use strict';
    var algorithms = ['sha256'];
    /* istanbul ignore else */
    if (typeof hawkLib === 'object' && hawkLib.hasOwnProperty('crypto')){
        algorithms = hawkLib.crypto.algorithms;
    }
    angular
        .module('angular-mew')
        .constant('Hawk', hawkLib)
        .constant('HawkAlgorithms', algorithms)
        .constant('HawkErrors', {
            ALGORITHM: "Unsupported algorithm, please use the 'HawkAlgorithms' constant to get a valid algorithm.",
            MISSING_CREDENTIALS: "Hawk authentication is enabled but credentials are missing.",
            MISSING_ALGORITHM: "Hawk authentication is enabled but algorithm is missing.",
            HEADER_GENERATION: "Hawk header generation failed",
            RESPONSE_VALIDATION: "Hawk server response validation failed",
            HAWK_UNAVAILABLE: "Hawk library isn't available",
            HAWK_AUTHENTICATION_REQUIRED: "Hawk authentication is required for the given url"
        });

})(hawk);