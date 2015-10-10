
// Services

app.service('FlickrUrl', function() {
        this.build = function(data){
        photoUrl = {
        	photo: "",
        	author: ""
        };
        var ob = data.photos.photo[0];
        var id = ob.id;
        var farm = ob.farm;
        var server = ob.server;
        var secret = ob.secret;
            
        photoUrl.author = "https://www.flickr.com/photos/" + ob.owner + "/" + ob.id + "/";
        photoUrl.photo = "http://farm" + farm + ".staticflickr.com/" + server + "/" + id + "_" + secret + ".jpg";
        
        return photoUrl;
    }
});

app.service('NextIndex', function() {
		this.get = function(preIndex, preString, searchString){
        	var searchIndex = preIndex + preString.substring(preIndex).indexOf(searchString);
        	return searchIndex;
    	}
});

app.service('DateFormatter', function() {
		this.get = function(date){
        var formatDate1 = moment(date).format('L');
        var month = formatDate1.substr(0, 2);
        var day = formatDate1.substr(3, 2);
        var year = formatDate1.substr(6, 4);
        var formatDate2 = month + '%2F' + day + '%2F' + year;
        return formatDate2;
    	}
});

app.service('AirbnbUrl', function(DateFormatter, NextIndex) {
		this.build = function(p){
        var checkindate = DateFormatter.get(p.day1);
        var checkoutdate = DateFormatter.get(p.day2);
        myUrl = 'https://www.airbnb.com/s/' + p.cityName + '?checkin=' + checkindate + '&checkout=' + checkoutdate + '&page=' + p.pageNumber;
        return myUrl;
        }

        this.buildAdvanced = function(p, paux){
        	var myString = "";
        	var checkindate = DateFormatter.get(p.day1);
        	var checkoutdate = DateFormatter.get(p.day2);
        	myUrl = 'https://www.airbnb.com/s/' + p.cityName + '?checkin=' + checkindate + '&checkout=' + checkoutdate + '&page=' + p.pageNumber;
        	if (paux.superhost)
        		myUrl += "&superhost=true";
        	if (paux.instantSearch)
        		myUrl += "&ib=true";
        	if (paux.max100Euros)
        		myUrl += "&price_max=100";
        	return myUrl;
        }

        this.getHTMLBlock = function(doc, o){

        	var a = o.startIndex;
        	var b = o.startToken;
        	var c = o.endToken;

	        var index0 = NextIndex.get(a, doc, b);
	        var index1 = index0 + b.length;
	        var index2 = NextIndex.get(index1, doc, c);
	        var diff = index2 - index1;
	        diff = diff - 1;
	        var out = doc.substr(index1, diff);
	        return out;
	    }

	    this.buildParserObject = function(a, b, c){
	    	this.startIndex = a;
	    	this.startToken = b;
	    	this.endToken = c;
	    	return this;
	    }    
});

app.service('AirbnbListing', function(AirbnbUrl) {
		this.build = function(a){
			var d = a.indexOf('<span class="rich-toggle wish_list_button wishlist-button"');
	        var nameToken = 'data-name="';
	        var priceToken = 'data-price="';
	        var reviewsToken = 'data-review_count="';
	        var imgToken = 'data-img="';
	        var hostingToken = 'data-hosting_id="';
	        var ratingToken = 'data-star_rating="';
	        var addressToken = 'data-address="';
	        
	        var listingName = AirbnbUrl.buildParserObject(d, nameToken, 'data-address');         
	        var myListingName = AirbnbUrl.getHTMLBlock(a, listingName).split('"');
	        
	        var listingAmount = AirbnbUrl.buildParserObject(d, priceToken, 'data-review_count');         
	        var myListingAmount = AirbnbUrl.getHTMLBlock(a, listingAmount).split('"');
	        var a1 = myListingAmount[0].split(";");
	        var a2 = a1[0].split("&");
	        var myListingCurrency = a2[1];
	        var myListingPrice = parseInt(a1[1]);
	        
	        var listingReviews = AirbnbUrl.buildParserObject(d, reviewsToken, 'data-host_img');         
	        var myListingReviews = AirbnbUrl.getHTMLBlock(a, listingReviews).split('"');
	        var myListingReviewCount = 0;
	        if (myListingReviews[0] == ""){
	        	myListingReviewCount = 0;
	        } else {
	        	var b = myListingReviews[0].split(" ");
	        	myListingReviewCount = parseInt(b[0]);
	        }

	        var listingPhoto = AirbnbUrl.buildParserObject(d, imgToken, 'data-name');         
	        var myListingPhoto = AirbnbUrl.getHTMLBlock(a, listingPhoto).split('"');
	        
	        var listingHosting = AirbnbUrl.buildParserObject(d, hostingToken, 'data-price');
	        var myListingHosting = AirbnbUrl.getHTMLBlock(a, listingHosting).split('"');
	        
	        var listingRating = AirbnbUrl.buildParserObject(d, ratingToken, 'data-summary');
	        var myListingRating = AirbnbUrl.getHTMLBlock(a, listingRating).split('"');
	        
	        var listingAddress = AirbnbUrl.buildParserObject(d, addressToken, 'data-hosting_id="');
	        var myListingAddress = AirbnbUrl.getHTMLBlock(a, listingAddress).split('"');
	        var b = {
	        	name: myListingName[0],
	     		currency: myListingCurrency,
	     		price: parseInt(myListingPrice),
	        	reviews: myListingReviewCount,
	        	photo: myListingPhoto[0],
	        	hosting: myListingHosting[0],
	        	rating: parseFloat(myListingRating[0]),
	        	address: myListingAddress[0],
	        	url: "http://www.airbnb.com/rooms/" + myListingHosting[0]
	    	};
	        return b;
		}
});

app.service('NumberRentals', function(NextIndex) {
		this.calculate = function(doc){
        var resultsString = 'data-behavior="results_count_text">';
        var a = doc.indexOf(resultsString);
        var b = a + resultsString.length;
        var index0 = NextIndex.get(a, doc, ' Rentals');
        var diff = index0 - b;
        var rentals = doc.substr(b, diff);
        console.log("Rentals: " + rentals);
        if (rentals == '300+'){
        	rentals = '300';
        }
        return rentals;
        }
        this.calculateRest = function(rentals){
        	if (rentals > 90){
        		rentals = 90;
        	}
        	var rest = 18-(rentals%18);
        	return rest;
        }
});

app.service('Pages', function(NumberRentals) {
   this.calculate = function(doc, pages, deep){
   if (deep > 0){
   		var pagesByDefault = 17;
   } else {
   		var pagesByDefault = 5; 
   }
   var rentals = NumberRentals.calculate(doc);
   var numberRentals = parseInt(rentals);
   if (pages == 0) {
            if (numberRentals == 300) {
                pages = pagesByDefault;
            } else {
                pages = Math.floor(numberRentals / 18);
                if (pages > pagesByDefault) {
                    pages = pagesByDefault;
                }
            }
   }
   var number = {
   		pages : pages,
   		rentals : numberRentals
   }
   return number;
   }
});

app.service('Compare', function(){
	this.byPrice = function(a,b){
		if (a.price < b.price)
	    	return -1;
	  	if (a.price > b.price)
	    	return 1;
	  	return 0;
	}
	this.byReviews = function(a,b){
		if (a.reviews < b.reviews)
	    	return 1;
	  	if (a.reviews > b.reviews)
	    	return -1;
	  	return 0;
	}
	this.byRating = function(a,b){
		if (a.rating < b.rating)
	    	return 1;
	  	if (a.rating > b.rating)
	    	return -1;
	  	if (a.rating == b.rating){
	  		if (a.reviews < b.reviews)
	    		return 1;
	  		if (a.reviews > b.reviews)
	    		return -1;
	  		return 0;
	  	}
	}
});
