(function() {
  this.mockGoogleMapAutocompleteService = function(response) {
    return window.google.maps.places.AutocompleteService.prototype.getPlacePredictions = function(options, callback) {
      return callback(response);
    };
  };

}).call(this);
