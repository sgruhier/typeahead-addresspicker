(($) ->
  class @AddressPickerResult
    constructor: (@placeResult, @fromReverseGeocoding = false) ->
      @latitude = @placeResult.geometry.location.lat()
      @longitude = @placeResult.geometry.location.lng()

    addressTypes: ->
      types = []
      for component in @addressComponents()
        for type in component.types
          types.push(type) if types.indexOf(type) == -1
      types

    addressComponents: ->
      @placeResult.address_components || []

    address: ->
      @placeResult.formatted_address

    nameForType: (type, shortName = false) ->
      for component in @addressComponents()
        return (if shortName then component.short_name else component.long_name) if component.types.indexOf(type) != -1
      null

    lat: ->
      @latitude

    lng: ->
      @longitude

    setLatLng: (@latitude, @longitude) ->


    isAccurate: ->
      ! @placeResult.geometry.viewport

    isReverseGeocoding: ->
      @fromReverseGeocoding

  class @AddressPicker extends Bloodhound
    constructor: (options = {})->
      @options = $.extend
        local: []
        datumTokenizer: (d) -> Bloodhound.tokenizers.whitespace(d.num)
        queryTokenizer: Bloodhound.tokenizers.whitespace
        autocompleteService: {types: ["geocode"]}
        zoomForLocation: 16
        reverseGeocoding: false
        placeDetails: true
      , options
      super(@options)

      if @options.map
        @initMap()

      # Create a PlacesService on a fake DOM element
      @placeService = new google.maps.places.PlacesService(document.createElement('div'))

    # Binds typeahead trigger events to @updateMap
    bindDefaultTypeaheadEvent: (typeahead) ->
      typeahead.bind("typeahead:selected", @updateMap)
      typeahead.bind("typeahead:autocompleted", @updateMap)
      typeahead.bind("typeahead:cursorchanged", @updateMap)

    # Inits google map to display selected address from autocomplete
    initMap: ->
      if @options?.map?.gmap
        @map = @options.map.gmap
      else
        @mapOptions = $.extend
          zoom: 3
          center: new google.maps.LatLng(0, 0)
          mapTypeId: google.maps.MapTypeId.ROADMAP
          boundsForLocation: @updateBoundsForPlace
        , @options.map
        @map = new google.maps.Map($(@mapOptions.id)[0], @mapOptions)
      @lastResult = null

      # Create a hidden marker to display selected address
      markerOptions = $.extend
        draggable: true
        visible: false
        position: @map.getCenter()
        map: @map
      , @options.marker || {}
      @marker = new google.maps.Marker(markerOptions)
      if markerOptions.draggable
        google.maps.event.addListener(@marker, 'dragend', @markerDragged)

    # Overrides Bloodhound#get  to send request to google maps autocomplete service
    get: (query, cb) ->
      service = new google.maps.places.AutocompleteService()
      @options.autocompleteService.input = query
      service.getPlacePredictions @options.autocompleteService, (predictions) =>
        $(this).trigger('addresspicker:predictions', [predictions])
        cb(predictions)

    # Callback for typeahead events like typeahead:selected or typeahead:cursorchanged
    # to update marker position and map center/zoom for a specific Google Map place
    updateMap: (event, place) =>
      # Send place reference to place service to get geographic information
      if @options.placeDetails
        @placeService.getDetails place, (response) =>
          @lastResult = new AddressPickerResult(response)
          if @marker
            @marker.setPosition(response.geometry.location)
            @marker.setVisible(true)
          if @map
            @mapOptions?.boundsForLocation(response)
          $(this).trigger('addresspicker:selected', @lastResult)
      else
        $(this).trigger('addresspicker:selected', place)

    updateBoundsForPlace: (response) =>
      if response.geometry.viewport
        @map.fitBounds(response.geometry.viewport)
      else
        @map.setCenter(response.geometry.location)
        @map.setZoom(@options.zoomForLocation)

    markerDragged: () =>
      if @options.reverseGeocoding
        @reverseGeocode(@marker.getPosition())
      else
        if @lastResult
          @lastResult.setLatLng(@marker.getPosition().lat(), @marker.getPosition().lng())
        else
          @lastResult = new AddressPickerResult(geometry: {location: @marker.getPosition()})
        $(this).trigger('addresspicker:selected', @lastResult)

    reverseGeocode: (position) ->
      @geocoder ?= new google.maps.Geocoder()
      @geocoder.geocode location: position, (results) =>
        if results && results.length > 0
          @lastResult = new AddressPickerResult(results[0], true)
          $(this).trigger('addresspicker:selected', @lastResult)

    # Attr accessor
    getGMap: -> @map
    getGMarker: -> @marker
)(jQuery)
