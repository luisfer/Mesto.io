// cities.controller.js

app.controller('CitiesController', ['$scope', function($scope) {
  
  $scope.cities = [];
  $scope.selectedCity = {};

  $scope.init = function(){
  		
  		$scope.getCities();
		
  }

  $scope.selectCity = function(city){
  	$scope.selectedCity = city;
  	console.log($scope.selectedCity.get("Name"));
  }

  $scope.getCities = function(){

  	var mCity = Parse.Object.extend("City");

	  	var CityClass = new mCity();
	  	
  		var queryObject = new Parse.Query(CityClass);

	  	queryObject.find({
		    success: function (results) {
		    	for (var i = 0; i < results.length; i++) {
		            
		            $scope.cities.push(results[i]);
		        }
		        
		        console.log($scope.cities);

		        $scope.$apply();
		    },
		    error: function (error) {
		        alert("Error: " + error.code + " " + error.message);
		    }
		});
  }

}]);
