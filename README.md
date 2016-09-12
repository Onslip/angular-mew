[![Build Status](https://travis-ci.org/Sonaryr/angular-mew.svg?branch=master)](https://travis-ci.org/Sonaryr/angular-mew)
[![npm version](https://badge.fury.io/js/angular-mew.svg)](https://badge.fury.io/js/angular-mew)
## About

An angular wrapper for the Hawk HTTP authentication scheme.


## Installation
To install use npm
```
npm install --save angular-mew
```
this will also install hawk, be sure to load `browser.js` from Hawk and `angular-mew.js` or `angular-mew.min.js` in your webpage.

## Example
To use the wrapper you must first include it as a dependecy of your app.
```
    angular.module('yourApp', ['angular-mew']);
```
### Enabeling the interceptor
By default the authentication interceptor is turned of, you can turn it on by using the `HawkConfiguration` service.

```
HawkConfiguration.setEnabled(true);
```
### Setting your id and key
```
HawkConfiguration.setCredentials("myId", "myKey");
```

### Switching algorithms
All the available algorithms are available in an angular constant `HawkAlgorithms`
```
HawkConfiguration.setAlgorithm(HawkAlgorithm[1]);
```

### Server validation
By default the responses from the server will be validated to make sure you are talking to the correct server. you can disable this with `HawkConfiguration`
```
HawkConfiguration.setCheckServerAuthorization(false);
```

### One time request override
You can also override some of these settings on a request basis by adding a `hawk` attribute to the request config
```
$http({
    method: 'GET',
    url: 'http://www.example.com/resource',
    hawk: {
        enabled: true,
        credentials: {
            key: 'myKey',
            id: 'myId'
        },
        algorithm: 'sha1',
        checkServerAuthorization: true
    }
});
```

All of there entries are optional

## Tests
There are tests written for every component of ther wrapper. You can run these via the command line with `npm run test` or `npm run coverage`. They will first build the wrapper and then run the tests against it.

## TODO
* Add `bewit` support
* (FUTURE) Port to angular2

## Version
### 0.2.0
Add `WWW-Authenticate` support
### 0.1.2
Make the server checking configurable via the config object
### 0.1.1
Added a first README draft.
### 0.1.0
Initial version.


## Contributors
if you are willing to contribute, please do so! If you make a pull request please also do make sure you still have a 100% test coverage on your changes.
## License

Licensed under MIT (see LICENSE)
