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
      return it('should not have a google marker instance', function() {
        return expect(this.addressPicker.getGMarker()).not.toBeDefined();
      });
    });
    return describe('AddressPicker with map options', function() {
      beforeEach(function(done) {
        this.addressPicker = new AddressPicker({
          map: {
            id: '#map'
          }
        });
        $('#fixtures').typeahead({
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
      return it('should create a google map ', function(done) {
        expect($('#map')).toContainElement('.gm-style');
        return done();
      });
    });
  });

}).call(this);
