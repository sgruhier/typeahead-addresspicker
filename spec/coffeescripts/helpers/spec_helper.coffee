@mockGoogleMapAutocompleteService= (response) ->
  window.google =
    maps:
      places: {}
  class window.google.maps.places.AutocompleteService
    getPlacePredictions: (options, callback) ->
      callback(response)
