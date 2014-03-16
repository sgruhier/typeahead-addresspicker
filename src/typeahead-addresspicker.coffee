class @AddressPicker extends Bloodhound
  constructor: (options = {})->
    options = $.extend
      local: []
      datumTokenizer: (d) -> Bloodhound.tokenizers.whitespace(d.num)
      queryTokenizer: Bloodhound.tokenizers.whitespace
    , options
    super(options)

    if options.map
      @initMap(options.map)

  # Init google map to display selected address from autocomplete
  initMap: (options)->
    # Create a PlacesService on a fake DOM element
    @placeService = new google.maps.places.PlacesService(document.createElement('div'))

    options = $.extend
      zoom: 3
      center: new google.maps.LatLng(0, 0)
      mapTypeId: google.maps.MapTypeId.ROADMAP
    , options
    @map = new google.maps.Map($(options.id)[0], options)
    @marker = new google.maps.Marker(position: options.center, map: @map, visible: false)


  # Overide Bloodhound#get  to send request to google maps autocomplete service
  get: (query, cb) ->
    service = new google.maps.places.AutocompleteService()
    service.getPlacePredictions { input: query ,  types: ["geocode"]}, (predictions) ->
      data = (suggestion for suggestion in predictions)
      cb(data)

  #
  updateMap: (event, place) =>
    # Send place reference to place service to get geographic information
    @placeService.getDetails place, (response) =>
      @marker.setPosition(response.geometry.location)
      @marker.setVisible(true)

      if response.geometry.viewport
        @map.fitBounds(response.geometry.viewport)
      else
        @map.setCenter(response.geometry.location)
        @map.setZoom(16)

  # Attr accessor
  getGMap: -> @map
  getGMarker: -> @marker


