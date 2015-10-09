// cities.controller.js
app.controller('CitiesController', ['$scope', '$q', '$http', 'FlickrUrl', 'AirbnbUrl', 'Pages', 'DateFormatter', 'NextIndex', 'NumberRentals', '$timeout', 'AirbnbListing', function($scope, $q, $http, FlickrUrl, AirbnbUrl, Pages, DateFormatter, NextIndex, NumberRentals, $timeout, AirbnbListing) {

    // Variables

    $scope.clearAllVariables = function() {

        $scope.cities = [];
        $scope.selectedCity = {};
        $scope.selectedCityPhoto = {};
        $scope.selectedCityPhotoAuthor = {};


        $scope.citySelected = 0;
        $scope.listingIndex = -1;
        $scope.listingDivString = '<div class="col-sm-12 row-space-2 col-md-6">';
        
        $scope.unformattedListings = [];
        $scope.listings = [];

        $scope.pages = 0;

        $scope.currentStep = 1;

        $scope.myParameters = {};

        $scope.airbnbResponse = "";
        $scope.airbnbRawListings = [];
        $scope.airbnbUnparsedListings = [];
        $scope.airbnbParsedListings = [];

        $scope.listingsProcessed = false;
    }


    $scope.isStep = function(i){
        if ($scope.currentStep == parseInt(i)){
            return true;
        }
        return false;
    }

    // Init
    $scope.init = function() {

        $scope.clearAllVariables();
        $scope.getCities().then(function() {
            console.log("Cities loaded");
        });

    }

    // STEP 1: Cities retriever

    $scope.getCities = function() {

        var deferred = $q.defer();

        var mCity = Parse.Object.extend("City");

        var CityClass = new mCity();

        var queryObject = new Parse.Query(CityClass);

        queryObject.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {

                    $scope.cities.push(results[i]);
                }
                $scope.cities.sort(function(a, b) {
                    var textA = a.get("Name");
                    var textB = b.get("Name");
                    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                });
                $scope.$apply();
                deferred.resolve();
                return deferred.promise;

            },
            error: function(error) {
                return deferred.reject();
            }
        });

        deferred.notify();
        return deferred.promise;
    }

    $scope.viewDashboard = function(){
        document.getElementById('iframe-container').innerHTML = '';
        $scope.currentStep = 3;
    }

    // City selected listener

    $scope.selectCity = function(city) {
        $scope.selectedCity = city;
        if (city.get("ImageUrl") == undefined) {
            $scope.citySelected = 1;
            $scope.callFlickrApi($scope.selectedCity.get("Name")).then(function() {
                
            });
        } 
    }

    $scope.unselectCity = function() {
        $scope.citySelected = 0;
        $scope.selectedCity = {};
        $scope.selectedCityPhoto = "";
        $scope.selectedCityPhotoAuthor = "";

    }

    $scope.callFlickrApi = function(city) {

        var deferred = $q.defer();

        var callUrl = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=9f7ed4ef9068e928902bb975a6b49e67&tags=" + city + "%2C+city&tag_mode=all&sort=relevance&format=json&nojsoncallback=1";

        console.log(callUrl);
        $http.get(callUrl).
        success(function(data, status, headers, config) {
            var myphoto = FlickrUrl.build(data);
            $scope.selectedCityPhoto = myphoto.photo;
            $scope.selectedCityPhotoAuthor = myphoto.author;
            deferred.resolve();
            return deferred.promise;
        }).
        error(function(data, status, headers, config) {
            return deferred.reject();
        });
        deferred.notify();
        return deferred.promise;
    }

    $scope.parameters = function(day1, day2, cityName, pageNumber) {
        this.day1 = day1;
        this.day2 = day2;
        this.cityName = cityName;
        this.pageNumber = pageNumber;
    }

    $scope.findMeABed = function() {

        var day1 = new moment();
        day1.add(1, 'days');

        var day2 = new moment();
        day2.add(8, 'days');

        $scope.myParameters = new $scope.parameters(day1, day2, $scope.selectedCity.get("Name"), 1);

        $scope.processAirbnbRentals($scope.myParameters);

    }

    $scope.processAirbnbRentals = function(){
        $scope.prepareIframe();
        $scope.myParameters.pageNumber = 1;
        $scope.connectToAirbnb($scope.myParameters).then(function(){
            var mynumber = Pages.calculate($scope.airbnbResponse, $scope.pages);
            $scope.pages = mynumber.pages;
            $scope.rentals = mynumber.rentals;
            
            $timeout($scope.processListings().then(function(){
                $scope.parseListings().then(function(){
                    $scope.listingsProcessed = true;
                });
            }), 1000);
        })

    }

    $scope.prepareIframe = function(){
        $scope.currentStep = 2;
        var iframeHtml = '<iframe class="p-t youtube" width="560" height="315" src="https://www.youtube.com/embed/8C5pONjuYAI" frameborder="0" allowfullscreen></iframe>';
        document.getElementById('iframe-container').innerHTML = iframeHtml;
    }

    $scope.connectToAirbnb = function(myParameters) {

        var deferred = $q.defer();

        var myUrl = AirbnbUrl.build($scope.myParameters);
        
        $.ajaxPrefilter(function(options) {
            if (options.crossDomain && jQuery.support.cors) {
                var http = (window.location.protocol === 'http:' ? 'http:' : 'https:');
                options.url = http + '//cors-anywhere.herokuapp.com/' + options.url;
                //options.url = http + '//allow-any-origin.appspot.com/' + options.url;
                //options.url = http + '//test-cors.appspot.com/';
            }
        });

        $.get(
            myUrl,
            function(response) {
                $scope.airbnbResponse = response;
                deferred.resolve();
                return deferred.promise;
            });
        deferred.notify();
        return deferred.promise;

    }

    $scope.parseAirbnbCode = function(doc, $q) {
        $scope.pages = Pages(doc, $scope.pages);
        $scope.parseListings(doc);

        if ($scope.pages > 1) {
            $scope.myParameters.pageNumber++;
            if ($scope.myParameters.pageNumber <= $scope.pages) {
                $scope.connectToAirbnb($scope.myParameters);
                $scope.myParameters.pageNumber++;
            }
        }
    }

    $scope.processListings = function(deferred) {

        if(!deferred){
        deferred = $q.defer();
        }

        $scope.connectToAirbnb($scope.myParameters).then(function(){
        console.log("Processing page: " + $scope.myParameters.pageNumber);
            if ($scope.myParameters.pageNumber <= $scope.pages){
                    $scope.airbnbRawListings.push($scope.airbnbResponse);
                    $scope.myParameters.pageNumber++;
                    $timeout($scope.processListings(deferred), 1000);
            } else {
                    console.log("Done");
                    deferred.resolve();
                    return deferred.promise;
            }
        });
        
        deferred.notify();
        return deferred.promise;

    }

    $scope.parseListings = function() {

        var deferred = $q.defer();

        for(var j=0;j<$scope.airbnbRawListings.length;j++){
            var doc = $scope.airbnbRawListings[j];
            var myindex = 0;
            var i = 1;
            var rest = NumberRentals.calculateRest($scope.rentals);
            var newelement = "";
            $scope.listingIndex = doc.indexOf('<div class="listings-container">');
            var a = null;
            while (i <= rest) {
                if (i == 1) {
                    a = AirbnbUrl.buildParserObject($scope.listingIndex, $scope.listingDivString, $scope.listingDivString);
                    
                } else if (i > 1 && i < rest) {
                    a = AirbnbUrl.buildParserObject(myindex, $scope.listingDivString, $scope.listingDivString);
                    
                } else if (i == rest) {
                    a = AirbnbUrl.buildParserObject(myindex, $scope.listingDivString, "Vacation Rentals");
                    
                }
                newelement = AirbnbUrl.getHTMLBlock(doc, a);
                myindex = myindex + newelement.length;
                $scope.airbnbUnparsedListings.push(newelement);
                i++;
            }
        }
        
        for(var j=0;j<$scope.airbnbUnparsedListings.length;j++){
            
            var a = $scope.airbnbUnparsedListings[j];

            var b = AirbnbListing.build(a);
            if (!$scope.isInListings(b.hosting)){
                if (b.name.length > 1){
                    $scope.airbnbParsedListings.push(b);
                    console.log(b.name, b.url);
                }
            }
            
            if (j == ($scope.airbnbUnparsedListings.length - 1)){
                console.log($scope.airbnbParsedListings.length);
                deferred.resolve();
                return deferred.promise;
            }
        }

    }

    $scope.isInListings = function(obj) {
        for (var i = 0; i < $scope.airbnbParsedListings.length; i++) {
            if ($scope.airbnbParsedListings[i].hosting === obj) {
                return true;
            }
        }
        return false;
    }
    

    // https://www.airbnb.com/s/London?checkin=10%2F25%2F2015&checkout=02%2F29%2F2016

}]);