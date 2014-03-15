(function() {
  this.mockGoogleMapAutocompleteService = function(response) {
    window.google = {
      maps: {
        places: {}
      }
    };
    return window.google.maps.places.AutocompleteService = (function() {
      function AutocompleteService() {}

      AutocompleteService.prototype.getPlacePredictions = function(options, callback) {
        return callback(response);
      };

      return AutocompleteService;

    })();
  };

}).call(this);
