(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.AddressPicker = (function(_super) {
    __extends(AddressPicker, _super);

    function AddressPicker(options) {
      if (options == null) {
        options = {};
      }
      this.updateMap = __bind(this.updateMap, this);
      options = $.extend({
        local: [],
        datumTokenizer: function(d) {
          return Bloodhound.tokenizers.whitespace(d.num);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace
      }, options);
      AddressPicker.__super__.constructor.call(this, options);
      if (options.map) {
        this.initMap(options.map);
      }
    }

    AddressPicker.prototype.initMap = function(options) {
      this.placeService = new google.maps.places.PlacesService(document.createElement('div'));
      options = $.extend({
        zoom: 3,
        center: new google.maps.LatLng(0, 0),
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }, options);
      this.map = new google.maps.Map($(options.id)[0], options);
      return this.marker = new google.maps.Marker({
        position: options.center,
        map: this.map,
        visible: false
      });
    };

    AddressPicker.prototype.get = function(query, cb) {
      var service;
      service = new google.maps.places.AutocompleteService();
      return service.getPlacePredictions({
        input: query,
        types: ["geocode"]
      }, function(predictions) {
        var data, suggestion, _i, _len;
        data = [];
        for (_i = 0, _len = predictions.length; _i < _len; _i++) {
          suggestion = predictions[_i];
          data.push(suggestion);
        }
        return cb(data);
      });
    };

    AddressPicker.prototype.updateMap = function(event, place) {
      return this.placeService.getDetails(place, (function(_this) {
        return function(response) {
          _this.marker.setPosition(response.geometry.location);
          _this.marker.setVisible(true);
          if (response.geometry.viewport) {
            return _this.map.fitBounds(response.geometry.viewport);
          } else {
            _this.map.setCenter(response.geometry.location);
            return _this.map.setZoom(16);
          }
        };
      })(this));
    };

    return AddressPicker;

  })(Bloodhound);

}).call(this);
