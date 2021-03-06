!function() {

	var width = 600,
    height = 600,
    centered;

	var arenaArray = [];
	var arenaData;

	var arenaK = 0.15;
	var eventPulldown = d3.select("#eventPulldown");

	var scatterDatePulldown = d3.select("#scatterDatePulldown");			 
	var minQtyPulldown = d3.select("#minQtyPulldown");
		
	var svg = d3.select("#arenaDiv").append("svg")
	    .attr("width", width)
	    .attr("height", height)
	    .attr("id","mainSVG");

	svg.append("rect")
	    .attr("class", "background")
	    .attr("width", width)
	    .attr("height", height);    

	var arena = svg.append("g")
	  .attr("transform", "translate(" + width / 32 + "," + height / 32 + ")")
	  .append("g")
	    .attr("id", "arena");

	    ;

	var scatterSvg;
	     

	var rectangles = svg.append("svg:g")
	    .attr("transform", "translate(" + width / 32 + "," + height / 32 + ")")
	  .append("g")
	    .attr("id", "rectangles");

	var circles = svg.append("svg:g")
	    .attr("transform", "translate(" + width / 32 + "," + height / 32 + ")")
	  .append("g")
	    .attr("id", "circles"); 
	                                                                                    
	var curcircles = svg.append("svg:g")
	    .attr("transform", "translate(" + width / 32 + "," + height / 32 + ")")
	  .append("g")
	    .attr("id", "circles");       
	    
	var infoDiv = d3.select("#info");
	var scatterDateDiv = d3.select("#scatterDateDiv");

	var h2Tag = d3.select("h2");
	var ticketData;

	var crislerFilename = "json/crisler.json";
	var consecoFilename = "json/concesco.json";
	var arenaFile = consecoFilename;

	var consecoRowFunc = function(d) { 
		if( !arenaData[d.vi] ) {
			return "";	
		}

		  if( Math.abs(arenaData[d.vi].angle) < 20.0 ) {
			  var seatAry = d.se.split(",");
			  var seatNum = 5.5;
			  if(seatAry.length > 0 && !isNaN(seatAry[0])) {
				  seatNum = seatAry[0];
			  }
		  	  
			  if(arenaData[d.vi].centroid[0] > arenaData["bbox"].centroid[0]) {	                 	  
				  return arenaData[d.vi].bbox.y + ((arenaData[d.vi].bbox.height/16)*(seatNum)); 	  
			  }
		
			  return arenaData[d.vi].bbox.y + arenaData[d.vi].bbox.height - ((arenaData[d.vi].bbox.height/16)*(seatNum));
		  }
		
		  if(arenaData[d.vi].centroid[1] > arenaData["bbox"].centroid[1]) {
			  return arenaData[d.vi].bbox.y + ((arenaData[d.vi].bbox.height/25)*(+d.rd));
		  }							
		  else {
			  return arenaData[d.vi].bbox.y + arenaData[d.vi].bbox.height - ((arenaData[d.vi].bbox.height/25)*(+d.rd));
		  }						
		};

	var crislerRowFunc = function(d) { 
		if( isNaN(d.rd) || !d.vi) {
			return "";
		}
		var isLower = d.va.substring(0,5) == "Lower";
		var topRow = isLower? 20 : 22;
		var secRow = isLower? +d.rd : +d.rd-21;

		  if( Math.abs(arenaData[d.vi].angle) < 20.0 ) {
			  var seatAry = d.se.split(",");
			  var seatNum = 5.5;
			  if(seatAry.length > 0 && !isNaN(seatAry[0])) {
				  seatNum = seatAry[0];
			  }
		  	  
			  if(arenaData[d.vi].centroid[0] > arenaData["bbox"].centroid[0]) {	                 	  
				  return arenaData[d.vi].bbox.y + ((arenaData[d.vi].bbox.height/16)*(seatNum)); 	  
			  }
		
			  return arenaData[d.vi].bbox.y + arenaData[d.vi].bbox.height - ((arenaData[d.vi].bbox.height/16)*(seatNum));
		  }
		
		  if(arenaData[d.vi].centroid[1] > arenaData["bbox"].centroid[1]) {
			  return arenaData[d.vi].bbox.y + ((arenaData[d.vi].bbox.height/topRow)*(secRow));
		  }							
		  else {
			  return arenaData[d.vi].bbox.y + arenaData[d.vi].bbox.height - ((arenaData[d.vi].bbox.height/topRow)*(secRow));
		  }
							
	};					

	var rowFunc = arenaFile == crislerFilename ? crislerRowFunc: consecoRowFunc; 
	var curPrices;
	var eventID = getParameterByName("eid");
	var eventURL;
	// 4351791 -- IU/Michigan
	//4374340,4373478,4374341,4373479,4374342,4380727. 4373476--allsess

	var availableEvents = [{"id": "", "name": "Select an Event" },{ "id" : "4374340", "name": "BTT Session 1" },
								  { "id" : "4373478", "name": "BTT Session 2" },
								  { "id" : "4374341", "name": "BTT Session 3" },			
								  { "id" : "4373479", "name": "BTT Session 4" },	
								  { "id" : "4374342", "name": "BTT Session 5" },								  
								  { "id" : "4380727", "name": "BTT Session 6" },
								  { "id" : "4373476", "name": "BTT All Sessions" },
									{ "id" : "4351791", "name": "IU @ Michigan" }];	
	var refreshTries = 0;
								  
	eventPulldown.selectAll("option")
	      .data(availableEvents).enter()
	       .append("option") 
	         .attr("value",function(d,i){
	                return d.id;
	                  })
	         .attr("label",function(d){return d.name});            
	         eventPulldown.on("change", function() {
	         	window.location.assign(location.pathname + "?eid=" +eventPulldown[0][0].options[eventPulldown[0][0].selectedIndex].value)		
	         });

	var minQtyValues = [1,2,3,4,5,6,7,8,9,10];         
	         
	if( !eventID ) {
		eventID = "4373476";	
	}
	for( var i = 0; i < eventPulldown[0][0].options.length; i++ ) {
		if(eventPulldown[0][0].options[i].value === eventID) {
			eventPulldown[0][0].selectedIndex = i;
		}
	}
	refreshPage();

	function refreshPage() { 
		eventID = eventPulldown[0][0].options[eventPulldown[0][0].selectedIndex].value;
		
		if( !eventID || isNaN(eventID) ){
				return;
		}
		
		
		arena.selectAll("path").remove(); 
		arena.selectAll("text").remove(); 
		circles.selectAll("circle").remove();
		curcircles.selectAll("circle").remove();
		
		if(scatterSvg) 
			scatterSvg.remove();
		
		d3.json("/curprices/" + eventID,function(pCurPrices) {
				if(!pCurPrices && refreshTries < 2) {
					// didn't get file. Try again. We only do this because Azure seems to have problems
					// retrieving the file if this is the first hit to the site in a while.
						refreshTries++;
						refreshPage();
						return;
				
				}
				refreshTries = 2;
				
				curPrices = pCurPrices.histPrices;
				histPrices = pCurPrices.histPrices;
				
				var scatterDatePulldown = d3.select("#scatterDatePulldown");	
				scatterDatePulldown.selectAll("option")
						.data(curPrices.dateAry).enter()
						 .append("option") 
							.attr("value",function(d,i){
									 return i;
										})
							.attr("label",function(d){
								var myDate = new Date(d);
								return myDate.toLocaleDateString() + " " + myDate.toLocaleTimeString() ;
							});            
				scatterDatePulldown.on("change", refreshScatter);	
				
				minQtyPulldown.selectAll("option")
						.data(minQtyValues).enter()
						 .append("option") 
							.attr("value",function(d){
									 return d;
										})
							.attr("label",function(d){
								return d;
							});            
				minQtyPulldown.on("change", refreshScatter);				
				
				if(eventID== 4351791) {
					arenaFile = crislerFilename;
				}
				else {
					arenaFile = consecoFilename;	
				}
				
				rowFunc = arenaFile == crislerFilename ? crislerRowFunc: consecoRowFunc; 
				
				eventURL = "http://www.stubhub.com/"+ pCurPrices.genreUrlPath + "/" + pCurPrices.eventUrlPath 
				h2Tag.html("<a href='"+ eventURL + "' >" 
								+  pCurPrices.event.description + "</a>");
				
			 d3.json(arenaFile,function(json) {
					  arenaData = json;
							  
						  for( var key in arenaData ) {
							  arenaData[key].secID = key;
							  arenaData[key].ticketArray = [];
							  arenaData[key].curPriceAry = [];
							  arenaArray.push(arenaData[key]); 
						  }                                                                                        
					  
						  ticketData = [];
						  for( var key in histPrices.ticketHash ) {
							  histPrices.ticketHash[key].id = key; 
							  ticketData.push(histPrices.ticketHash[key]); 
						  }        
						  
						  for( var i = 0; i < ticketData.length; i++ ) {
							  if(ticketData[i].vi) {
								  arenaData[ticketData[i].vi].ticketArray.push( ticketData[i]);
							  }
						  }
		
						  for( var i = 0; i < curPrices.length; i++ ) {
							  if(curPrices[i].vi) {
								  arenaData[curPrices[i].vi].curPriceAry.push( curPrices[i]);
							  }
						  }				  
						  
						 var node =arena.selectAll("path")
							  .data(arenaArray)
							.enter().append("path")
							.attr("d", function(d) { 
										return d.p;
							})
							.style("fill",function(d) { return "white" })
							.attr("stroke","black")
							.attr("stroke-width","4px")
							.attr("transform", "scale(" + arenaK + ")")
							.style("visibility", function(d) { return d.secID=="bbox"? "hidden":"" })
							 // .on("click", click)
							  .on("mouseover", function(d){
									d3.select(this).style("fill","yellow");
							  //d3.selectAll("[chv^='chv_"+d.region.substring(4,6)+"_']").attr("class",getCountyDistrictColor);
							  })  
							  .on("mouseout",function(d){
									  d3.select(this).style("fill","white");
								 //d3.selectAll("[chv^='chv_"+d.region.substring(4,6)+"_']").attr("class",getCountyColor);
								 })
								 .each(function(d) {
									  var myBar = d3.select(this);
									  if (arenaData[d.secID]) {
											arenaData[d.secID].d3Bar = myBar;
											
											var bbox = myBar[0][0].getBBox();
											arenaData[d.secID].bbox = bbox;
											arenaData[d.secID].centroid = [bbox.x+bbox.width/2,bbox.y+bbox.height/2];
			
											
									  }
								 })
								 .each(function(d) {
									  if (arenaData[d.secID]) {
											// compute the angle from center court
											var adj = arenaData["bbox"].centroid[0]-d.centroid[0];
											var op = arenaData["bbox"].centroid[1]-d.centroid[1];
											var angle = ((180/Math.PI) * Math.atan(op/adj));
											
											arenaData[d.secID].angle = angle;
											arenaData[d.secID].d3Bar.attr("angle",angle);
											
									  }
								 });
		
						arena.selectAll("text")
							 .data(arenaArray)
						  .enter().append("text")
							 .attr("transform", function(d) { return "scale(" + arenaK + ") translate(" + d.centroid + ") "; })
							 .attr("dy", ".35em")
							.text(function(d) { 
									if(d.na) {
										var secAry = d.na.split(" ");
										return secAry[secAry.length-1]; 
									}
									else {
										return "";	
									}
							})
							.style("font-size", function(d) { 
								return  "50"; 
							});				
					
			/*         rectangles.selectAll("rect")
							  .data(arenaArray)
							.enter().append("rect")        
							.attr("x", function(d) { 
										return d.bbox.x;
							})
							.attr("width", function(d) { 
										return d.bbox.width;
							})  
							.attr("y", function(d) { 
										return d.bbox.y;
							})
							.attr("height", function(d) { 
										return d.bbox.height;
							})             
							.style("fill",function(d) { return "transparent" })
							.attr("stroke","orange")
							.style("stroke-width", "5px")             
							.attr("transform", function(d) {
						 
								var adj = arenaData["bbox"].centroid[0]-d.centroid[0];
								var op = arenaData["bbox"].centroid[1]-d.centroid[1];
								var angle = ((180/Math.PI) * Math.atan(op/adj))-90;
								
								var rotateStr = "(" + angle + " " +  d.centroid[0] + " " + d.centroid[1] + ")";
								return "scale(.2)";
							//	return "scale(.2) rotate" + rotateStr;		
							});  */ 
							

						circles.selectAll("circle")
							  .data(ticketData)
							.enter().append("circle")
							.attr("r", function(d) { 
									if(d.qt[d.qt.length-1] && d.qt.length == curPrices.dateAry.length) {
										return "20px";
									}
									else {
										return "0";	
									}
							})
							.style("fill",circleFill)
							.attr("stroke","black")
							.style("stroke-width", "1.5px")       
							.attr("fill-opacity", ".8")
							.attr("transform", "scale(" + arenaK + ")")
							.on("click", circleClick)
							  .on("mouseover", updateTicketInfo)  
							  .on("mouseout",function(d){
									  d3.select(this).style("fill",circleFill);
								 //d3.selectAll("[chv^='chv_"+d.region.substring(4,6)+"_']").attr("class",getCountyColor);
								 })
							  .attr("cx", function(d) { 
									  if( !arenaData[d.vi] || isNaN(d.rd)) {
										 return "";  
									  }
									  
									  var seatAry = d.se.split(",");
									  var seatNum = 5.5;
									  if(seatAry.length > 0 && !isNaN(seatAry[0])) {
										  seatNum = seatAry[0];
									  }
			
									  if( Math.abs(arenaData[d.vi].angle) < 20.0 ) {
											var isLower = d.va.substring(0,5) == "Lower";
											var topRow = isLower? 20 : 22;
											var secRow = isLower? +d.rd : +d.rd-21;
											
											if( arenaFile != crislerFilename ) {
												topRow = 25;
												secRow = +d.rd;
											}
											
											
										  if(arenaData[d.vi].centroid[0] > arenaData["bbox"].centroid[0]) {	                 	  
											  return arenaData[d.vi].bbox.x + ((arenaData[d.vi].bbox.width/topRow)*(secRow)); 	  
										  }
									
										  return arenaData[d.vi].bbox.x + arenaData[d.vi].bbox.width - ((arenaData[d.vi].bbox.width/topRow)*(secRow));	                 	  
									  }
									  
				 
									  return arenaData[d.vi].bbox.x + ((arenaData[d.vi].bbox.width/16)*seatNum); 
							  })
								.attr("cy", rowFunc)        ;   
			
							  
					  circles.append("circle")
						.attr("r", "10px") 
						.attr("cx", arenaData["bbox"].centroid[0])
						.attr("cy", arenaData["bbox"].centroid[1])
						.style("fill","blue")
						.attr("transform","scale(" + arenaK + ")");
					  				
						showTicketSupply();
						createScatterPlot(ticketData);
							  
				});  
		});
	}

	function updateTicketInfo(d){
		d3.select(this).style("fill","yellow");
		

		var latestPrice = d.pr[d.pr.length-1] ? "$" + d.pr[d.pr.length-1] : "Not Listed";
		
		var priceHistTable = "<table class='rounded-corner' ><tr><td colspan='3'>Price History</td></tr><tr><td>Date</td><td>Price</td><td>Qty</td></tr>";
		
		for(var i = 0; i < curPrices.dateAry.length; i++ ) {
			var myDate = new Date(		curPrices.dateAry[i]);
			if(d.pr[i] ) 
				priceHistTable += "<td>" + myDate.toLocaleDateString() + " " +myDate.toLocaleTimeString() + "</td><td>$" + d.pr[i] + "</td><td>" + d.qt[i] + "</td></tr>";
			else
				priceHistTable += "<td>" + myDate.toLocaleDateString() + " " + myDate.toLocaleTimeString() + "</td><td colspan='2' >Not Listed</td></tr>";			
		}
		
		var infoTable = "<table  class='rounded-corner'  ><tr><td>Qty</td><td>Sec</td><td>Row</td><td>Seats</td><td>Latest Price</td></tr>"
		infoTable += "<tr><td>" + d.qt[d.qt.length-1] + "</td><td>" + d.va + "</td><td>" + d.rd + "</td><td>" + d.se + "</td><td>" + latestPrice + "</td></tr></table>";


		
		
		infoDiv.html(infoTable  + priceHistTable);
	//d3.selectAll("[chv^='chv_"+d.region.substring(4,6)+"_']").attr("class",getCountyDistrictColor);
	}

	function showTicketSupply(){
		var supplyTable = "<table class='rounded-corner' ><tr><td colspan='2'>Supply History</td></tr><tr><td>Date</td><td>Number of Available Tickets</td></tr>";
		
		for(var i = 0; i < curPrices.dateAry.length; i++ ) {
			var myDate = new Date(		curPrices.dateAry[i]);
			if(curPrices.totalQtAry[i] ) 
				supplyTable += "<td>" + myDate.toLocaleDateString() + " " +myDate.toLocaleTimeString() + "</td><td>" + curPrices.totalQtAry[i] + "</td></tr>";
		}
		
		
		infoDiv.html(supplyTable);
	}


	function getSectionAdjustedRow(row,sec) {
		if( arenaFile == crislerFilename  ) {
			return row; 
		}
		if(sec.substring(0,5) == "Lower") {
			return row;	
		}
		if(sec.substring(0,5) == "Balco") {
			return row+35;	
		}
		
		return row+22;
	}

	function refreshScatter() {
		if(scatterSvg) 
			d3.select("#scatterDiv svg").remove();	
		
		createScatterPlot(ticketData);
	}

	function createScatterPlot(data) {
		var margin = {top: 20, right: 20, bottom: 30, left: 60},
			 width = 500 - margin.left - margin.right,
			 height = 500 - margin.top - margin.bottom;
		
		var x = d3.scale.linear()
			 .range([0, width]);
		
		var y = d3.scale.linear()
			 .range([height, 0]);
		
		var color = d3.scale.category10();
		
		var xAxis = d3.svg.axis()
			 .scale(x)
			 .orient("bottom");
		
		var yAxis = d3.svg.axis()
			 .scale(y)
			 .orient("left");
		
		var sinceDateIdx = +scatterDatePulldown[0][0].options[scatterDatePulldown[0][0].selectedIndex].value;
		var minQty = +minQtyPulldown[0][0].options[minQtyPulldown[0][0].selectedIndex].value;	
		
		var svg = d3.select("#scatterDiv").append("svg")
			 .attr("width", width + margin.left + margin.right)
			 .attr("height", height + margin.top + margin.bottom)
		  .append("g")
			 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		scatterSvg = svg;
		
		  x.domain(d3.extent(data, function(d) {
		  		  if( d.rd && !isNaN(d.rd) ) {
		  		  	  return getSectionAdjustedRow(+d.rd,d.va);
		  		  }
		  		  })
		  	  	).nice();
		  y.domain(d3.extent(data, function(d) { 
		  		if( d.pr[d.pr.length-1] && !isNaN(d.pr[d.pr.length-1]) ) {	
		  			var maxAmtVisible = eventID == 4373476? 1000 : 400;
		  			if(d.pr[d.pr.length-1] < maxAmtVisible) 
		  				return d.pr[d.pr.length-1];
		  		}
		  })).nice();
		
		  svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis)
			 .append("text")
				.attr("class", "label")
				.style("font-size", function(d) { 
							return  "14px"; 
						})	
				.attr("x", width)
				.attr("y", -6)
				.style("text-anchor", "end")
				.text("Row");
		
		  svg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
			 .append("text")
				.attr("class", "label")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("font-size", function(d) { 
							return  "14px"; 
						})			
				.style("text-anchor", "end")
				.text("Price")
		
		  var dots = svg.selectAll(".dot")
				.data(data)
			 .enter().append("circle")
				.attr("class", "dot")
			  .on("mouseover", updateTicketInfo)  
			  .on("mouseout",function(d){
					  d3.select(this).style("fill",circleFill);
				 //d3.selectAll("[chv^='chv_"+d.region.substring(4,6)+"_']").attr("class",getCountyColor);
				 })			
				.attr("r", 	 function(d) { 
						d.curTransIdx = -1;
						d.lastPriceSeen = d.pr[sinceDateIdx];
						d.hasQty = false;
						return "0"; 
						if(d.pr.length > 1 && !isNaN(d.pr[d.pr.length-1])) {
							if(!d.pr[curPrices.dateAry.length-1]) 
								return "3.5";
							
							var lastVal =d.pr[d.pr.length-1]; 
							for(var i = curPrices.dateAry.length-2; i >= 0 && i>= sinceDateIdx; i-- ) { 
								if( !d.pr[i] || isNaN(d.pr[i])) {
									return "0";		
								}
								
								if( +d.pr[i] < lastVal) {
									return "3.5";	
								}
								if( +d.pr[i] > lastVal ) {
									return "3.5";	
								}
							}
						}
						   
					return "0"; 
				})
				.attr("cx", function(d) { return x(getSectionAdjustedRow(+d.rd,d.va)); })
				.attr("cy", function(d) { 
						if( !d.pr[sinceDateIdx]) {
							return "";	
						}
						d.lastPriceSeen = d.pr[sinceDateIdx];
						return y(d.pr[sinceDateIdx]); 
				})
				.on("click", circleClick)
				.style("fill", circleFill);
		
				;
				
			var trans = new Array(curPrices.dateAry.length+1);
			trans[sinceDateIdx] = dots.transition().duration(1000);
			var transStartIdx = sinceDateIdx;		
				
			for( var i = sinceDateIdx; i < curPrices.dateAry.length; i++ ) {			
				
				trans[i+1] = trans[i].transition()
					.duration(1000)
					.each("start", function(d,i) {
							if( i == 0 ) {
								var myDate = new Date(curPrices.dateAry[transStartIdx++]);
								var dateStr =  myDate.toLocaleDateString() + " " + myDate.toLocaleTimeString() ;						
								scatterDateDiv.html("<b>" + dateStr + "</b>");
							}
					})
					.attr("cy", function(d) {
							d.curTransIdx = i;
							if( d.pr[i] ) {
								d.lastPriceSeen = d.pr[i];
								
								return y(d.pr[i]);
							}
							
							if( !d.lastPriceSeen) { 
								return "";	
							}
							
							return y(d.lastPriceSeen);
					})
				.attr("r", 	 function(d) { 
						if(d.pr.length > 1 && !isNaN(d.pr[d.pr.length-1])) {
							if((!d.pr[i] && !d.lastPriceSeen )  ) { 
								return "";	
							}
							
							if( d.qt[i] &&  +d.qt[i] >=  minQty ) {
								d.hasQty = true;
							}
							
							if( !d.hasQty) { 
								return "";	
							}
							
							if(!d.pr[curPrices.dateAry.length-1] ) 
								return "3.5";
							
							var lastVal =d.pr[d.pr.length-1]; 
							for(var j = curPrices.dateAry.length-2; j >= 0 && j>= sinceDateIdx; j-- ) { 
								if( !d.pr[j] || isNaN(d.pr[j])) {
									return "0";		
								}
								
								if( +d.pr[j] < lastVal) {
									return "3.5";	
								}
								if( +d.pr[j] > lastVal ) {
									return "3.5";	
								}
							}
						}
						   
					return ""; 
				})
				.style("fill", function(d) {
						if(i==sinceDateIdx ) {    
							d.lastFillPriceSeen = d.pr[i];						
							d.lastFillColor = "grey";
							return d.lastFillColor;	
						}
						// if(i == curPrices.dateAry.length-1) {
						//	d.lastFillColor = circleFill(d);
						//	return d.lastFillColor;	
						// }
						if((i >= d.pr.length && d.lastFillPriceSeen) || +d.qt[i] < minQty) {
							d.lastFillColor = "blue";
							return "blue";
						}
						
						
						if(d.pr[i]) {
							if( !d.lastFillPriceSeen) { 
								d.lastFillPriceSeen = d.pr[i];
								d.lastFillColor = "grey";
								return d.lastFillColor;
							}
							
							if( +d.pr[i] >  d.lastFillPriceSeen ) {
		
								d.lastFillColor = "green";
								var myRow = x(getSectionAdjustedRow(+d.rd,d.va));
								if( myRow && +d.qt[i] >= minQty) {
									var y1 = y(d.lastFillPriceSeen);
									var y2 = y(+d.pr[i])
									svg.append("line")
										.attr("x1", myRow)
										.attr("x2", myRow)
										.attr("y1", y1)
										.attr("y2", y2)
										.style("stroke", "green")
										.style("stroke-width",1);							
								}
								d.lastFillPriceSeen = +d.pr[i];
								return d.lastFillColor;
							}
							if( +d.pr[i] <  d.lastFillPriceSeen ) {
								
								var myRow = x(getSectionAdjustedRow(+d.rd,d.va));
								if(myRow &&  +d.qt[i] >= minQty ) {
									var y1 = y(d.lastFillPriceSeen);
									var y2 = y(+d.pr[i])
									svg.append("line")
										.attr("x1", myRow)
										.attr("x2", myRow)
										.attr("y1", y1)
										.attr("y2", y2)
										.style("stroke", "red")
										.style("stroke-width",1);
								}
								d.lastFillColor ="red";
								d.lastFillPriceSeen = +d.pr[i];
								return d.lastFillColor;
							}			
							                                                                                  
							d.lastFillPriceSeen = +d.pr[i];
							return d.lastFillColor;
						}
						else {
							if ( d.lastFillPriceSeen ) {
								d.lastFillColor = "blue";
								return d.lastFillColor;	
							}
							else {
								d.lastFillColor = "grey";
								return d.lastFillColor;	
							}
						}
						
					
						return "#9ecae1"; 					
				});
			}
		

		
	}

	function circleFill(d) { 
			if(d.pr.length > 1 && !isNaN(d.pr[d.pr.length-1])) {
				var lastVal =d.pr[d.pr.length-1]; 
				
				if(!d.pr[curPrices.dateAry.length-1]) 
					return "blue";
							
				var sinceDateIdx = +scatterDatePulldown[0][0].options[scatterDatePulldown[0][0].selectedIndex].value;
								
				for(var i = curPrices.dateAry.length-2; i >= 0 && i>= sinceDateIdx; i-- ) { 
					
					if( !d.pr[i] || isNaN(d.pr[i])) {
						return "grey";		
					}
					
					if( +d.pr[i] < lastVal) {
						return "green";	
					}
					if( +d.pr[i] > lastVal ) {
						return "red";	
					}
				}
			}
			
		return "grey"; 
	}

	function circleClick(d) { 
		window.open(eventURL + "/?ticket_id=" + d.id); 
	}

	function getParameterByName(name) {
	    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	        results = regex.exec(location.search);
	    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}


}();