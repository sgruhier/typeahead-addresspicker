# Typeahead Address Picker [![Build Status](https://api.travis-ci.org/sgruhier/typeahead-addresspicker.png)](http://travis-ci.org/sgruhier/typeahead-addresspicker)

It's not an extension of typeahead plugin itself, but a new data source for [twitter typeahead](http://twitter.github.io/typeahead.js/) (version > 0.10.0)

The ```AddressPicker`` is a subclass of a [Bloodhound](https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md) class. It connects suggestions to [Google Map AutocompleteService](https://developers.google.com/maps/documentation/javascript/reference#AutocompleteService).

But it's much more than a simple suggestion engine because it can be linked to a google map to display/edit location.

<img src="https://raw.github.com/sgruhier/typeahead-addresspicker/master/screenshot.png"/>

# How to use

## Without a Google Map

The simplest usage is to use it as suggestion engine, without displaying results on google map.

1) Include typeahead and google map with places activated

```js
 <script src="http://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&libraries=places"></script>
 <script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.2/jquery.min.js"></script>
 <script src="../dist/typeahead.js"></script>
 <script src="../dist/typeahead-addresspicker.js"></script>
```

2) Add an input text

```html
<input id="address" type="text" placeholder="Enter an address">
```

3) Instanciate an ```AddressPicker``` and a ```typeahead```

```js
var addressPicker = new AddressPicker();
$('#address').typeahead(null, {
  displayKey: 'description',
  source: addressPicker.ttAdapter()
});
```

## With a Google Map

For a better user experience, you can connect it to a google map to display results. 
You just need to add a  div as for a google map place holder and connect it to the ```AddressPicker```

1) As before

2) Add a div

```html
<input id="address" type="text" placeholder="Enter an address">
<div id="map"></div>
```

3) Instanciate an ```AddressPicker``` with the google map div element or ID and connect typeahead events.

```js
// instantiate the addressPicker suggestion engine (based on bloodhound)
var addressPicker = new AddressPicker({map: {id: '#map'}});

// instantiate the typeahead UI
$('#address').typeahead(null, {
  displayKey: 'description',
  source: addressPicker.ttAdapter()
});

// Bind some event to update map on autocomplete selection
$('#address').bind("typeahead:selected", addressPicker.updateMap);
$('#address').bind("typeahead:cursorchanged", addressPicker.updateMap);
```


# API

TODO

# Tests

The code is tested as much as possible. If you want to add features, please add spec in your pull request.

# Demo

A demo is included in the github repository, and is available here: [http://sgruhier.github.io/typeahead-addresspicker](http://sgruhier.github.io/typeahead-addresspicker)

Quick example to show how to use twitter typeahead autocomplete and google map API to make an address picker.

This example is just a first try and could be enhanced to fully replace my previous address picker: http://xilinus.com/jquery-addresspicker/demos/

Any suggestions (using issues) or pull requests are welcome.


# Todo

* Coonect HTML5 geolocalisation API to display user position
* Add reverse geo-coding
* Add more options for AutocompleteService
* Anything else that could make sense to be added :). You can open an issue with a label "feature" to open a discussion on a feature/API you'd like to add.

# Credits

@copyright Sébastien Gruhier / Xilinus (http://xilinus.com - http://v3.maptimize.com - http://buy.maptmize.com)
