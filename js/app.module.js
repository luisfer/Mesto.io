var app = angular.module('app', ['ngRoute'])

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