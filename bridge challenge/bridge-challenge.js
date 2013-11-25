/**
 * Bay Bridges Challenge
 * To solve the problem I'll recursively remove the bridge with more intersections. In case we have two or more bridges
 * with the same number of intersections, I'll remove the shortest one (in km) bearing in mind the earth is round. 
 * This way the company saves money, building the same number of bridges but using less concrete.
 * @author Javier Cobos Mesa <javiercobosmesa@gmail.com>
 * @version 1.0
 * @see https://www.codeeval.com/public_sc/109/
 */ 

var fs  = require("fs");
 
/**
 * Bridge Class
 */
function Bridge(data) {
	this.id = data.id;
	this.pointA = data.pointA;
	this.pointB = data.pointB;
	this.intersections = 0;
	this.length = 0; // in Km , bearing in mind our planet is round, Galileo style ;)
	this.calcLength();
}

/**
 * Bridge Class's Method to calculate the bridge's length
 * In case of two possible solutions, we will keep the shortest bridge, since is the cheapest
 * and the company needs to maximize the ROI :)
 * By the use of prototype I'm not redeclaring the same function in each instance, saving memory 
 */
Bridge.prototype.calcLength = function() {
	
	/**
	 * Let's say our planet is not flat
	 * @see http://www.movable-type.co.uk/scripts/latlong.html
	 */
	 
	function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
	  
		var R = 6371, // Radius of the earth in km
		dLat = deg2rad(lat2-lat1),  // deg2rad below
		dLon = deg2rad(lon2-lon1),
		a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2),
		c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)),
		d = R * c; // Distance in km
		return d;
	}

	function deg2rad(deg) {
	  return deg * (Math.PI/180)
	}
	
	this.length = getDistanceFromLatLonInKm(this.pointA.x,this.pointA.y,this.pointB.x,this.pointB.y);
}


 
/** 
 * Main function, global execution
 */
function run() {
	
	var bridges = [], 
	finalBridges = [],
	mostCrossedBridge;
	
	/**
	 * Obtains input data and create instances. bridges array is populated
	 */
	function getInputData() {
	
		if(!process.argv[2]) {
			console.log("Please, type a input file path");
			return false;
		}
		
		fs.readFileSync(process.argv[2]).toString().split('\n').forEach(function (line) {

			var points, l, i;
			
			if (line != "") {
			
				id = line.match(/^(\d){1,}/gi)[0];			
				points = line.replace(/^(\d){1,}:\s/g,'').replace(/[\(\)\[\]\s]/g,'').split(",");
				l = points.length;

				for(var i = 0; i< l; ++i){
					points[i] = parseFloat(points[i]);
				}
				
				bridges.push(new Bridge({
					id : id,
					pointA : {
						y : points[0],
						x : points[1]
					},
					pointB : {
						y : points[2],
						x : points[3]
					}
				}));
			}
			
			points = l = i = null;
		});
		
		return (bridges.length > 0);
	}
	
	/**
	 * 
	 */
	function calcBestCombination() {

		var i,l,j,bridgeA,bridgeB,intersected;
		
		/**
		 * Those two functions calculate if two segments AB CD intersect
		 * @see http://bryceboe.com/2006/10/23/line-segment-intersection-algorithm/
		 */
		function ccw(A,B,C) {
			return (C.y-A.y)*(B.x-A.x) > (B.y-A.y)*(C.x-A.x);
		}
		function intersect(A,B,C,D) {
			return ccw(A,C,D) != ccw(B,C,D) && ccw(A,B,C) != ccw(A,B,D);
		}

		/**
		 * Sort Bridges by id
		 */
		function orderById(a,b) {
		  return a.id-b.id;
		}
		
		/**
		 * Sort Bridges by intersections
		 */
		function orderByIntersections(a,b) {
		  return -(a.intersections-b.intersections);
		}
		

		/**
		 * Sort Bridges by length
		 */
		function orderByLength(a,b) {
		  return -(a.length-b.length);
		}		
		
		/**
		 * Updates the number of intersections and moves 0 intersections bridges to final stack
		 */
		function getIntersetions() {
			l = bridges.length;
			// This nested loop will go through all the possible bridge combinations without repeating AB BA
			while(l--) {
				bridgeA = bridges[l];
				for(j=l-1;j>=0;--j) {
					bridgeB = bridges[j];
					intersected = intersect(bridgeA.pointA,bridgeA.pointB,bridgeB.pointA,bridgeB.pointB);
					if(intersected) {
						bridgeB.intersections = bridgeB.intersections + 1;
						bridgeA.intersections = bridgeA.intersections + 1;
					}	
				}	
			}
			l = null;
		}
		
		/**
		 * Move 0 intersections bridges to final stack
		 */
		function moveBridges() {
			var l = bridges.length;
			while(l--) {
				if( bridges[l].intersections == 0 ) {
					finalBridges.push(bridges.splice(l,1)[0]);
				}
			}
			l = null;
		}

		/**
		 * Remove the bridge with more intersections.
		 * If there's another one with the same number of intersections than the highest, 
		 * we'll remove the longest one since the company needs to save money and maximize ROI.
		 */
		function removeMoreIntersected() {
			var i,kml,l = bridges.length,
			highest,
			lengthStack = [],
			similarIntersections = false;
			
			// lets sort by number of intersections
			bridges.sort(orderByIntersections);
			highest = bridges[0].intersections;
			
			for(var i=1;i<l;++i) {
				if(bridges[i].intersections == highest) {
					lengthStack.push(bridges[i]);
				}
				else {
					break;
				}
			}
		
			if((kml = lengthStack.length) > 0) {
				lengthStack.push(bridges[0]);
				// Order by bridge length
				lengthStack.sort(orderByLength);
				for(i=0;i<l;++i) {
					if(bridges[i].id == lengthStack[0].id){
						// Remove this item because is the longer and more expensive
						bridges.splice(i,1);
						similarIntersections = true;
						break;
					}
				}
			}
			// If there's no other like the highest, let's remove the one with more intersections
			if( !similarIntersections ) {
				bridges.splice(0,1);
			}
			
			i = kml = l = null;
		}
		
		/**
		 * After each iteration intersections must be 0 again to recalculate.
		 */
		function resetIntersections() {
			var i,l = bridges.length;
			for(i=0;i<l;++i){
				bridges[i].intersections = 0;
			}
			i = l = null;
		}

		while( bridges.length > 0) {
			resetIntersections();
			// Step 1 : Get the number of intersections for each bridge.
			getIntersetions();
			// Step 2 : Bridges with 0 intersections go to final stack
			moveBridges();
			// Step 3: Remove the one with more intersections
			if(bridges.length > 0) {
				removeMoreIntersected();
			}
		}
		// Final result sorted by id
		finalBridges.sort(orderById);
		
		// print final result
		finalBridges.forEach(function(bridge){
			console.log(bridge.id);
		});
		
		i = l = j = bridgeA = bridgeB = intersected = null;
	}
	
	// if we have data, lets do something
	if(getInputData()) {
		calcBestCombination();
	}
	
	bridges = finalBridges = mostCrossedBridge = null;
}

run();