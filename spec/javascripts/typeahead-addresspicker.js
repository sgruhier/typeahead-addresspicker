(function() {
  describe('TypyaheadAddressPicker', function() {
    var mockGoogleMap;
    mockGoogleMap = function(response) {
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
    describe('typeahead', function() {
      return it('should be available on the jQuery object', function() {
        return expect($.fn.typeahead).toBeDefined();
      });
    });
    describe('AddressPicker', function() {
      beforeEach(function() {
        mockGoogleMap();
        this.GMA = window.google.maps.places.AutocompleteService;
        return this.addressPicker = new AddressPicker();
      });
      it('should instance a new AddressPicker object', function() {
        return expect(this.addressPicker instanceof AddressPicker).toBe(true);
      });
      return it('should get autocomplete value', function() {
        var callback;
        spyOn(this.GMA.prototype, 'getPlacePredictions');
        this.addressPicker.get("Paris", function() {});
        callback = jasmine.createSpy();
        return expect(this.GMA.prototype.getPlacePredictions).toHaveBeenCalled();
      });
    });
    return describe('typeahead addresspicker', function() {
      beforeEach(function() {
        loadFixtures('fragment.html');
        return this.addressPicker = $('#fixtures').typeahead();
      });
      return it('should instanciate a typeahead', function() {
        return expect($.fn.typeahead).toBeDefined();
      });
    });
  });

}).call(this);
