describe 'TypyaheadAddressPicker', ->
  beforeEach ->
    loadFixtures 'fragment.html'

  # Verify that twitter typeahead is defined
  describe 'prerequisite', ->
    it 'should have typeahead defined', ->
      expect($.fn.typeahead).toBeDefined()

    it 'should have google maps defined', ->
      expect(google.maps.Map).toBeDefined()

    it 'should have google maps places AutocompleteService defined', ->
      expect(google.maps.places.AutocompleteService).toBeDefined()

  describe 'AddressPicker without map options', ->
    beforeEach ->
      @fixture = getJSONFixture('paris-autocomplete-service.json')
      mockGoogleMapAutocompleteService(@fixture)

      @addressPicker = new AddressPicker()

    it 'should instance a new AddressPicker object', ->
      expect(@addressPicker instanceof AddressPicker).toBe(true)

    it 'should get autocomplete value', ->
      callback = jasmine.createSpy()
      @addressPicker.get("Paris", callback)
      expect(callback).toHaveBeenCalledWith(@fixture)

    it 'should not have a google map instance', ->
      expect(@addressPicker.getGMap()).not.toBeDefined()

    it 'should not have a google marker instance', ->
      expect(@addressPicker.getGMarker()).not.toBeDefined()

    it 'should have default autocompleteService options', ->
      expect(@addressPicker.options.autocompleteService).toEqual(types: ["geocode"])

    it 'should set autocompleteService options', ->
      addressPicker = new AddressPicker(autocompleteService: {types: ["cities"]})
      expect(addressPicker.options.autocompleteService).toEqual(types: ["cities"])

  describe 'AddressPicker with map options', ->
    beforeEach (done) ->
      @addressPicker = new AddressPicker(map: {id: '#map'})
      $('#typeahead').typeahead null,
        displayKey: 'description'
        source: @addressPicker.ttAdapter()
      google.maps.event.addListenerOnce(@addressPicker.getGMap(), 'idle', done)

    it 'should instance a new AddressPicker object', ->
      expect(@addressPicker instanceof AddressPicker).toBe(true)

    it 'should return google map instance', ->
      expect(@addressPicker.getGMap()).toBeDefined()

    it 'should return google marker instance', ->
      expect(@addressPicker.getGMarker()).toBeDefined()

    it 'should have google marker hidden by default', ->
      expect(@addressPicker.getGMarker().getVisible()).toBe(false)

    it 'should create a google map ', (done) ->
      expect($('#map')).toContainElement('.gm-style')
      done()

    it 'should bind default typeahead events', ->
      spyOn(@addressPicker, 'updateMap')
      @addressPicker.bindDefaultTypeaheadEvent($('#typeahead'))

      $('#typeahead').trigger('typeahead:selected')
      $('#typeahead').trigger('typeahead:autocompleted')
      $('#typeahead').trigger('typeahead:cursorchanged')
      expect(@addressPicker.updateMap.calls.count()).toEqual(3)

  describe 'AddressPickerResult', ->
    beforeEach ->
      @fixture = getJSONFixture('paris-place-result.json')
      @fixture.geometry.location = new google.maps.LatLng(@fixture.geometry.location_text.k, @fixture.geometry.location_text.A)
      @addressPickerResult = new AddressPickerResult(@fixture)

    it 'should instance a new AddressPickerResult object', ->
      expect(@addressPickerResult instanceof AddressPickerResult).toBe(true)

    it 'should get list of addressTypes', ->
      expect(@addressPickerResult.addressTypes()).toEqual(['locality', 'political', 'administrative_area_level_2', 'administrative_area_level_1', 'country'])

    it 'should get addressComponents', ->
      expect(@addressPickerResult.addressComponents().length).toEqual(4)

    it 'should get latitude value', ->
      expect(@addressPickerResult.lat()).toEqual(48.856614)

    it 'should get longitude value', ->
      expect(@addressPickerResult.lng()).toEqual(2.3522219000000177)

    it 'should not be from reverse geocoding by default', ->
      expect(@addressPickerResult.isReverseGeocoding()).toBe(false)

    it 'should be from reverse geocoding is set on constructor', ->
      @addressPickerResult = new AddressPickerResult(@fixture, true)
      expect(@addressPickerResult.isReverseGeocoding()).toBe(true)

    it 'should get name for type if available', ->
      expect(@addressPickerResult.nameForType("country")).toEqual('France')
      expect(@addressPickerResult.nameForType("administrative_area_level_1")).toEqual('Île-de-France')
      expect(@addressPickerResult.nameForType("administrative_area_level_2")).toEqual('Paris')
      expect(@addressPickerResult.nameForType("locality")).toEqual('Paris')

    it 'should get null value for type if not available', ->
      expect(@addressPickerResult.nameForType("sublocality")).toBe(null)

    it 'should get short name for type if available', ->
      expect(@addressPickerResult.nameForType("country", true)).toEqual('FR')
      expect(@addressPickerResult.nameForType("administrative_area_level_1", true)).toEqual('IDF')
      expect(@addressPickerResult.nameForType("administrative_area_level_2", true)).toEqual('75')
      expect(@addressPickerResult.nameForType("locality", true)).toEqual('Paris')

    it 'should not be accurate if geometry has a viewport', ->
      expect(@addressPickerResult.isAccurate()).toBe(false)

    it 'should be accurate if geometry has no viewport', ->
      fixture = getJSONFixture('accurate-place-result.json')
      fixture.geometry.location = new google.maps.LatLng(fixture.geometry.location.k, fixture.geometry.location.A)
      addressPickerResult = new AddressPickerResult(fixture)
      expect(addressPickerResult.isAccurate()).toBe(true)

    it 'should change lat/lng', ->
      @addressPickerResult.setLatLng(12, 13)
      expect(@addressPickerResult.lat()).toEqual(12)
      expect(@addressPickerResult.lng()).toEqual(13)

  describe 'AddressPickerResult with only lat/lng', ->
    beforeEach ->
      @addressPickerResult = new AddressPickerResult(geometry: {location: new google.maps.LatLng(12,13)})

    it 'should get latitude value', ->
      expect(@addressPickerResult.lat()).toEqual(12)

    it 'should get longitude value', ->
      expect(@addressPickerResult.lng()).toEqual(13)

    it 'should not have addressComponents', ->
      expect(@addressPickerResult.addressComponents().length).toEqual(0)
