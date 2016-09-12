describe("HawkInterceptor", function(){
    var HawkInterceptor;
    var localHttpProvider;
    var HawkErrors;
    
    beforeEach(module('angular-mew', function ($httpProvider) {
        localHttpProvider = $httpProvider;
    }));
    
    beforeEach(inject(function (_HawkInterceptor_, _HawkErrors_) {
        HawkInterceptor = _HawkInterceptor_;
        HawkErrors = _HawkErrors_;
    }));
    
    it('should be defined', function () {
        expect(HawkInterceptor).toBeDefined();
    });

    it("should be registered as an http interceptor", function () {
        expect(localHttpProvider.interceptors).toContain('HawkInterceptor');
    });
    
    it("should contain 3 functions ('request', 'response', 'responseError')'", function () {
        var possibleFunctions = [
            'request',
            'response',
            'responseError'
        ];
        expect(Object.getOwnPropertyNames(HawkInterceptor).sort()).toEqual(possibleFunctions.sort());
    });
    
    describe("request", function () {
        var HawkConfiguration;
        var defaultConfig = {
            method: 'GET',
            url: 'http://www.some-url.com/test',
            headers: {}
        };
        var $httpBackend;
        var $http;
        var $rootScope;
        var $q;
        var $location;

        function cloneObject(object){
            return JSON.parse(JSON.stringify(object));
        }

        beforeEach(inject(function (_HawkConfiguration_, _$httpBackend_, _$http_, _$rootScope_, _$q_, _$location_) {
            HawkConfiguration = _HawkConfiguration_;
            $httpBackend = _$httpBackend_;
            $http = _$http_;
            $rootScope = _$rootScope_;
            $q = _$q_;
            $location = _$location_;
        }));

        it("should be called when send an http request", function () {
            spyOn(HawkInterceptor, 'request').and.callThrough();
            $http(cloneObject(defaultConfig));
            $httpBackend.expectGET(defaultConfig.url).respond(200, {});
            $httpBackend.flush();
            expect(HawkInterceptor.request).toHaveBeenCalled();
        });

        describe("using HawkConfiguration", function(){

            it("should keep the config object intact if the interceptor is disabled", function () {
                HawkConfiguration.setEnabled(false);
                var interceptedConfig = HawkInterceptor.request(cloneObject(defaultConfig));
                expect(interceptedConfig).toEqual(defaultConfig);
            });

            it("should reject the request when no credentials are set", function () {
                HawkConfiguration.setEnabled(true);
                var interceptedConfig = $q.when(HawkInterceptor.request(cloneObject(defaultConfig)));
                interceptedConfig
                    .then(function () {
                        //we should not get here!
                        expect(true).toBe(false);
                    })
                    .catch(function (reason) {
                        expect(reason.reason).toBe(HawkErrors.MISSING_CREDENTIALS);
                    });
                $rootScope.$apply();
            });

            it("should reject the request when no credentials are set", function () {
                HawkConfiguration.setEnabled(true);
                var interceptedConfig = $q.when(HawkInterceptor.request(cloneObject(defaultConfig)));
                interceptedConfig
                    .then(function () {
                        //we should not get here!
                        expect(true).toBe(false);
                    })
                    .catch(function (reason) {
                        expect(reason.reason).toBe(HawkErrors.MISSING_CREDENTIALS);
                    });
                $rootScope.$apply();
            });

            it("should reject the request when no header can be generated", function () {
                HawkConfiguration.setEnabled(true);
                HawkConfiguration.setCredentials('dummyID', 'dummySecret');
                var config = cloneObject(defaultConfig);
                config.url = 666;
                var interceptedConfig = $q.when(HawkInterceptor.request(config));
                interceptedConfig
                    .then(function () {
                        //we should not get here!
                        expect(true).toBe(false);
                    })
                    .catch(function (reason) {
                        expect(reason.reason).toContain(HawkErrors.HEADER_GENERATION);
                    });
                $rootScope.$apply();
            });

            it("should add an Authorization header to the config if enabled", function () {
                HawkConfiguration.setEnabled(true);
                HawkConfiguration.setCredentials('dummyID', 'dummySecret');
                var interceptedConfig = $q.when(HawkInterceptor.request(defaultConfig));
                interceptedConfig
                    .then(function (config) {
                        expect(config.headers.hasOwnProperty('Authorization')).toBe(true);
                        expect(config.headers.Authorization.substr(0,17)).toEqual('Hawk id="dummyID"');
                    })
                    .catch(function () {
                        //we should not get here!
                        expect(true).toBe(false);
                    });
                $rootScope.$apply();
            });

            it("should extend the url to a fully qualified url (with port) when only the path is given", function () {
                spyOn($location, 'host').and.returnValue('www.example.com');
                spyOn($location, 'port').and.returnValue(8080);
                spyOn($location, 'protocol').and.returnValue('http');
                HawkConfiguration.setEnabled(true);
                HawkConfiguration.setCredentials('dummyID', 'dummySecret');
                var config = cloneObject(defaultConfig);
                config.url = '/test/path';
                var interceptedConfig = $q.when(HawkInterceptor.request(config));
                interceptedConfig
                    .then(function (config) {
                        // console.log(config);
                        expect(config.url).toEqual('http://www.example.com:8080/test/path');
                    })
                    .catch(function () {
                        //we should not get here!
                        expect(true).toBe(false);
                    });
                $rootScope.$apply();
                $location.port.and.returnValue(80);
                config = cloneObject(defaultConfig);
                config.url = '/test/path';
                interceptedConfig = $q.when(HawkInterceptor.request(config));
                interceptedConfig
                    .then(function (config) {
                        // console.log(config);
                        expect(config.url).toEqual('http://www.example.com/test/path');
                    })
                    .catch(function () {
                        //we should not get here!
                        expect(true).toBe(false);
                    });
                $rootScope.$apply();
            });

            it("should add an hawk object on the config containing validation artifacts", function () {
                HawkConfiguration.setEnabled(true);
                HawkConfiguration.setCredentials('dummyID', 'dummySecret');
                var interceptedConfig = $q.when(HawkInterceptor.request(defaultConfig));
                interceptedConfig
                    .then(function (config) {
                        expect(config.hasOwnProperty('hawk')).toBe(true);
                        expect(config.hawk.hasOwnProperty('artifacts')).toBe(true);

                    })
                    .catch(function () {
                        //we should not get here!
                        expect(true).toBe(false);
                    });
                $rootScope.$apply();
            });
        });

        describe("using custom configuration", function(){

            it("should keep the config object intact if we disable the interceptor using config even if it is enabled in HawkConfiguration", function () {
                var customConfig = cloneObject(defaultConfig);
                customConfig.hawk = {
                    enabled: false
                };
                HawkConfiguration.setEnabled(true);
                var interceptedConfig = HawkInterceptor.request(cloneObject(customConfig));
                expect(interceptedConfig).toEqual(customConfig);
            });

            it("should reject the request when no credentials are passed in the config", function () {
                var customConfig = cloneObject(defaultConfig);
                customConfig.hawk = {
                    enabled: true
                };
                HawkConfiguration.setEnabled(false);
                var customInterceptedConfig = $q.when(HawkInterceptor.request(customConfig));
                customInterceptedConfig
                    .then(function () {
                        //we should not get here!
                        expect(true).toBe(false);
                    })
                    .catch(function (reason) {
                        expect(reason.reason).toBe(HawkErrors.MISSING_CREDENTIALS);
                    });
                $rootScope.$apply();
            });
            it("should throw an error when a invalid algorithm is passed in the config", function () {
                var customConfig = cloneObject(defaultConfig);
                customConfig.hawk = {
                    enabled: true,
                    credentials: {
                        key: 'dummyKey',
                        id: 'dummyID'
                    },
                    algorithm: null
                };
                HawkConfiguration.setEnabled(false);
                expect(function(){HawkInterceptor.request(customConfig)}).toThrow(HawkErrors.ALGORITHM);
            });
            it("should use the custom config variables passed in the header generation", function () {
                HawkConfiguration.setCredentials('dummyID', 'dummySecret');
                HawkConfiguration.setAlgorithm("sha256");
                var customConfig = cloneObject(defaultConfig);
                customConfig.hawk = {
                    enabled: true,
                    credentials: {
                        key: 'customKey',
                        id: 'customId'
                    },
                    algorithm: 'sha1'
                };
                var interceptedConfig = $q.when(HawkInterceptor.request(customConfig));
                interceptedConfig
                    .then(function (config) {
                        expect(config.headers.hasOwnProperty('Authorization')).toBe(true);
                        expect(config.headers.Authorization.substr(0,18)).toEqual('Hawk id="customId"');
                    })
                    .catch(function () {
                        //we should not get here!
                        expect(true).toBe(false);
                    });
                $rootScope.$apply();
            });
        });
    });

    describe("response", function () {
        var HawkConfiguration;
        var Hawk;
        var defaultConfig = {
            method: 'GET',
            url: 'http://www.some-url.com/test',
            headers: {}
        };
        var $httpBackend;
        var $http;
        var $rootScope;
        var $q;

        function cloneObject(object){
            return JSON.parse(JSON.stringify(object));
        }

        beforeEach(inject(function (_HawkConfiguration_, _Hawk_, _$httpBackend_, _$http_, _$rootScope_, _$q_) {
            HawkConfiguration = _HawkConfiguration_;
            Hawk = _Hawk_;
            $httpBackend = _$httpBackend_;
            $http = _$http_;
            $rootScope = _$rootScope_;
            $q = _$q_;
        }));

        it("should be called when a response is send on a http request", function () {
            spyOn(HawkInterceptor, 'response').and.callThrough();
            $http(defaultConfig);
            $httpBackend.expectGET(defaultConfig.url).respond(200, {});
            $httpBackend.flush();
            expect(HawkInterceptor.response).toHaveBeenCalled();
        });

        it("should just return the response if the library is disabled", function () {
            HawkConfiguration.setEnabled(false);
            var dummyResponse = {
                a: 'bb',
                config: {}
            };
            var interceptedResponse = HawkInterceptor.response(cloneObject(dummyResponse));
            expect(interceptedResponse).toEqual(dummyResponse);
            dummyResponse.config.hawk = {
                test: 'test'
            };
            interceptedResponse = HawkInterceptor.response(cloneObject(dummyResponse));
            expect(interceptedResponse).toEqual(dummyResponse);

        });

        it("should just return the response if the library is enabled, but server checking is disabled", function () {
            HawkConfiguration.setEnabled(true);
            HawkConfiguration.setCheckServerAuthorization(false);
            var dummyResponse = {
                a: 'bb',
                config: {}
            };
            var interceptedResponse = HawkInterceptor.response(cloneObject(dummyResponse));
            expect(interceptedResponse).toEqual(dummyResponse);
        });

        it("should just return the response if the library is enabled, server checking is enabled, but disabled using the config", function () {
            HawkConfiguration.setEnabled(true);
            HawkConfiguration.setCheckServerAuthorization(true);
            var dummyResponse = {
                a: 'bb',
                config: {
                    hawk: {
                        checkServerAuthorization: false
                    }
                }
            };
            var interceptedResponse = HawkInterceptor.response(cloneObject(dummyResponse));
            expect(interceptedResponse).toEqual(dummyResponse);
        });

        describe("server validation", function () {
            var defaultResponse = {
                __testAttributes: {},
                config: defaultConfig,
            };
            var credentials = {
                key: 'dummyKey',
                id: 'dummyId',
                algorithm: 'sha256'
            };

            beforeEach(function () {
                HawkConfiguration.setEnabled(true);
                HawkConfiguration.setCheckServerAuthorization(true);
                HawkConfiguration.setAlgorithm(credentials.algorithm);
                HawkConfiguration.setCredentials(credentials.id,credentials.key);
            });

            function extendResponseWithHawkProperties(response, payload, contentType) {
                var clientHeader = Hawk.client.header(response.config.url, response.config.method, {credentials: credentials});
                response.config.headers.Authorization = clientHeader.field;
                response.config.hawk = {
                    artifacts: clientHeader.artifacts
                };
                var serverArtifact = angular.extend(clientHeader.artifacts, {id: credentials.id});

                if(typeof payload !== 'undefined') {
                    serverArtifact.hash = Hawk.crypto.calculatePayloadHash(payload, credentials.algorithm, contentType);
                }
                var mac = Hawk.crypto.calculateMac('response', credentials, serverArtifact);
                var serverAuthenticationHeader = 'Hawk mac="' + mac + '"' +
                    (serverArtifact.hash ? ', hash="' + serverArtifact.hash + '"' : '');
                response.__testAttributes['Server-Authorization'] = serverAuthenticationHeader;
                response.headers = function (header) {
                    if (header.toLowerCase() === 'Server-Authorization'.toLowerCase()) {
                        return serverAuthenticationHeader;
                    }
                }
            }

            it("should not fail to validate the server response when the library is enabled and server checking is enabled", function () {
                var myResp = angular.extend(defaultResponse, {});
                extendResponseWithHawkProperties(myResp);
                var interceptedResponse = $q.when(HawkInterceptor.response(myResp));
                interceptedResponse
                    .catch(function (error) {
                        //we should not get here!
                        expect(true).toBe(false);
                    });
                $rootScope.$apply();
            });
            it("should reject the response when the mac from the server is not validated.", function () {
                var myResp = angular.extend(defaultResponse, {});
                extendResponseWithHawkProperties(myResp);
                myResp.headers = function (header) {
                    if (header.toLowerCase() === 'Server-Authorization'.toLowerCase()) {
                        return 'Hawk mac="invalid header"';
                    }
                };
                var interceptedResponse = $q.when(HawkInterceptor.response(myResp));
                interceptedResponse
                    .then(function () {
                        //we should not get here!
                        expect(true).toBe(false);
                    })
                    .catch(function (error) {
                        expect(error.reason).toEqual(HawkErrors.RESPONSE_VALIDATION);
                    });
                $rootScope.$apply();
            });

            it("should reject the response when the response payload is changed.", function () {
                var myResp = angular.extend(defaultResponse, {});
                myResp.data = JSON.stringify({
                    dummyData: 'test'
                });
                extendResponseWithHawkProperties(myResp, myResp.data, 'application/json');
                var defaultHeaders = myResp.headers;
                myResp.headers = function (header) {
                    if(header.toLowerCase() === 'Content-Type'.toLowerCase()) {
                        return 'application/json';
                    }else {
                        return defaultHeaders(header);
                    }
                };
                myResp.data += "altered response";
                var interceptedResponse = $q.when(HawkInterceptor.response(myResp));
                interceptedResponse
                    .then(function () {
                        //we should not get here!
                        expect(true).toBe(false);
                    })
                    .catch(function (error) {
                        expect(error.reason).toEqual(HawkErrors.RESPONSE_VALIDATION);
                    });
                $rootScope.$apply();
            });
        });
    });
    describe("responseError", function () {
        var HawkConfiguration;
        var Hawk;
        var defaultConfig = {
            method: 'GET',
            url: 'http://www.some-url.com/test',
            headers: {}
        };
        var $httpBackend;
        var $http;
        var $rootScope;
        var $q;

        function cloneObject(object){
            return JSON.parse(JSON.stringify(object));
        }

        beforeEach(inject(function (_HawkConfiguration_, _Hawk_, _$httpBackend_, _$http_, _$rootScope_, _$q_) {
            HawkConfiguration = _HawkConfiguration_;
            Hawk = _Hawk_;
            $httpBackend = _$httpBackend_;
            $http = _$http_;
            $rootScope = _$rootScope_;
            $q = _$q_;
        }));

        it("should be called when the http request failed", function () {
            spyOn(HawkInterceptor, 'responseError').and.callThrough();
            $http(defaultConfig);
            $httpBackend.expectGET(defaultConfig.url).respond(401, {});
            $httpBackend.flush();
            expect(HawkInterceptor.responseError).toHaveBeenCalled();
        });

        it("should return the original response if the status code is not 401", function () {
            var response = {
                status: 403,
                headers: function (field) {
                    return "";
                }
            };
            expect(HawkInterceptor.responseError(response)).toEqual(response);
        });

        it("should return the original response if the status code is 401 but the 'WWW-Authenticate' header is not set", function () {
            var response = {
                status: 401,
                headers: function (field) {
                    if (field === 'WWW-Authenticate'){
                        return null;
                    }
                    return "";
                }
            };
            expect(HawkInterceptor.responseError(response)).toEqual(response);
        });

        it("should return the original response if the status code is 401 but the 'WWW-Authenticate' header is not set to 'Hawk'", function () {
            var response = {
                status: 401,
                headers: function (field) {
                    if (field === 'WWW-Authenticate'){
                        return 'notHawk';
                    }
                    return "";
                }
            };
            expect(HawkInterceptor.responseError(response)).toEqual(response);
        });

        it("should return a rejected promise when the status code is 401 and the 'WWW-Authenticate' header is set to 'Hawk'", function () {
            var response = {
                status: 401,
                headers: function (field) {
                    if (field === 'WWW-Authenticate'){
                        return 'Hawk';
                    }
                    return "";
                }
            };
            var interceptedResponse = HawkInterceptor.responseError(response);
            interceptedResponse
                .then(function () {
                    //we should not get here!
                    expect(true).toBe(false);
                })
                .catch(function (error) {
                    expect(error.reason).toEqual(HawkErrors.HAWK_AUTHENTICATION_REQUIRED);
                });
            $rootScope.$apply();
        });
    });
});