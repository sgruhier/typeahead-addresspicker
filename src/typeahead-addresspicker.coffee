class @AddressPicker extends Bloodhound
  constructor: (options = {})->
    @options = $.extend
      local: []
      datumTokenizer: (d) -> Bloodhound.tokenizers.whitespace(d.num)
      queryTokenizer: Bloodhound.tokenizers.whitespace
      autocompleteService: {types: ["geocode"]}
      zoomForLocation: 16
    , options
    super(@options)

    if @options.map
      @initMap(@options.map)

  # Binds typeahead:selected and typeahead:cursorchanged event to @updateMap
  bindDefaultTypeaheadEvent: (typeahead) ->
    typeahead.bind("typeahead:selected", @updateMap)
    typeahead.bind("typeahead:cursorchanged", @updateMap)

  # Inits google map to display selected address from autocomplete
  initMap: (options)->
    options = $.extend
      zoom: 3
      center: new google.maps.LatLng(0, 0)
      mapTypeId: google.maps.MapTypeId.ROADMAP
    , options
    @map = new google.maps.Map($(options.id)[0], options)

    # Create a hidden marker to display selected address
    @marker = new google.maps.Marker(position: options.center, map: @map, visible: false)

    # Create a PlacesService on a fake DOM element
    @placeService = new google.maps.places.PlacesService(@map)

  # Overrides Bloodhound#get  to send request to google maps autocomplete service
  get: (query, cb) ->
    service = new google.maps.places.AutocompleteService()
    @options.autocompleteService.input = query
    service.getPlacePredictions @options.autocompleteService, (predictions) ->
      data = (suggestion for suggestion in predictions)
      cb(data)

  # Callback for typeahead events like typeahead:selected or typeahead:cursorchanged
  # to update marker position and map center/zoom for a specific Google Map place
  updateMap: (event, place) =>
    # Send place reference to place service to get geographic information
    @placeService.getDetails place, (response) =>
      @marker.setPosition(response.geometry.location)
      @marker.setVisible(true)

      $(this).trigger('addresspicker:selected', new AddressPickerResult(response))
      if response.geometry.viewport
        @map.fitBounds(response.geometry.viewport)
      else
        @map.setCenter(response.geometry.location)
        @map.setZoom(@options.zoomForLocation)

  # Attr accessor
  getGMap: -> @map
  getGMarker: -> @marker

class @AddressPickerResult
  constructor: (@placeResult) ->

  addressTypes: ->
    types = []
    for component in @addressComponents()
      for type in component.types
        types.push(type) if types.indexOf(type) == -1
    types

  addressComponents: ->
    @placeResult.address_components

  address: ->
    @placeResult.formatted_address

  nameForType: (type, shortName = false) ->
    for component in @addressComponents()
      return (if shortName then component.short_name else component.long_name) if component.types.indexOf(type) != -1
    null

  lat: ->
    @placeResult.geometry.location.lat()

  lng: ->
    @placeResult.geometry.location.lng()

  isAccurate: ->
    ! @placeResult.geometry.viewport

