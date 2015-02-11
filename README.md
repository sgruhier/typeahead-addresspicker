# Typeahead Address Picker [![Build Status](https://api.travis-ci.org/sgruhier/typeahead-addresspicker.png)](http://travis-ci.org/sgruhier/typeahead-addresspicker)

It's not an extension of typeahead plugin itself, but a new data source for [twitter typeahead](http://twitter.github.io/typeahead.js/) (version > 0.10.0)

The `AddressPicker` is a subclass of a [Bloodhound](https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md) class. It connects suggestions to [Google Map AutocompleteService](https://developers.google.com/maps/documentation/javascript/reference#AutocompleteService).

But it's much more than a simple suggestion engine because it can be linked to a google map to display/edit location.

<img src="https://raw.github.com/sgruhier/typeahead-addresspicker/master/screenshot.png"/>

# How to use

## Without a Google Map

The simplest usage is to use it as suggestion engine, without displaying results on google map.

1) Include typeahead and google map with places activated

```html
<script src="http://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&libraries=places"></script>
<script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.2/jquery.min.js"></script>
<script src="../dist/typeahead.js"></script>
<script src="../dist/typeahead-addresspicker.js"></script>
```

2) Add an input text

```html
<input id="address" type="text" placeholder="Enter an address">
```

3) Instanciate an `AddressPicker` and a `typeahead`

```js
var addressPicker = new AddressPicker();

$('#address').typeahead(null, {
  displayKey: 'description',
  source: addressPicker.ttAdapter()
});
```

## With a Google Map

For a better user experience, you can connect it to a google map to display results. 
You just need to add a div as for a google map place holder and connect it to the `AddressPicker`

1) As before

2) Add a div

```html
<input id="address" type="text" placeholder="Enter an address">
<div id="map"></div>
```

3) Instantiate an `AddressPicker` with the google map div element or ID and connect typeahead events.

```js
// instantiate the addressPicker suggestion engine (based on bloodhound)
var addressPicker = new AddressPicker({
 map: {
  id: '#map'
 }
});

// instantiate the typeahead UI
$('#address').typeahead(null, {
  displayKey: 'description',
  source: addressPicker.ttAdapter()
});

// Bind some event to update map on autocomplete selection
$('#address').bind('typeahead:selected', addressPicker.updateMap);
$('#address').bind('typeahead:cursorchanged', addressPicker.updateMap);
```


# Options

When you instantiate a new `AddressPicker` you can pass a list of options `new AddressPicker(options)`

Available Options:

* `map` (Hash): Map id and options to link typeahead to a goggle map (default: none).
  * `id` (String/Element) DOM map element or CSS selector
  * all [google.maps.Map](https://developers.google.com/maps/documentation/javascript/reference?csw=1#MapOptions) constructor options. Default values are:
  ```js 
  {
    zoom: 3,
    center: new google.maps.LatLng(0, 0),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  ```

* `marker` (Hash): Marker options display on the map.
  * All [google.maps.Marker](https://developers.google.com/maps/documentation/javascript/reference?csw=1#MarkerOptions) constructor options.
  Default values are:
  ```js 
  {
    draggable: true,
    visible: false,
    position: MAP_CENTER
  }
  ```
* `autocompleteService` (Hash) : options passed to google.maps.places.AutocompleteService#getPlacePredictions (default: `{types: ['geocode']}`)
For more details read Google [documentation](https://developers.google.com/maps/documentation/javascript/reference#AutocompletionRequest). You can add a lot of options, like get only address for a country, or get only cities.

  Example To get only cities in United States: 
  ```js 
  {
    autocompleteService: {
      types: ['(cities)'], 
      componentRestrictions: { country: 'US' }
    }
  }
  ```

* `zoomForLocation` (Number): Zoom value when an accurate address is selected (default: 16).
* `reverseGeocoding` (Boolean): Reverse geocoding when marker is dragged on map (default: false).
* `placeDetails` (Boolean): If not using with a map, you can skip the `getDetails` portion to speed up the query (default: false).

# Events

Only one event is trigger by `AddressPicker` object: `addresspicker:selected`.
The event is fired when an address is selected or when the marker is dragged. If reverseGeocoding is activated, a full response is trigger, otherwise only lat/lng.

To simplify google response parsing, we fire an object of type `AddressPickerResult` with some accessors:
* `lat()`
* `lng()`
* `addressTypes()`
* `addressComponents()`
* `nameForType: (type, shortName = false)`

Listen that event to get values you need and store them in your form.
Here is an example:

```js
// Proxy inputs typeahead events to addressPicker
addressPicker.bindDefaultTypeaheadEvent($('#address'))

// Listen for selected places result
$(addressPicker).on('addresspicker:selected', function (event, result) {
  $('#your_lat_input').val(result.lat());
  $('#your_lng_input').val(result.lng());
  $('#your_city_input').val(result.nameForType('locality'));
});
``` 

# Tests

The code is tested as much as possible. If you want to add features, please add spec in your pull request.

# Demo

A demo is included in the github repository, and is available here: [http://sgruhier.github.io/typeahead-addresspicker](http://sgruhier.github.io/typeahead-addresspicker)

Quick example to show how to use twitter typeahead autocomplete and google map API to make an address picker.

This example is just a first try and could be enhanced to fully replace my previous address picker: http://xilinus.com/jquery-addresspicker/demos/

Any suggestions (using issues) or pull requests are welcome.


# Todo

* Connect HTML5 geolocalisation API to display user position
* Anything else that could make sense to be added :). You can open an issue with a label "feature" to open a discussion on a feature/API you'd like to add.

# Credits

@copyright Sébastien Gruhier / Xilinus (http://xilinus.com - http://v3.maptimize.com - http://buy.maptmize.com)
