// cities.controller.js
app.controller('CitiesController', ['$scope', '$q', '$http', function($scope, $q, $http) {


    // Variables
    $scope.cities = [];
    $scope.selectedCity = {};
    $scope.selectedCityPhoto = {};
    
    $scope.citySelected = 0;
    $scope.listingIndex = -1;
    $scope.listingDivString = '<div class="col-sm-12 row-space-2 col-md-6">';

    $scope.unformattedListings = [];
    $scope.listings = [];

    $scope.pages = 0;

    $scope.myParameters = {};

    // Init
    $scope.init = function() {

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
                $scope.cities.sort(function(a,b){
                    var textA = a.get("Name");
                    var textB = b.get("Name");
                    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                });
                console.log("Hello?");
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

    // City selected listener

    $scope.selectCity = function(city) {
        $scope.selectedCity = city;
        console.log(city.get("ImageUrl"));
        if (city.get("ImageUrl") == undefined){
            $scope.callFlickrApi($scope.selectedCity.get("Name")).then(function() {
               $scope.citySelected = 1;
            });
        } else {
            $scope.selectedCityPhoto = city.get("ImageUrl");
            console.log($scope.selectedCityPhotoAuthor);
            $scope.selectedCityPhotoAuthor = city.get("ImageAuthor");
            $scope.citySelected = 1;
        }
        console.log($scope.selectedCity.get("Name"));
    }

    $scope.unselectCity = function(){
        $scope.citySelected = 0;
        $scope.selectedCity = {};
        $scope.selectedCityPhoto = "";
        $scope.selectedCityPhotoAuthor = "";

    }

    $scope.callFlickrApi = function(city){

        var deferred = $q.defer();

        var segment1 = "https://api.flickr.com/services/rest/?method=flickr.photos.search";
        var segment2 = "&api_key=";
        var apikey = "f90b4426c5fe479e6f26403b6f3780fc"
        var segment3 = "&tags=";
        var segment4 = "%2C+city%2C+view&tag_mode=all&sort=+relevance&format=json&nojsoncallback=1";

        var callUrl = segment1 + segment2 + apikey + segment3 + city + segment4;
        $http.get(callUrl).
              success(function(data, status, headers, config) {
                $scope.selectedCityPhoto = $scope.buildFlickrUrl(data);
                deferred.resolve();
                return deferred.promise;
              }).
              error(function(data, status, headers, config) {
                return deferred.reject();
              });
        deferred.notify();
        return deferred.promise;
    }

    $scope.buildFlickrUrl = function(data){
        console.log(data.photos);
        var id = data.photos.photo[0].id;
        var farm = data.photos.photo[0].farm;
        var server = data.photos.photo[0].server;
        var secret = data.photos.photo[0].secret;
        $scope.selectedCityPhotoAuthor = "https://www.flickr.com/photos/" + data.photos.photo[0].owner + "/" + data.photos.photo[0].id + "/";
        var photoUrl = "http://farm" + farm + ".staticflickr.com/" + server + "/" + id + "_" + secret + ".jpg";
        console.log(photoUrl);
        return photoUrl;
    }

    $scope.parameters = function(day1, day2, cityName, pageNumber) {
        this.day1 = day1;
        this.day2 = day2;
        this.cityName = cityName;
        this.pageNumber = pageNumber;
    }

    $scope.doSearch = function(init) {

        var day1 = new moment();
        day1.add(1, 'days');

        var day2 = new moment();
        day2.add(8, 'days');

        $scope.myParameters = new $scope.parameters(day1, day2, $scope.selectedCity.get("Name"), 1);

        $scope.connectToAirbnb(init, $scope.myParameters);

    }

    $scope.connectToAirbnb = function(init, myParameters) {
        var myUrl = $scope.giveUrl($scope.myParameters);
        console.log(myUrl);

        $.ajaxPrefilter(function(options) {
            if (options.crossDomain && jQuery.support.cors) {
                var http = (window.location.protocol === 'http:' ? 'http:' : 'https:');
                //options.url = http + '//cors-anywhere.herokuapp.com/' + options.url;
                //options.url = "http://cors.corsproxy.io/url=" + options.url;
                options.url = http + '//allow-any-origin.appspot.com/' + options.url;
            }
            console.log(options.url);
        });

        $.get(
            myUrl,
            function(response) {
                console.log("Parsing page:" + $scope.myParameters.pageNumber + "/" + $scope.pages);
                $scope.parseAirbnbCode(response);
            });
    }

    $scope.parseAirbnbCode = function(doc, $q) {
        $scope.processPages(doc);
        $scope.parseListings(doc);

        if ($scope.pages > 1) {
            $scope.myParameters.pageNumber++;
            if ($scope.myParameters.pageNumber <= $scope.pages) {
                $scope.connectToAirbnb($scope.myParameters);
                $scope.myParameters.pageNumber++;
            }
        }
    }

    $scope.processListings = function(doc) {

    }

    $scope.processPages = function(doc) {
        if ($scope.pages == 0) {
            var rentals = $scope.parseNumberRentals(doc);
            if (rentals == '300+') {
                $scope.pages = 5;
            } else {
                var a = parseInt(rentals);
                $scope.pages = Math.floor(a / 18);
                if ($scope.pages > 5) {
                    $scope.pages = 5;
                }
            }
        }
    }

    $scope.parseNumberRentals = function(doc) {
        var resultsString = 'data-behavior="results_count_text">';
        var a = doc.indexOf(resultsString);
        var b = a + resultsString.length;
        var index0 = $scope.giveNextIndex(a, doc, ' Rentals');
        var diff = index0 - b;
        var rentals = doc.substr(b, diff);
        return rentals;
    }

    $scope.parseListings = function(doc, $q) {

        $scope.listingIndex = doc.indexOf('<div class="listings-container">');
        var myindex = 0;
        var i = 0;
        while (i < 18) {
            if (i == 0) {
                myindex = $scope.addListing($scope.listingIndex, $scope.listingDivString, doc);
            } else if (i > 0 && i < 17) {
                myindex = $scope.addListing(myindex, $scope.listingDivString, doc);
            } else if (i == 17) {
                myindex = $scope.addListing(myindex, "Vacation Rentals", doc);
            }
            i++;
        }

    }

    $scope.addListing = function(a, b, doc) {

        var index0 = $scope.giveNextIndex(a, doc, $scope.listingDivString);
        var index1 = index0 + $scope.listingDivString.length;
        var index2 = $scope.giveNextIndex(index1, doc, b);
        var diff = index2 - index1;
        $scope.unformattedListings.push(doc.substr(index1, diff));
        return index2;
    }

    $scope.giveNextIndex = function(preIndex, preString, searchString) {
        var searchIndex = preIndex + preString.substring(preIndex).indexOf(searchString);
        return searchIndex;
    }

    // https://www.airbnb.com/s/London?checkin=10%2F25%2F2015&checkout=02%2F29%2F2016
    $scope.giveUrl = function(p) {

        var checkindate = $scope.formatDate(p.day1);
        var checkoutdate = $scope.formatDate(p.day2);
        myUrl = 'https://www.airbnb.com/s/' + p.cityName + '?checkin=' + checkindate + '&checkout=' + checkoutdate + '&page=' + p.pageNumber;
        return myUrl;
    }

    $scope.formatDate = function(date) {
        var formatDate1 = moment(date).format('L');
        console.log(formatDate1);
        var month = formatDate1.substr(0, 2);
        var day = formatDate1.substr(3, 2);
        var year = formatDate1.substr(6, 4);
        var formatDate2 = month + '%2F' + day + '%2F' + year;
        return formatDate2;
    }

    

}]);