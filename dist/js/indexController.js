if("serviceWorker"in navigator){navigator.serviceWorker.register("/sw.js").then(function(reg){}).catch(function(err){console.log(err)})}function xmlToJson(xml){var obj={};if(xml.nodeType==1){if(xml.attributes.length>0){obj["@attributes"]={};for(var j=0;j<xml.attributes.length;j++){var attribute=xml.attributes.item(j);obj["@attributes"][attribute.nodeName]=attribute.nodeValue}}}else if(xml.nodeType==3){obj=xml.nodeValue}if(xml.hasChildNodes()){for(var i=0;i<xml.childNodes.length;i++){var item=xml.childNodes.item(i);var nodeName=item.nodeName;if(typeof obj[nodeName]=="undefined"){obj[nodeName]=xmlToJson(item)}else{if(typeof obj[nodeName].push=="undefined"){var old=obj[nodeName];obj[nodeName]=[];obj[nodeName].push(old)}obj[nodeName].push(xmlToJson(item))}}}return obj}var model={stationList:null,route:null};var ViewModel=function(){var self=this;var orig=document.getElementById("origInput");var dest=document.getElementById("destInput");self.stations=ko.observableArray();self.trips=ko.observableArray();self.attributes_for_trips=ko.observableArray();self.legs_of_trips=ko.observableArray();self.trip_origin=ko.observable($("#origInput option:selected").text());self.trip_destination=ko.observable($("#destInput option:selected").text());var makeChildrenObservables=function(object){if(!ko.isObservable(object))return;for(var child in object()){if(!ko.isObservable(object()[child])){object()[child]=ko.observable(object()[child])}makeChildrenObservables(object()[child])}};function getStations(){$.ajax({url:"http://api.bart.gov/api/stn.aspx?cmd=stns&key=MW9S-E7SL-26DU-VV8V",dataType:"xml",success:function(response){Promise.resolve(response).then(function(xml){model.stationList=xmlToJson(xml).root.stations.station;model.stationList.forEach(function(station){for(var key in station){station[key]=station[key]["#text"]}});self.stations(model.stationList)})}})}getStations();function updateRoute(){$.ajax({url:"http://api.bart.gov/api/sched.aspx?cmd=depart&orig="+orig.value+"&dest="+dest.value+"&date=now&key=MW9S-E7SL-26DU-VV8V&b=2&a=2&l=1",dataType:"xml",success:function(response){Promise.resolve(response).then(function(xml){model.trips=xmlToJson(response).root.schedule.request.trip;model.trips.forEach(function(trip){for(var item in trip){if(item=="@attributes"){var tempArray=[];tempArray.push(trip[item]);trip[item]=tempArray}else{var numberOfLegs=0;for(var legItem in trip[item]){numberOfLegs++}if(numberOfLegs===1){var tempArray1=[];tempArray1.push(trip[item][legItem]);trip[item]=tempArray1}else{var tempArray2=[];for(var index=0;index<trip[item].length;index++){tempArray2.push(trip[item][index]["@attributes"])}trip[item]=tempArray2}}}});self.trips(model.trips);self.attributes_for_trips.removeAll();for(var trip in self.trips()){self.attributes_for_trips.push(self.trips()[trip]["@attributes"][0])}self.trip_origin($("#origInput option:selected").text());self.trip_destination($("#destInput option:selected").text());makeChildrenObservables(self.attributes_for_trips);self.legs_of_trips.removeAll();for(var thisTrip in self.trips()){var temp_leg_array=[];for(var j=0;j<self.trips()[thisTrip].leg.length;j++){temp_leg_array.push(self.trips()[thisTrip].leg[j])}self.legs_of_trips.push(ko.observableArray(temp_leg_array))}makeChildrenObservables(self.legs_of_trips())})},error:function(response){console.log("Ajax call failed");self.trip_origin("No network connection");self.trip_destination("Previously found routes may still be available");self.attributes_for_trips.removeAll();self.legs_of_trips.removeAll()}})}orig.onchange=function(){if(orig.value==dest.value){self.attributes_for_trips.removeAll();self.legs_of_trips.removeAll();self.trip_origin($("#origInput option:selected").text());self.trip_destination($("#destInput option:selected").text())}else{updateRoute()}};dest.onchange=function(){if(orig.value==dest.value){self.attributes_for_trips.removeAll();self.legs_of_trips.removeAll();self.trip_origin($("#origInput option:selected").text());self.trip_destination($("#destInput option:selected").text())}else{updateRoute()}}};ko.applyBindings(new ViewModel);