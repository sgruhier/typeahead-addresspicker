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
      $('#typeahead').typeahead
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
      $('#typeahead').trigger('typeahead:cursorchanged')
      expect(@addressPicker.updateMap.calls.count()).toEqual(2)
