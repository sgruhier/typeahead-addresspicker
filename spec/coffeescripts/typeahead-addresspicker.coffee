describe 'TypyaheadAddressPicker', ->

  mockGoogleMap= (response) ->
    window.google =
      maps:
        places: {}
    class window.google.maps.places.AutocompleteService
      getPlacePredictions: (options, callback) ->
        callback(response)

  describe 'typeahead', ->
    it 'should be available on the jQuery object', ->
      expect($.fn.typeahead).toBeDefined()

  describe 'AddressPicker', ->
    beforeEach ->
      mockGoogleMap()#getJSONFixture('paris-autocomplete-service.json'))
      @GMA = window.google.maps.places.AutocompleteService
      @addressPicker = new AddressPicker()

    it 'should instance a new AddressPicker object', ->
      expect(@addressPicker instanceof AddressPicker).toBe(true)

    it 'should get autocomplete value', ->
      spyOn(@GMA.prototype, 'getPlacePredictions');
      @addressPicker.get("Paris", ->)
      callback = jasmine.createSpy()
      expect(@GMA.prototype.getPlacePredictions).toHaveBeenCalled()#With({ input : 'Paris', types : [ 'geocode' ] }, callback);

  describe 'typeahead addresspicker', ->
    beforeEach ->
      loadFixtures 'fragment.html'
      @addressPicker = $('#fixtures').typeahead()

    it 'should instanciate a typeahead', ->
      expect($.fn.typeahead).toBeDefined()

