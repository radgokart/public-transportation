/* import idb from 'lib/idb'; */

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

    function getStations() {
        /* Get station list from BART api and store it in model */
        $.ajax({
    		url: 'http://api.bart.gov/api/stn.aspx?cmd=stns&key=MW9S-E7SL-26DU-VV8V',
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
    		url: 'http://api.bart.gov/api/sched.aspx?cmd=depart&orig=' + orig.value + '&dest=' + dest.value + '&date=now&key=MW9S-E7SL-26DU-VV8V&b=2&a=2&l=1',
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
    		}
    	});
    }

    orig.onchange = function() {
        if (orig.value == dest.value) {
            console.log('Can\'t do the same, sorry.');
            self.attributes_for_trips.removeAll();
            self.legs_of_trips.removeAll();
        } else {
            updateRoute();
        }
    };

    dest.onchange = function() {
        if (orig.value == dest.value) {
            console.log('Can\'t do the same, sorry.');
            self.attributes_for_trips.removeAll();
            self.legs_of_trips.removeAll();
        } else {
            updateRoute();
        }
    };
}; /* end of ViewModel */

ko.applyBindings(new ViewModel()); /* end of this file */
