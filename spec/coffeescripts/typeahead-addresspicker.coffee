describe 'TypyaheadAddressPicker', ->

  describe 'typeahead', ->
    it 'should be available on the jQuery object', ->
      expect($.fn.typeahead).toBeDefined()

  # Verify that twitter typeahead is defined
  describe 'typeahead addresspicker', ->
    beforeEach ->
      loadFixtures 'fragment.html'
      @addressPicker = $('#fixtures').typeahead()

    it 'should instanciate a typeahead', ->
      expect($.fn.typeahead).toBeDefined()

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

  describe 'AddressPicker with map options', ->
    it 'should instance a new AddressPicker object', ->
      expect(@addressPicker instanceof AddressPicker).toBe(true)

