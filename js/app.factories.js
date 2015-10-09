// Factories





app.factory('DateFormatter', function(date) {
        var formatDate1 = moment(date).format('L');
        console.log(formatDate1);
        var month = formatDate1.substr(0, 2);
        var day = formatDate1.substr(3, 2);
        var year = formatDate1.substr(6, 4);
        var formatDate2 = month + '%2F' + day + '%2F' + year;
        return formatDate2;
});

app.factory('AirbnbUrlBuilder', function(p) {

        var checkindate = DateFormatter(p.day1);
        var checkoutdate = DateFormatter(p.day2);
        myUrl = 'https://www.airbnb.com/s/' + p.cityName + '?checkin=' + checkindate + '&checkout=' + checkoutdate + '&page=' + p.pageNumber;
        return myUrl;
});

app.factory('NumberRentals', function(doc) {
        var resultsString = 'data-behavior="results_count_text">';
        var a = doc.indexOf(resultsString);
        var b = a + resultsString.length;
        var index0 = NextIndex(a, doc, ' Rentals');
        var diff = index0 - b;
        var rentals = doc.substr(b, diff);
        return rentals;
});

