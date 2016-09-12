describe("angular-mew", function(){
    beforeEach(module('angular-mew'));

    it("should contain an Hawk constant that is the authentication library with all the required properties", inject(function(Hawk){
        expect(Hawk).toBeDefined();
        expect(Hawk.hasOwnProperty('client')).toBe(true);
        expect(Hawk.client.hasOwnProperty('header')).toBe(true);
        expect(typeof Hawk.client.header).toEqual("function");
        expect(Hawk.client.hasOwnProperty('authenticate')).toBe(true);
        expect(typeof Hawk.client.authenticate).toEqual("function");
        expect(Hawk.hasOwnProperty('crypto')).toBe(true);
        expect(Hawk.crypto.hasOwnProperty('algorithms')).toBe(true);
        expect(typeof Hawk.crypto.algorithms).toEqual("object");
        expect(Array.isArray(Hawk.crypto.algorithms)).toBe(true);
    }));
    it("should contain an algorithm constant containing all of Hawk's algorithms", inject(function(HawkAlgorithms){
        var cryptoAlgorithms = hawk.crypto.algorithms;
        expect(HawkAlgorithms).toBeDefined();
        expect(HawkAlgorithms.length).toEqual(cryptoAlgorithms.length);
        for(var i=0; i<cryptoAlgorithms.length;i++){
            expect(cryptoAlgorithms[i]).toEqual(HawkAlgorithms[i]);
        }
    }));
    it("should contain an error constant containing all of the possible rejection or errors", inject(function(HawkErrors){
        var possibleErrors = [
            'ALGORITHM',
            'MISSING_CREDENTIALS',
            'MISSING_ALGORITHM',
            'HEADER_GENERATION',
            'RESPONSE_VALIDATION',
            'HAWK_UNAVAILABLE',
            'HAWK_AUTHENTICATION_REQUIRED'
        ];
        expect(HawkErrors).toBeDefined();
        expect(Object.getOwnPropertyNames(HawkErrors).sort()).toEqual(possibleErrors.sort());
    }));
});