// cities.controller.js
Date.prototype.addDays = function(days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}

app.controller('CitiesController', ['$scope', function($scope) {

    $scope.cities = [];
    $scope.selectedCity = {};
    $scope.listingIndex = -1;
    $scope.listingDivString = '<div class="col-sm-12 row-space-2 col-md-6">';
        
    $scope.unformattedListings = [];
    $scope.listings = [];

    $scope.pages = 0;

    $scope.myParameters = {};

    $scope.init = function() {

        $scope.getCities();

    }

    $scope.selectCity = function(city) {
        $scope.selectedCity = city;
        console.log($scope.selectedCity.get("Name"));
    }

    $scope.parameters = function(day1, day2, cityName, pageNumber){
        this.day1 = day1;
        this.day2 = day2;
        this.cityName = cityName;
        this.pageNumber = pageNumber;
    }

    $scope.doSearch = function() {

        var day1 = new moment();
        day1.add(1, 'days');
        
        var day2 = new moment();
        day2.add(8, 'days');
    
        $scope.myParameters = new $scope.parameters(day1, day2, $scope.selectedCity.get("Name"), 1);
        
        $scope.connectToAirbnb($scope.myParameters);
        
    }

    $scope.connectToAirbnb = function(myParameters){
        var myUrl = $scope.giveUrl($scope.myParameters);
        console.log(myUrl);

        $.ajaxPrefilter(function(options) {
            if (options.crossDomain && jQuery.support.cors) {
                var http = (window.location.protocol === 'http:' ? 'http:' : 'https:');
                options.url = http + '//cors-anywhere.herokuapp.com/' + options.url;
                //options.url = "http://cors.corsproxy.io/url=" + options.url;
            }
        });

        $.get(
            myUrl,
            function(response) {
                $scope.parseAirbnbCode(response);
        });
    }

    $scope.parseAirbnbCode = function(doc, $q){
        if ($scope.pages == 0){
        var rentals = $scope.parseNumberRentals(doc);
        
        if (rentals == '300+'){
            $scope.pages = 5;
        } else {
            var a = parseInt(rentals);
            $scope.pages = Math.floor(a/18);
        }
        $scope.parseListings(doc);
        }
        if ($scope.pages > 1){
            $scope.myParameters.pageNumber++;
            while ($scope.myParameters.pageNumber <= $scope.pages){
                $scope.connectToAirbnb($scope.myParameters);
                $scope.myParameters.pageNumber++;
        }
        }
    }

    $scope.parseNumberRentals = function(doc){
        var resultsString = 'data-behavior="results_count_text">';
        var a = doc.indexOf(resultsString);
        var b = a + resultsString.length;
        var index0 = $scope.giveNextIndex(a,doc,' Rentals');
        var diff = index0 - b;
        var rentals = doc.substr(b, diff);
        return rentals;
    }

    $scope.parseListings = function(doc, $q){ 

        var deferred = $q.defer();

        $scope.listingIndex = doc.indexOf('<div class="listings-container">');
        var myindex = 0;
        var i = 0;
        while(i < 18){
            if (i == 0){
                myindex = $scope.addListing($scope.listingIndex, $scope.listingDivString, doc);
                
            }
            if (i > 0 && i < 17){
                myindex = $scope.addListing(myindex, $scope.listingDivString, doc);
            }
            if (i == 17){
                myindex = $scope.addListing(myindex, "Vacation Rentals", doc);
            }
            i++;  
        } 

        console.log($scope.unformattedListings); 
        return deferred.promise;
    }

    $scope.addListing = function(a, b, doc){

        var index0 = $scope.giveNextIndex(a,doc,$scope.listingDivString);
        var index1 = index0 + $scope.listingDivString.length;
        var index2 = $scope.giveNextIndex(index1,doc,b);
        var diff = index2 - index1;
        $scope.unformattedListings.push(doc.substr(index1, diff));
        return index2;
    } 

    $scope.giveNextIndex = function(preIndex,preString,searchString){
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

    $scope.getCities = function() {

        var mCity = Parse.Object.extend("City");

        var CityClass = new mCity();

        var queryObject = new Parse.Query(CityClass);

        queryObject.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {

                    $scope.cities.push(results[i]);
                }

                console.log($scope.cities);

                $scope.$apply();
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }

}]);