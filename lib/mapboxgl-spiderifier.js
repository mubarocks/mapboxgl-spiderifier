function MapboxglSpiderfier(map, userOptions){
  var util = {
      each: eachFn,
      map: mapFn,
      mapTimes: mapTimesFn,
      eachTimes: eachTimesFn
    },
    NULL_FUNCTION = function(){
    },
    options = {
      circleSpiralSwitchover: 9, // show spiral instead of circle from this marker count upwards
      // 0 -> always spiral; Infinity -> always circle
      circleFootSeparation: 25, //related to circumference of circle
      spiralFootSeparation: 28, // related to size of spiral (experiment!) 
      spiralLengthStart: 15, // ditto
      spiralLengthFactor: 4, // ditto
      onClick: userOptions.onClick || NULL_FUNCTION,
      initializeMarker: userOptions.initializeMarker || NULL_FUNCTION
    },
    twoPi = Math.PI * 2,
    previousMarkerObjects = [];

  // Public:
  this.spiderfy = spiderfy;
  this.unspiderfy = unspiderfy;
  this.each = function(callback){
    util.each(previousMarkerObjects, callback);
  }

  // Private:
  function spiderfy(latLng, markers) {
    var spiderParams = generateSpiderParams(markers.length),
      markerObjects;

    unspiderfy();

    markerObjects = util.map(markers, function(marker, index) {
      var spiderParam = spiderParams[index],
        elements = createMarkerElements(spiderParam, marker),
        mapboxMarker,
        markerObject;

      mapboxMarker = new mapboxgl.Marker(elements.parent, {
        offset: [spiderParam.x, spiderParam.y]
      })
      .setLngLat(latLng);

      markerObject = {
        marker: marker, 
        elements: elements, 
        mapboxMarker: mapboxMarker,
        spiderParam: spiderParam
      };

      options.initializeMarker(markerObject);
      
      elements.parent.onclick = function(e){
        options.onClick(e, markerObject);
      };

      return markerObject;
    });

    util.each(markerObjects.reverse(), function(markerObject){
      markerObject.mapboxMarker.addTo(map);
    });

    previousMarkerObjects = markerObjects;
  };

  function unspiderfy(){
    util.each(previousMarkerObjects, function(oldMarkerObject){
      oldMarkerObject.mapboxMarker.remove();
    });
    previousMarkerObjects = [];
  }

  function generateSpiderParams(count) {
    if (count >= options.circleSpiralSwitchover) {
      return generateSpiralParams(count);
    } else {
      return generateCircleParams(count);
    }
  }

  function generateSpiralParams(count, centerPt) {
    var legLength = options.spiralLengthStart,
      angle = 0;
    return util.mapTimes(count, function(index) {
      var pt;
      angle = angle + (options.spiralFootSeparation / legLength + index * 0.0005);
      pt = {
        x: legLength * Math.cos(angle),
        y: legLength * Math.sin(angle),
        angle: angle,
        legLength: legLength,
        index: index
      };
      legLength = legLength + (twoPi * options.spiralLengthFactor / angle)
      return pt;
    });
  }

  function generateCircleParams(count, centerPt) {
    var circumference = options.circleFootSeparation * (2 + count),
      legLength = circumference / twoPi, // = radius from circumference
      angleStep = twoPi / count;

    return util.mapTimes(count, function(index) {
      var angle = index * angleStep;
      return {
        x: legLength * Math.cos(angle),
        y: legLength * Math.sin(angle),
        angle: angle,
        legLength: legLength,
        index: index
      };
    });
  }

  function createMarkerElements(spiderParam, marker) {
    var parentElem = document.createElement('div'),
      markerElem = document.createElement('div'),
      lineElem = document.createElement('div');
    
    parentElem.className = 'spidered-marker';
    lineElem.className = 'line-div';
    markerElem.className = 'icon-div';  
    
    parentElem.appendChild(lineElem);
    parentElem.appendChild(markerElem);
    
    lineElem.style.height = spiderParam.legLength + 'px';
    // lineElem.style.transform = 'rotate(' + (2*Math.PI - spiderParam.angle) +'rad)';
    lineElem.style.transform = 'rotate(' +   (spiderParam.angle - Math.PI/2) +'rad)';
    
    return {parent: parentElem, line: lineElem, marker: markerElem};
  }

  // Utility
  function eachFn(array, iterator){
    var i=0;
    if(!array || !array.length){
      return [];
    }
    for(i = 0; i < array.length; i++){
      iterator(array[i], i)
    }
  }

  function eachTimesFn(count, iterator){
    if(!count){
      return [];
    }
    for(i = 0; i < count; i++){
      iterator(i);
    }
  }

  function mapFn(array, iterator){
    var result = [];
    eachFn(array, function(item, i){
      result.push(iterator(item, i));
    })
    return result;
  }

  function mapTimesFn(count, iterator){
    var result = [];
    eachTimesFn(count, function(i){
      result.push(iterator(i));
    });
    return result;
  }
}