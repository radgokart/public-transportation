/* Check for service worker support, code help came from https://developers.google.com/web/fundamentals/getting-started/push-notifications/step-03?hl=en */
if ('serviceWorker' in navigator) {
 navigator.serviceWorker.register('./sw.js').then(function(reg) {
 }).catch(function(err) {
   console.log(err);
 });
}

/* function found at https://davidwalsh.name/convert-xml-json*/
function xmlToJson(xml) {
	/* Create the return object */
	var obj = {};

	if (xml.nodeType == 1) { /* element */
		/* do attributes */
		if (xml.attributes.length > 0) {
		obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { /* text */
		obj = xml.nodeValue;
	}
	/* do children */
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
}

var model = {
    stationList: null,
    route: null
};

var ViewModel = function() {
    var self = this;
    var orig = document.getElementById('origInput');
    var dest = document.getElementById('destInput');

    self.stations = ko.observableArray(); /* populated by getStations */
    self.trips = ko.observableArray(); /* populated by updateRoute */
    self.attributes_for_trips = ko.observableArray();
    self.legs_of_trips = ko.observableArray();
    self.trip_origin = ko.observable();
    self.trip_destination = ko.observable();
    self.trip_duration = ko.observable();

    /*
    http://stackoverflow.com/questions/10555115/knockout-js-make-every-nested-object-an-observable
    */
    var makeChildrenObservables = function (object) {
        if(!ko.isObservable(object)) return;

        // Loop through its children
            for (var child in object()) {
                if (!ko.isObservable(object()[child])) {
                    object()[child] = ko.observable(object()[child]);
                }
                makeChildrenObservables(object()[child]);
            }
    };

    function findTimeDifference(start, end) {
        var start_hour;
        var start_min;
        var end_hour;
        var end_min;

        if (start.length === 7) {
            start_hour = parseInt(start.slice(0,1), 10);
            if (start.slice(5) == 'PM') {
                start_hour = start_hour + 12;
            }
            start_min = parseInt(start.slice(2,4), 10);
        } else {
            start_hour = parseInt(start.slice(0,2), 10);
            if (start.slice(6) == 'PM') {
                start_hour = start_hour + 12;
            }
            start_min = parseInt(start.slice(3,5), 10);
        }

        if (end.length === 7) {
            end_hour = parseInt(end.slice(0,1), 10);
            if (end.slice(5) == 'PM') {
                end_hour = end_hour + 12;
            }
            end_min = parseInt(end.slice(2,4), 10);
        } else {
            end_hour = parseInt(end.slice(0,2), 10);
            if (end.slice(6) == 'PM') {
                end_hour = end_hour + 12;
            }
            end_min = parseInt(end.slice(3,5), 10);
        }

        var start_object = new Date(0, 0, 0, start_hour, start_min);
        var end_object = new Date(0, 0, 0, end_hour, end_min);

        var time_diff = Math.abs(end_object.getTime() - start_object.getTime());
        var time_diff_in_seconds = time_diff/1000;
        var time_diff_in_minutes = time_diff_in_seconds/60;

        self.trip_duration(time_diff_in_minutes);
    }

    function getStations() {
        /* Get station list from BART api and store it in model */
        $.ajax({
    		url: 'https://api.bart.gov/api/stn.aspx?cmd=stns&key=MW9S-E7SL-26DU-VV8V',
    		dataType: 'xml',
    		success: function(response) {
    			Promise.resolve(response).then(function(xml) {
                    /* this digs into object to return array of stations and their info */
                    model.stationList = xmlToJson(xml).root.stations.station;
                    model.stationList.forEach(function(station) {
                        /* keys resolve to object wrappers which need to be removed */
                        for (var key in station) {
                            station[key] = station[key]['#text'];
                        }
                    });
                    self.stations(model.stationList);
                });
    		}
    	});
    }
    /* now call it */
    getStations();

    function updateRoute() {
        $.ajax({
    		url: 'https://api.bart.gov/api/sched.aspx?cmd=depart&orig=' + orig.value + '&dest=' + dest.value + '&date=now&key=MW9S-E7SL-26DU-VV8V&b=2&a=2&l=1',
    		dataType: 'xml',
    		success: function(response) {
    			Promise.resolve(response).then(function(xml) {
                    /* takes XML object, converts to JSON and then parses into more readable format, which is rootobject>key>array of object(s) */
                    model.trips = xmlToJson(response).root.schedule.request.trip;
                    model.trips.forEach(function(trip) {
                        for (var item in trip) {
                            if (item == '@attributes') {
                                var tempArray = [];
                                tempArray.push(trip[item]);
                                trip[item] = tempArray;
                            } else {
                                var numberOfLegs = 0;
                                for (var legItem in trip[item]) {
                                    /* need to count how many leg items since they're objects in an object and array.length won't work */
                                    numberOfLegs++;
                                }
                                if (numberOfLegs === 1) {
                                    var tempArray1 = [];
                                    tempArray1.push(trip[item][legItem]);
                                    trip[item] = tempArray1;
                                } else {
                                    /* two or more legs */
                                    var tempArray2 = [];
                                    for (var index = 0; index < trip[item].length; index++) {
                                        tempArray2.push(trip[item][index]['@attributes']);
                                    }
                                    trip[item] = tempArray2;
                                }
                            }
                        }
                    });

                    self.trips(model.trips);

                    /* now push attributes into another array to make KO DOM stuff easier */
                    self.attributes_for_trips.removeAll();
                    for (var trip in self.trips()) {
                        self.attributes_for_trips.push(self.trips()[trip]['@attributes'][0]);
                    }

                    self.trip_origin($('#origInput option:selected').text());
                    self.trip_destination($('#destInput option:selected').text());

                    var start_time_string = self.attributes_for_trips()[0].origTimeMin;
                    var end_time_string = self.attributes_for_trips()[0].destTimeMin;

                    findTimeDifference(start_time_string, end_time_string);
                    makeChildrenObservables(self.attributes_for_trips);

                    /* now push legs of trips into another array to make KO DOM stuff easier */
                    self.legs_of_trips.removeAll();
                    for (var thisTrip in self.trips()) {
                        var temp_leg_array = [];
                        for (var j = 0; j < self.trips()[thisTrip].leg.length; j++) {
                            temp_leg_array.push(self.trips()[thisTrip].leg[j]);
                        }
                        self.legs_of_trips.push(ko.observableArray(temp_leg_array));
                    }
                    makeChildrenObservables(self.legs_of_trips());
                });
    		},
            error: function(response) {
                console.log('Ajax call failed');
                self.trip_origin('No network connection');
                self.trip_destination('Previously found routes may still be available');
                self.trip_duration(0);
                self.attributes_for_trips.removeAll();
                self.legs_of_trips.removeAll();
            }
    	});
    }

    orig.onchange = function() {
        if (orig.value == dest.value) {
            self.attributes_for_trips.removeAll();
            self.legs_of_trips.removeAll();
            self.trip_origin($('#origInput option:selected').text());
            self.trip_destination($('#destInput option:selected').text());
            self.trip_duration(0);
        } else {
            updateRoute();
        }
    };

    dest.onchange = function() {
        if (orig.value == dest.value) {
            self.attributes_for_trips.removeAll();
            self.legs_of_trips.removeAll();
            self.trip_origin($('#origInput option:selected').text());
            self.trip_destination($('#destInput option:selected').text());
            self.trip_duration(0);
        } else {
            updateRoute();
        }
    };

    dest.onchange();


}; /* end of ViewModel */

var myViewModel = new ViewModel();
myViewModel.trip_origin('12th St. Oakland City Center');
myViewModel.trip_destination('12th St. Oakland City Center');

ko.applyBindings(myViewModel);
/* end of this file */
