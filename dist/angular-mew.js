/*!
 * angular-mew v0.1.2 - An angular wrapper for the Hawk HTTP authentication scheme
 * Copyright Maarten Schroeven and other contributors
 * https://github.com/Sonaryr/angular-mew
 * Released under the MIT license
 */
(function () {
    'use strict';
    angular
        .module('angular-mew', []);
})();
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
(function(){
    'use strict';
    angular
        .module('angular-mew')
        .factory('HawkConfiguration', hawkConfiguration);

    hawkConfiguration.$inject = ['HawkAlgorithms', 'HawkErrors'];

    function hawkConfiguration(HawkAlgorithms, HawkErrors) {
        var settings = {
            algorithm: HawkAlgorithms[0],
            credentials: {
                id: undefined,
                secret: undefined
            },
            enabled: false,
            checkServerAuthorization: true
        };

        return {
            setEnabled: setEnabled,
            setAlgorithm: setAlgorithm,
            setCredentials: setCredentials,
            setCheckServerAuthorization: setCheckServerAuthorization,
            getSettings: function(){
                //return a copy form the settings so they can not be altered this way
                return JSON.parse(JSON.stringify(settings));
            }
        };

        function setCredentials(id, secret){
            settings.credentials.id = id;
            settings.credentials.secret = secret;
        }

        function setAlgorithm(algorithm) {
            if(HawkAlgorithms.indexOf(algorithm) == -1){
                throw HawkErrors.ALGORITHM;
            }
            settings.algorithm = algorithm;
        }

        function setEnabled(enabled) {
            settings.enabled = enabled;
        }

        function setCheckServerAuthorization(check) {
            settings.checkServerAuthorization = check;
        }
    }

})();
(function () {
    'use strict';
    angular
        .module('angular-mew')
        .factory('HawkInterceptor', hawkInterceptor);

    hawkInterceptor.$inject = ['$location', '$log', '$q', 'Hawk', 'HawkAlgorithms', 'HawkConfiguration', 'HawkErrors'];

    function hawkInterceptor($location, $log, $q, Hawk, HawkAlgorithms, HawkConfiguration, HawkErrors) {
        return {
            'request': request,
            'response': response,
            'responseError': responseError
        };

        function getCredentials(config) {
            var hawkSettings = HawkConfiguration.getSettings();
            var credentials = {
                key: hawkSettings.credentials.secret,
                id: hawkSettings.credentials.id,
                algorithm: hawkSettings.algorithm
            };

            if (typeof config.hawk.credentials !== "undefined") {
                credentials.key = config.hawk.credentials.key;
                credentials.id = config.hawk.credentials.id;
            }

            if (typeof config.hawk.algorithm !== "undefined") {
                if (HawkAlgorithms.indexOf(config.hawk.algorithm) == -1) {
                    throw HawkErrors.ALGORITHM;
                }
                credentials.algorithm = config.hawk.algorithm;
            }

            return credentials;
        }

        function isDisabled(config) {
            var hawkSettings = HawkConfiguration.getSettings();
            var isDisabledViaConfig = typeof config.hawk.enabled !== "undefined" && !config.hawk.enabled;
            if (!hawkSettings.enabled) {
                if (typeof config.hawk.enabled === "undefined" || isDisabledViaConfig) {
                    return true;
                }
            }else if(isDisabledViaConfig) {
                return true;
            }
            return false
        }

        function request(config) {
            var addedHawkConfig = false;
            if(typeof config.hawk === "undefined"){
                config.hawk = {};
                addedHawkConfig = true;
            }
            if(isDisabled(config)) {
                if (addedHawkConfig){
                    delete config.hawk;
                }
                return config;
            }

            $log.debug('intercepting http request');
            var hawkOptions = {
                credentials: getCredentials(config)
            };
            if (hawkOptions.credentials.key == null || hawkOptions.credentials.id == null) {
                return $q.reject({
                    reason: HawkErrors.MISSING_CREDENTIALS,
                    config: config
                });
            }

            if(typeof config.url === 'string' && !config.url.match(Hawk.utils.uriRegex)){
                var prefix = $location.protocol()+'://';
                prefix += $location.host();
                var port = $location.port();
                if(port !== 80) {
                    prefix += ':'+port;
                }
                config.url = prefix + config.url;
            }

            var header = Hawk.client.header(config.url, config.method, hawkOptions);
            if (typeof header.err !== "undefined") {
                return $q.reject({
                    reason: HawkErrors.HEADER_GENERATION + ": \"" + header.err + "\"",
                    config: config
                });
            }
            config.headers.Authorization = header.field;
            config.hawk.artifacts = header.artifacts;
            return config;
        }

        function responseError(response) {
            var status = response.status;
            var header = response.headers('WWW-Authenticate');
            if (status == 401 && typeof header !== 'undefined' && header === 'Hawk') {
                return $q.reject({
                    reason: HawkErrors.HAWK_AUTHENTICATION_REQUIRED,
                    response: response
                });
            }
            return response;
        }

        function response(response) {
            var addedHawkConfig = false;
            if(typeof response.config.hawk === "undefined"){
                response.config.hawk = {};
                addedHawkConfig = true;
            }
            var hawkSettings = HawkConfiguration.getSettings();

            if(response.config.hawk.hasOwnProperty('checkServerAuthorization')){
                hawkSettings.checkServerAuthorization = response.config.hawk.checkServerAuthorization;
            }

            if (isDisabled(response.config) || !hawkSettings.checkServerAuthorization) {
                if (addedHawkConfig){
                    delete response.config.hawk;
                }
                return response;
            }
            $log.debug('intercepting http response');
            // Add getResponseHeader as an alternative for the headers function (Hawk uses this function)
            response.getResponseHeader = response.headers;
            var options = {};
            var header = response.headers('Server-Authorization');
            if (typeof response.data !== 'undefined' && header.indexOf('hash="')> -1){
                options.payload = response.data;
            }
            var isValid = Hawk.client.authenticate(response, getCredentials(response.config), response.config.hawk.artifacts, options);
            if (!isValid) {
                return $q.reject({
                    reason: HawkErrors.RESPONSE_VALIDATION,
                    response: response
                });
            }
            return response;
        }
    }
})();
(function () {
    'use strict';

    angular
        .module('angular-mew')
        .config(configuration);

    configuration.$inject = ['$httpProvider'];
    function configuration ($httpProvider){
        $httpProvider.interceptors.push('HawkInterceptor');
    }
})();
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