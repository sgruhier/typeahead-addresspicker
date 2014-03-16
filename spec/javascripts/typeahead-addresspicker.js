(function() {
  describe('TypyaheadAddressPicker', function() {
    describe('typeahead', function() {
      return it('should be available on the jQuery object', function() {
        return expect($.fn.typeahead).toBeDefined();
      });
    });
    describe('typeahead addresspicker', function() {
      beforeEach(function() {
        loadFixtures('fragment.html');
        this.addressPicker = $('#fixtures').typeahead();
        return console.log(window.google.maps.LatLng);
      });
      return it('should instanciate a typeahead', function() {
        return expect($.fn.typeahead).toBeDefined();
      });
    });
    describe('AddressPicker without map options', function() {
      beforeEach(function() {
        this.fixture = getJSONFixture('paris-autocomplete-service.json');
        mockGoogleMapAutocompleteService(this.fixture);
        return this.addressPicker = new AddressPicker();
      });
      it('should instance a new AddressPicker object', function() {
        return expect(this.addressPicker instanceof AddressPicker).toBe(true);
      });
      return it('should get autocomplete value', function() {
        var callback;
        callback = jasmine.createSpy();
        this.addressPicker.get("Paris", callback);
        return expect(callback).toHaveBeenCalledWith(this.fixture);
      });
    });
    return describe('AddressPicker with map options', function() {
      return it('should instance a new AddressPicker object', function() {
        return expect(this.addressPicker instanceof AddressPicker).toBe(true);
      });
    });
  });

}).call(this);
