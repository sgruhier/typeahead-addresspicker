(function() {
  describe('TypyaheadAddressPicker', function() {
    beforeEach(function() {
      return loadFixtures('fragment.html');
    });
    describe('prerequisite', function() {
      it('should have typeahead defined', function() {
        return expect($.fn.typeahead).toBeDefined();
      });
      it('should have google maps defined', function() {
        return expect(google.maps.Map).toBeDefined();
      });
      return it('should have google maps places AutocompleteService defined', function() {
        return expect(google.maps.places.AutocompleteService).toBeDefined();
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
      it('should get autocomplete value', function() {
        var callback;
        callback = jasmine.createSpy();
        this.addressPicker.get("Paris", callback);
        return expect(callback).toHaveBeenCalledWith(this.fixture);
      });
      it('should not have a google map instance', function() {
        return expect(this.addressPicker.getGMap()).not.toBeDefined();
      });
      it('should not have a google marker instance', function() {
        return expect(this.addressPicker.getGMarker()).not.toBeDefined();
      });
      it('should have default autocompleteService options', function() {
        return expect(this.addressPicker.options.autocompleteService).toEqual({
          types: ["geocode"]
        });
      });
      return it('should set autocompleteService options', function() {
        var addressPicker;
        addressPicker = new AddressPicker({
          autocompleteService: {
            types: ["cities"]
          }
        });
        return expect(addressPicker.options.autocompleteService).toEqual({
          types: ["cities"]
        });
      });
    });
    describe('AddressPicker with map options', function() {
      beforeEach(function(done) {
        this.addressPicker = new AddressPicker({
          map: {
            id: '#map'
          }
        });
        $('#typeahead').typeahead(null, {
          displayKey: 'description',
          source: this.addressPicker.ttAdapter()
        });
        return google.maps.event.addListenerOnce(this.addressPicker.getGMap(), 'idle', done);
      });
      it('should instance a new AddressPicker object', function() {
        return expect(this.addressPicker instanceof AddressPicker).toBe(true);
      });
      it('should return google map instance', function() {
        return expect(this.addressPicker.getGMap()).toBeDefined();
      });
      it('should return google marker instance', function() {
        return expect(this.addressPicker.getGMarker()).toBeDefined();
      });
      it('should have google marker hidden by default', function() {
        return expect(this.addressPicker.getGMarker().getVisible()).toBe(false);
      });
      it('should create a google map ', function(done) {
        expect($('#map')).toContainElement('.gm-style');
        return done();
      });
      return it('should bind default typeahead events', function() {
        spyOn(this.addressPicker, 'updateMap');
        this.addressPicker.bindDefaultTypeaheadEvent($('#typeahead'));
        $('#typeahead').trigger('typeahead:selected');
        $('#typeahead').trigger('typeahead:cursorchanged');
        return expect(this.addressPicker.updateMap.calls.count()).toEqual(2);
      });
    });
    describe('AddressPickerResult', function() {
      beforeEach(function() {
        this.fixture = getJSONFixture('paris-place-result.json');
        this.fixture.geometry.location = new google.maps.LatLng(this.fixture.geometry.location_text.k, this.fixture.geometry.location_text.A);
        return this.addressPickerResult = new AddressPickerResult(this.fixture);
      });
      it('should instance a new AddressPickerResult object', function() {
        return expect(this.addressPickerResult instanceof AddressPickerResult).toBe(true);
      });
      it('should get list of addressTypes', function() {
        return expect(this.addressPickerResult.addressTypes()).toEqual(['locality', 'political', 'administrative_area_level_2', 'administrative_area_level_1', 'country']);
      });
      it('should get addressComponents', function() {
        return expect(this.addressPickerResult.addressComponents().length).toEqual(4);
      });
      it('should get latitude value', function() {
        return expect(this.addressPickerResult.lat()).toEqual(48.856614);
      });
      it('should get longitude value', function() {
        return expect(this.addressPickerResult.lng()).toEqual(2.3522219000000177);
      });
      it('should not be from reverse geocoding by default', function() {
        return expect(this.addressPickerResult.isReverseGeocoding()).toBe(false);
      });
      it('should be from reverse geocoding is set on constructor', function() {
        this.addressPickerResult = new AddressPickerResult(this.fixture, true);
        return expect(this.addressPickerResult.isReverseGeocoding()).toBe(true);
      });
      it('should get name for type if available', function() {
        expect(this.addressPickerResult.nameForType("country")).toEqual('France');
        expect(this.addressPickerResult.nameForType("administrative_area_level_1")).toEqual('Île-de-France');
        expect(this.addressPickerResult.nameForType("administrative_area_level_2")).toEqual('Paris');
        return expect(this.addressPickerResult.nameForType("locality")).toEqual('Paris');
      });
      it('should get null value for type if not available', function() {
        return expect(this.addressPickerResult.nameForType("sublocality")).toBe(null);
      });
      it('should get short name for type if available', function() {
        expect(this.addressPickerResult.nameForType("country", true)).toEqual('FR');
        expect(this.addressPickerResult.nameForType("administrative_area_level_1", true)).toEqual('IDF');
        expect(this.addressPickerResult.nameForType("administrative_area_level_2", true)).toEqual('75');
        return expect(this.addressPickerResult.nameForType("locality", true)).toEqual('Paris');
      });
      it('should not be accurate if geometry has a viewport', function() {
        return expect(this.addressPickerResult.isAccurate()).toBe(false);
      });
      it('should be accurate if geometry has no viewport', function() {
        var addressPickerResult, fixture;
        fixture = getJSONFixture('accurate-place-result.json');
        fixture.geometry.location = new google.maps.LatLng(fixture.geometry.location.k, fixture.geometry.location.A);
        addressPickerResult = new AddressPickerResult(fixture);
        return expect(addressPickerResult.isAccurate()).toBe(true);
      });
      return it('should change lat/lng', function() {
        this.addressPickerResult.setLatLng(12, 13);
        expect(this.addressPickerResult.lat()).toEqual(12);
        return expect(this.addressPickerResult.lng()).toEqual(13);
      });
    });
    return describe('AddressPickerResult with only lat/lng', function() {
      beforeEach(function() {
        return this.addressPickerResult = new AddressPickerResult({
          geometry: {
            location: new google.maps.LatLng(12, 13)
          }
        });
      });
      it('should get latitude value', function() {
        return expect(this.addressPickerResult.lat()).toEqual(12);
      });
      it('should get longitude value', function() {
        return expect(this.addressPickerResult.lng()).toEqual(13);
      });
      return it('should not have addressComponents', function() {
        return expect(this.addressPickerResult.addressComponents().length).toEqual(0);
      });
    });
  });

}).call(this);
