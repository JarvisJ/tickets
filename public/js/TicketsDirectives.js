(function () {
    var ticketDirectives = angular.module('ticketDirectives', ['ngResource','d3']);
    ticketDirectives.directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    });

    ticketDirectives.directive('jjTimeseriesGraph', ['d3Service','$window', function (d3Service,$window) {
        return {
            restrict: 'EA',
            scope: {
                data: "=",
                jjClick: '&',  
                update:"=",
                jjXFunc: "&",
                jjYFunc: "&",
                jjMaxX: "&",
                jjMaxY: "&",
                jjHeight: "=",
                jjWidth: "=",
                jjMargin: "=",
                jjCircleR: "&",
                jjCircleFill: "&",
                jjLineField: "&",
                jjFilter: "&"
            },
            link: function (scope, ele, attrs) {
                d3Service.d3().then(function (d3) {
                    var margin = parseInt(attrs.jjMargin) || 60,
                        height = parseInt(attrs.jjHeight) || 500,
                        width = parseInt(attrs.jjWidth) || 500,
                        xField = attrs.jjXField || undefined,
                        yField = attrs.jjYField || undefined,
                        maxX = attrs.jjMaxX || undefined,
                        maxY = attrs.jjMaxY || undefined,
                        lineField = attrs.jjLineField || undefined;

                    width = width - margin;
                    height = height - (margin * 2);

                    var svg = d3.select(ele[0]).append("svg")
                         .attr("width", width + margin)
                         .attr("height", height + (margin*2))
                      .append("g")
                         .attr("transform", "translate(" + margin + "," + margin + ")");

 
                    var drawCircles = undefined; 
                    // Watch for resize event

                    // watch for data changes and re-render
                    scope.$watch('update', function (newVals, oldVals) {
                        return scope.render(scope.data);
                    }, true);

                    // watch for data changes and re-render
                    scope.$watch('data', function (newVals, oldVals) {
                        return scope.render(newVals);
                    }, true);

                    scope.render = function (data) {
                        // remove all previous items before render
                        svg.selectAll('*').remove();

                        // If we don't pass any data, return out of the element
                        if (!data) return;

                        // setup variables

                        var xFunc = function(d) {
                            if(!scope.jjXFunc) return undefined;
                            return scope.jjXFunc({ item: d});
                        }
                        var yFunc = function(d) {
                            if(!scope.jjYFunc) return undefined;
                            return scope.jjYFunc({ item: d});
                        }

                        var x = d3.time.scale()
        .domain([new Date(dataset[0][0].time),d3.time.day.offset(new Date(dataset[0][dataset[0].length-1].time),8)])
        .rangeRound([0, width]);

                        var y = d3.scale.linear()
                             .range([height, 0]);

                        var y2 = d3.scale.linear()
                             .range([height, 0]);


                        var color = d3.scale.category10();

                        var xAxis = d3.svg.axis()
                         .scale(xScale)
                         .orient("bottom")
                         .ticks(d3.time.days,1);

                        var yAxisLeft = d3.svg.axis()
                             .scale(y)
                             .orient("left");

                        var yAxisRight = d3.svg.axis()
                             .scale(y2)
                             .orient("right");

                        var maxVal = 0;
                        x.domain(d3.extent(data, function (d) {
                            var xVal = xFunc(d);
                            if (xVal && !isNaN(xVal) && (!maxX || +xVal < (+maxX))) {
                                maxVal = +xVal > maxVal ? +xVal : maxVal;
                                return xVal;
                            }
                        })
                              ).nice();
                        y.domain(d3.extent(data, function (d) {
                            var yVal = yFunc(d);
                            if (yVal && !isNaN(yVal) && (!maxY || +yVal < (+maxY))) {
                                return yVal;
                            }
                        })).nice();


                        svg.append("g")
                              .attr("class", "x axis")
                              .attr("transform", "translate(0," + height + ")")
                              .call(xAxis)
                           .append("text")
                              .attr("class", "label")
                              .style("font-size", function (d) {
                                  return "14px";
                              })
                              .attr("x", width)
                              .attr("y", -6)
                              .style("text-anchor", "end")
                              .text(xField);

                        svg.append("g")
                              .attr("class", "y axis")
                              .call(yAxis)
                           .append("text")
                              .attr("class", "label")
                              .attr("transform", "rotate(-90)")
                              .attr("y", 6)
                              .attr("dy", ".71em")
                              .style("font-size", function (d) {
                                  return "14px";
                              })
                              .style("text-anchor", "end")
                              .text(yField);


                        drawCircles = function() {
                          svg.selectAll(".dot")
                              .data(data)
                           .enter().append("circle")
                            .filter(function (d) { 
                                var xVal = xFunc(d);
                                var yVal = yFunc(d);
                                var userFilt = !scope.jjFilter? true : scope.jjFilter({item: d});
                              
                                return (!maxX || +xVal < (+maxX)) && (!maxY || +yVal < (+maxY)) && userFilt; 
                              })
                              .attr("class", "dot")
                            .on("mouseover", function (d) {
                                d3.select(this).style("fill", "purple");
                                //d3.selectAll("[chv^='chv_"+d.region.substring(4,6)+"_']").attr("class",getCountyColor);
                            })
                            .on("mouseout", function (d) {
                                d3.select(this).style("fill", scope.jjCircleFill({ item: d, xField: xField, yField: yField }));
                                //d3.selectAll("[chv^='chv_"+d.region.substring(4,6)+"_']").attr("class",getCountyColor);
                            })
                            .on("click", function (d) {
                                return scope.jjClick({ item: d, xField: xField, yField: yField });
                                //d3.selectAll("[chv^='chv_"+d.region.substring(4,6)+"_']").attr("class",getCountyColor);
                            })
                              .attr("r", function (d) {
                                  return scope.jjCircleR({ item: d, xField: xField, yField: yField });
                              })
                              .attr("cx", function (d) { 
                                  return x(xFunc(d));
                              })
                              .attr("cy", function (d) {
                                  return y(yFunc(d));
                              })
                              .style("fill", function (d) {
                                  return scope.jjCircleFill({ item: d, xField: xField, yField: yField });
                                  //d3.selectAll("[chv^='chv_"+d.region.substring(4,6)+"_']").attr("class",getCountyColor);
                              })
                          }
                          drawCircles();

                        function circleFill(d) {
                            if((d[xField] ) > (d["TMV"]*0.7)) {
                                return "green";
                            }
                            return "red";
                        }
                    }
                });
            }
        };
    }]);

    ticketDirectives.directive('jjScatterPlot', ['d3Service','$window', function (d3Service,$window) {
        return {
            restrict: 'EA',
            scope: {
                data: "=",
                jjClick: '&',  
                update:"=",
                jjXFunc: "&",
                jjYFunc: "&",
                jjMaxX: "&",
                jjMaxY: "&",
                jjHeight: "=",
                jjWidth: "=",
                jjMargin: "=",
                jjCircleMouseOver: "&",
                jjCircleMouseOut: "&",                
                jjCircleR: "&",                
                jjCircleFill: "&",
                jjLineField: "&",
                jjFilter: "&"
            },
            link: function (scope, ele, attrs) {
                d3Service.d3().then(function (d3) {
                    var margin = parseInt(attrs.jjMargin) || 60,
                        height = parseInt(attrs.jjHeight) || 500,
                        width = parseInt(attrs.jjWidth) || 500,
                        xField = attrs.jjXField || undefined,
                        yField = attrs.jjYField || undefined,
                        maxX = attrs.jjMaxX || undefined,
                        maxY = attrs.jjMaxY || undefined,
                        lineField = attrs.jjLineField || undefined;

                    width = width - margin;
                    height = height - (margin * 2);

                    var svg = d3.select(ele[0]).append("svg")
                         .attr("width", width + margin)
                         .attr("height", height + (margin*2))
                      .append("g")
                         .attr("transform", "translate(" + margin + "," + margin + ")");

 
                    var drawCircles = undefined; 
                    // Watch for resize event

                    // watch for data changes and re-render
                    scope.$watch('update', function (newVals, oldVals) {
                        return scope.render(scope.data);
                    }, true);

                    // watch for data changes and re-render
                    scope.$watch('data', function (newVals, oldVals) {
                        return scope.render(newVals);
                    }, true);

                    scope.render = function (data) {
                        // remove all previous items before render
                        svg.selectAll('*').remove();

                        // If we don't pass any data, return out of the element
                        if (!data) return;

                        // setup variables

                        var xFunc = function(d) {
                            if(!scope.jjXFunc) return undefined;
                            return scope.jjXFunc({ item: d});
                        }
                        var yFunc = function(d) {
                            if(!scope.jjYFunc) return undefined;
                            return scope.jjYFunc({ item: d});
                        }

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
                        var maxVal = 0;
                        x.domain(d3.extent(data, function (d) {
                            var xVal = xFunc(d);
                            if (xVal && !isNaN(xVal) && (!maxX || +xVal < (+maxX))) {
                                maxVal = +xVal > maxVal ? +xVal : maxVal;
                                return xVal;
                            }
                        })
                              ).nice();
                        y.domain(d3.extent(data, function (d) {
                            var yVal = yFunc(d);
                            if (yVal && !isNaN(yVal) && (!maxY || +yVal < (+maxY))) {
                                return yVal;
                            }
                        })).nice();


                        svg.append("g")
                              .attr("class", "x axis")
                              .attr("transform", "translate(0," + height + ")")
                              .call(xAxis)
                           .append("text")
                              .attr("class", "label")
                              .style("font-size", function (d) {
                                  return "14px";
                              })
                              .attr("x", width)
                              .attr("y", -6)
                              .style("text-anchor", "end")
                              .text(xField);

                        svg.append("g")
                              .attr("class", "y axis")
                              .call(yAxis)
                           .append("text")
                              .attr("class", "label")
                              .attr("transform", "rotate(-90)")
                              .attr("y", 6)
                              .attr("dy", ".71em")
                              .style("font-size", function (d) {
                                  return "14px";
                              })
                              .style("text-anchor", "end")
                              .text(yField);


                        drawCircles = function() {
                          svg.selectAll(".dot")
                              .data(data)
                           .enter().append("circle")
                            .filter(function (d) { 
                                var xVal = xFunc(d);
                                var yVal = yFunc(d);
                                var userFilt = !scope.jjFilter? true : scope.jjFilter({item: d});
                              
                                return (!maxX || +xVal < (+maxX)) && (!maxY || +yVal < (+maxY)) && userFilt; 
                              })
                              .attr("class", "dot")
                            .on("mouseover", function (d) {
                               return scope.jjCircleMouseOver({ item: d, d3: d3, circle: this });

                               // d3.select(this).style("fill", "purple");
                                //d3.selectAll("[chv^='chv_"+d.region.substring(4,6)+"_']").attr("class",getCountyColor);
                            })
                            .on("mouseout", function (d) {
                               return scope.jjCircleMouseOut({ item: d, d3: d3, circle: this });

                                //d3.select(this).style("fill", scope.jjCircleFill({ item: d, xField: xField, yField: yField }));
                                //d3.selectAll("[chv^='chv_"+d.region.substring(4,6)+"_']").attr("class",getCountyColor);
                            })
                            .on("click", function (d) {
                                return scope.jjClick({ item: d, xField: xField, yField: yField });
                                //d3.selectAll("[chv^='chv_"+d.region.substring(4,6)+"_']").attr("class",getCountyColor);
                            })
                              .attr("r", function (d) {
                                  return scope.jjCircleR({ item: d, xField: xField, yField: yField });
                              })
                              .attr("cx", function (d) { 
                                  return x(xFunc(d));
                              })
                              .attr("cy", function (d) {
                                  return y(yFunc(d));
                              })
                              .style("fill", function (d) {
                                  return scope.jjCircleFill({ item: d, xField: xField, yField: yField });
                                  //d3.selectAll("[chv^='chv_"+d.region.substring(4,6)+"_']").attr("class",getCountyColor);
                              })
                          }
                          drawCircles();

                        function circleFill(d) {
                            if((d[xField] ) > (d["TMV"]*0.7)) {
                                return "green";
                            }
                            return "red";
                        }
                    }
                });
            }
        };
    }]);

    ticketDirectives.directive('jjArena', ['d3Service', function (d3Service) {
        return {
            restrict: 'EA',
            scope: {
                data: "=",
                shapeData: "=",
                jjClick: '&',  
                update:"=",
                jjScaleK: "&",
                jjYFunc: "&",
                jjMaxX: "&",
                jjMaxY: "&",
                jjHeight: "=",
                jjWidth: "=",
                jjMargin: "=",
                jjFilter: "&"
            },
            link: function (scope, ele, attrs) {
                d3Service.d3().then(function (d3) {
                    var margin = parseInt(attrs.jjMargin) || 60,
                        height = parseInt(attrs.jjHeight) || 500,
                        width = parseInt(attrs.jjWidth) || 500,
                        xField = attrs.jjXField || undefined,
                        yField = attrs.jjYField || undefined,
                        maxX = attrs.jjMaxX || undefined,
                        maxY = attrs.jjMaxY || undefined,
                        scaleK =  scope.jjScaleK() || 0.15; 
                        lineField = attrs.jjLineField || undefined;

                    width = width - margin;
                    height = height - (margin * 2);

                    var svg = d3.select(ele[0]).append("svg")
                         .attr("width", width + (margin*2))
                         .attr("height", height + (margin*2))
                      .append("g")
                         .attr("transform", "translate(" + margin + "," + margin + ")");

 
                    var drawCircles = undefined; 
                    // Watch for resize event


                    // watch for data changes and re-render
                    scope.$watch('data', function (newVals, oldVals) {
                        return scope.render(scope.shapeData,newVals);
                    }, true);

                    scope.render = function (shapeData,data) {

                        if(!shapeData || !data)
                          return;
                        // remove all previous items before render
                        svg.selectAll('*').remove();

                        // If we don't pass any data, return out of the element
                        if (!data) return;

                       svg.selectAll("path")
                          .data(shapeData)
                        .enter().append("path")
                        .attr("d", function(d) { 
                              return d.p;
                        })
                        .style("fill",function(d) { return "white" })
                        .attr("stroke","black")
                        .attr("stroke-width","4px")
                        .attr("transform", "scale(" + scaleK + ")")
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
                              if (d) {
                                d.d3Bar = myBar;
                                
                                var bbox = myBar[0][0].getBBox();
                                d.bbox = bbox;
                                d.centroid = [bbox.x+bbox.width/2,bbox.y+bbox.height/2];
                
                                
                              }
                           });
              
                          svg.selectAll("text")
                             .data(shapeData)
                            .enter().append("text")
                             .attr("transform", function(d) { return "scale(" + scaleK + ") translate(" + d.centroid + ") "; })
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

                            function circleFill(d) {
                                if((d[xField] ) > (d["TMV"]*0.7)) {
                                    return "green";
                                }
                                return "red";
                            }
                    }
                });
            }
        };
    }]);


    ticketDirectives.directive('jjStackChart', ['d3Service', '$window', function (d3Service, $window) {
        return {
            restrict: 'EA',
            scope: {
                data: "=",
                jjStadiumJson: "=", // required
                jjRowFunc: "&",
                jjClick: '&',  // parent execution bijjng
                jjMaxX: "&",
                jjMaxY: "&",
                jjHeight: "=",
                jjWidth: "=",
                jjMargin: "=",
                jjCircleFill: "&",
                jjLineField: "&"
            },
            //  templateURL: '<h3>Hello World!!</h3>',
            link: function (scope, ele, attrs) {
                d3Service.d3().then(function (d3) {
                    var margin = parseInt(attrs.jjMargin) || 60,
                        height = parseInt(attrs.jjHeight) || 500,
                        width = parseInt(attrs.jjWidth) || 500,
                        maxX = attrs.jjMaxX || undefined,
                        maxY = attrs.jjMaxY || undefined,
                        lineField = attrs.jjLineField || undefined;



                    var svg = d3.select(ele[0]).append("svg")
                         .attr("width", width + margin)
                         .attr("height", height + (margin * 2))
                      .append("g")
                         .attr("transform", "translate(" + margin + "," + margin + ")");

                    /* ########################## */
                    var parse = d3.time.format("%m/%Y").parse,
                        format = d3.time.format("%b");

                    var svg = d3.select(ele[0]).append("svg")
                        .attr("width", width + margin)
                        .attr("height", height + (margin * 2))
                      .append("g")
                        .attr("transform", "translate(" + margin + "," + (height - margin) + ")");

                    /* ########################## */


                    // watch for data changes and re-render
                    scope.$watch('data', function (newVals, oldVals) {
                        return scope.render(newVals);
                    }, true);

                    scope.render = function (data) {
                        // remove all previous items before render
                        svg.selectAll('*').remove();

                        // If we don't pass any data, return out of the element
                        if (!data || !scope.jjGroupList) return;

                        // setup variables



                        var groups = d3.layout.stack()(scope.jjGroupList.map(function (group) {
                            return data.map(function (d, i) {
                                return { x: i, y: +d[group] };
                            });
                        }));

                        var x = d3.scale.ordinal()
                                    .domain(d3.range(data.length))
                                    .rangeRoundBands([0, data.length], 0, 0);

                        var y = d3.scale.linear().range([0, width - (margin * 2)]);
                        var z = d3.scale.ordinal().range(scope.jjColorList);

                     //   x.domain(d3.range(groups.length));
                        y.domain([0, d3.max(groups[groups.length - 1], function (d) {
                            return d.y0 + d.y;
                        })]);

                        var group = svg.selectAll("g.stack-group")
                            .data(groups)
                          .enter().append("g")
                            .attr("class", "stack-group")
                            .style("fill", function (d, i) { return z(i); })
                            .style("stroke", function (d, i) { return d3.rgb(z(i)).darker(); });

                        // Add a rect for each item.
                        var rect = group.selectAll("rect")
                            .data(Object)
                          .enter().append("rect")
                            .attr("x", function (d) {
                                   return x(d.x);
                            })
                            .attr("y", function (d) {
                                return -y(d.y0) - y(d.y);
                            })
                            .attr("height", function (d) {
                                return y(d.y);
                            })
                            .attr("width", x.rangeBand());

                        // TO-DO: X-axis label
                        //var label = svg.selectAll("text")
                        //    .data(x.domain())
                        //  .enter().append("svg:text")
                        //    .attr("x", function (d) { return x(d) + x.rangeBand() / 2; })
                        //    .attr("y", 6)
                        //    .attr("text-anchor", "middle")
                        //    .attr("dy", ".71em")
                        //    .text(format);

                        // Add y-axis rules.
                        var rule = svg.selectAll("g.rule")
                            .data(y.ticks(5))
                          .enter().append("g")
                            .attr("class", "rule")
                            .attr("transform", function (d) { return "translate(0," + -y(d) + ")"; });

                        rule.append("line")
                            .attr("x2", width - (margin*2))
                            .style("stroke", function (d) { return d ? "#fff" : "#000"; })
                            .style("stroke-opacity", function (d) { return d ? .7 : null; });

                        rule.append("text")
                            .attr("x", width - (margin * 2) + 6)
                            .attr("dy", ".35em")
                            .text(d3.format(",d"));
                    }
                });
            }
        };
    }]);

    ticketDirectives.directive('jjTimeseries', ['d3Service', '$window', 'd3LegendService', function (d3Service, $window, d3LegendService) {
        return {
            restrict: 'EA',
            scope: {
                data: "=",
                jjGroupList: "&", // required
                jjGroupNames: "=", // required
                jjColorList: "=", // required
                jjClick: '&',  // parent execution bijjng
                jjMaxHeight: "&",
                jjMinHeight: "&",
                jjHeight: "=",
                jjWidth: "=",
                jjMargin: "=",
                jjDateField: "=",
                jjValueFields: "&",
                jjAxisArray: "&"
            },
            //  templateURL: '<h3>Hello World!!</h3>',
            link: function (scope, ele, attrs) {
                d3Service.d3().then(function (d3) {
                    var margin = parseInt(attrs.jjMargin) || 50,
                        height = parseInt(attrs.jjHeight) || 500,
                        width = parseInt(attrs.jjWidth) || 500,
                        lineField = attrs.jjLineField || undefined,
                        isUseRightAxisArray = scope.jjAxisArray() || undefined,
                        valueFields = scope.jjValueFields() || undefined,
                        dateField = attrs.jjDateField || "date";

                    var groupNames = scope.jjGroupNames;

                    /* ########################## */
                    var parse = d3.time.format("%m/%Y").parse,
                        format = d3.time.format("%b");

                    var svg = d3.select(ele[0]).append("svg")
                        .attr("width", width + (margin * 2))
                        .attr("height", height + (margin));

                    /* ########################## */




                    // Browser onresize event
                    //window.onresize = function () {
                    //    scope.$apply();
                    //};

                     

                    // watch for data changes and re-render
                    scope.$watch('data', function (newVals, oldVals) {
                        return scope.render(newVals);
                    }, true);

                    scope.render = function (data) {
                        // remove all previous items before render
                        svg.selectAll('*').remove();
                        
                        // If we don't pass any data, return out of the element
                        if (!data || data.length <1 ) return;

                        

                        //var x = d3.scale.ordinal()
                        //            .domain(d3.range(dataCopy.length))
                        //            .rangeRoundBands([0, dataCopy.length]);
                        var parseDate = d3.time.format("%m-%Y").parse;

                        var x = d3.time.scale()
                    .range([0, width - (margin * 2)]);

 
                        var yLeft = d3.scale.linear().range([0, height - (margin)]);
                        var yRight = d3.scale.linear().range([0, height - (margin)]);
                       //  var z = d3.scale.ordinal().range(scope.jjColorList);

                        x.domain(d3.extent(data, function (d) { return parseDate(d[dateField]); }));
      
                        var line = d3.svg.line()
                          //  .interpolate("basis")
                            .x(function (d) {
                               return x(d.date);
                            })
                            .y(function (d) {
                                return d.useRightY ? yRight(d.value) : yLeft(d.value);
                            });

                        var dataMap = [];
                        
                        for (var i = 0; i < valueFields.length; i++) {
                            var prop = valueFields[i];
                            dataMap.push({
                                name: prop,
                                
                                values: data.map(function(d) {
                                    return {
                                        date: parseDate(d[dateField]),
                                        useRightY: isUseRightAxisArray ? isUseRightAxisArray[i] : false,
                                        value: +d[prop]
                                    }
                                })
                            });
                        }

                        yLeft.domain([
                            d3.max(dataMap, function (d) { return d3.max(d.values, function (p) { return p.useRightY ? undefined : p.value; }); })*1.1,
                              d3.min(dataMap, function (d) { return d3.min(d.values, function (p) { return p.useRightY ? undefined : p.value; }); }) * .9,
                              
                        ]);

                        //yRight.domain([
                        //  d3.max(dataMap, function (d) { return d3.max(d.values, function (p) { return !p.useRightY ? undefined : p.value; }); }),
                        //  d3.min(dataMap, function (d) { return d3.min(d.values, function (p) { return !p.useRightY ? undefined : p.value; }); })
                        //]);

                        yRight.domain([
                          1,0
                        ]);

                        var path = svg.selectAll("path")
                            .data(dataMap)
                          .enter()
                            .append("g")
                                .attr("transform", "translate(" + margin  + "," + margin  + ")")
                               .attr("class", function (d, i) { return "ts-" + i;})
                          

                        path.append("path")
                          .attr("class", "line")
                          .attr("d", function (d) { return line(d.values); })
                          .style("fill","none");

                        // TO-DO: X-axis label
                        //var label = svg.selectAll("text")
                        //    .data(x.domain())
                        //  .enter().append("svg:text")
                        //    .attr("x", function (d) { return x(d) + x.rangeBand() / 2; })
                        //    .attr("y", 6)
                        //    .attr("text-anchor", "middle")
                        //    .attr("dy", ".71em")
                        //    .text(format);



                        var xAxis = d3.svg.axis()
                               .scale(x)
                               .ticks(7)
                               .orient("bottom");
                        var formatPercent = d3.format(".0%");
                        var formatCurrency = d3.format("$0,");
                        var yAxisLeft = d3.svg.axis()
                                       .scale(yLeft)
                                       .orient("left")
                                       .ticks(10)
                                       .tickFormat(function (d) { return formatCurrency(d); });

                        var yAxisRight = d3.svg.axis()
                               .scale(yRight)
                               .orient("right")
                               .ticks(10)
                               .tickFormat(function (d) { return formatPercent(d); });



                        svg.append("g")
                            .attr("class", "x axis")
                            .attr("transform", "translate(" + margin + "," + (height) + ")")
                            .call(xAxis);

                        svg.append("g")
                            .attr("class", "y axis")
                            .attr("transform", "translate(" + margin + "," + margin + ")")
                            .call(yAxisLeft)
                          .append("text")
                            .attr("transform", "rotate(-90)")
                            .attr("y", 6)
                            .attr("dy", ".71em")
                            .style("text-anchor", "end")
                            .text("Price");

                        svg.append("g")
                            .attr("class", "y axis")
                            .attr("transform", "translate(" + (width - margin) + "," + margin + ")")
                            .call(yAxisRight)
                          .append("text")
                            .attr("transform", "rotate(-90)")
                            .attr("y", 6)
                            .attr("dy", "-.71em")
                            .style("text-anchor", "end")
                            .text("OE Market Share");
                    }
                });
            }
        };
    }]);

    ticketDirectives.directive('jjMap', ['d3Service','topojsonService', '$window', function (d3Service,topojsonService, $window) {
        return {
            restrict: 'EA',
            scope: {
                json: "=",
                data: "=",
                mapType: "&",
                jjClick: '&',  // parent execution bijjng
                jjHeight: "=",
                jjWidth: "=",
                jjHideBorder: "&",
                jjHideFunc: "&",
                jjFillColor: "&",
                jjStrokeWidth: "&",
                jjStrokeColor: "&"
            },
            //  templateURL: '<h3>Hello World!!</h3>',
            link: function (scope, ele, attrs) {
                d3Service.d3().then(function (d3) {
                    topojsonService.topojson().then( function(topojson) { 
                        var height = parseInt(attrs.jjHeight) || 500,
                            width = parseInt(attrs.jjWidth) || 500,
                            lineField = attrs.jjLineField || undefined,
                            strokeWidth = parseFloat( scope.jjStrokeWidth()) || 1,
                            strokeColor = scope.jjStrokeColor() || "white";

                        var groupNames = scope.jjGroupNames;
                        var mapType = scope.mapType();
                 
                        /* ########################## */
                        var parse = d3.time.format("%m/%Y").parse,
                            format = d3.time.format("%b");

                        var svg = d3.select(ele[0]).append("svg")
                            .attr("width", width )
                            .attr("height", height)
                            .attr("border","1px solid")
                                .append("g");
                        //    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

                        /* ########################## */




                        // Browser onresize event
                        //window.onresize = function () {
                        //    scope.$apply();
                        //};



                        scope.$watch('json', function (newVals, oldVals) {
                            return scope.render(scope.data, newVals);
                        });

                        // watch for data changes and re-render
                        scope.$watch('data', function (newVals, oldVals) {
                            return scope.render(newVals,scope.json);
                        }, true);

                        scope.render = function (data,mapJson) {
                            // remove all previous items before render
                            svg.selectAll('*').remove();

                            // If we don't pass any data, return out of the element
                            if (!data || !mapJson) return;

                            var getFillColor = function (d) {
                                return scope.jjFillColor({ item: d });
                            }


                            var proj = d3.geo.albersUsa()
                                .scale(width*1.1)
                                .translate([width / 2, height / 2]);
                       
                            var path = d3.geo.path().projection(proj);

                            var topoObj = topojson.feature(mapJson, mapJson.objects[mapType.getTopoJsonObject()]);

                            if (!scope.jjHideBorder()) {
                                svg.selectAll("rect").data([0])
                                    .enter()
                                   .append("rect")
                                    .attr("width", width)
                                    .attr("height", height)
                                    .style("fill", "transparent")
                                    .style("stroke", "black")
                                    .style("stroke-width", "1px");
                            }

                            svg.selectAll("path")
                                    .data(topoObj.features)
                                    .enter().append("path")
                                 //.on("click", aoiClick)
                                 .style("fill", getFillColor)
                                 .attr("d", path)
                                 .style("stroke-width", strokeWidth)
                                 .style("stroke", strokeColor)
                                 .on("mouseout", function (d) {
                                     d3.select(this).style("fill", getFillColor(d));
                                 })
                               .on("mouseover", function (d, i) {
                               
                                   //updateZipCircles(d);

                                   d3.select(this).style("fill", "purple");

                                   //          //     d3.select(this).attr("title", d.properties.GEOID10);
                                   // d3.select(this).style("fill", "purple");
                               });

                              //var zoom = d3.behavior.zoom()
                              //      .on("zoom",function() {
                              //          //d3.select(this).attr("transform", "translate(" +
                              //          //    d3.event.translate+")scale("+d3.event.scale+")")
                              //          //        .attr("scale",d3.event.scale)
                              //          //        .style("stroke-width", 1 / d3.event.scale);

                              //          d3.select(this).attr("scale",d3.event.scale)
                              //                  .style("stroke-width", 1 / d3.event.scale);
                              //      });
                            var zoom = d3.behavior.zoom()
                                    .on("zoom", zoomed);

                            svg.call(zoom);

                            function zoomed() {
                                proj.translate(d3.event.translate).scale(d3.event.scale);
                                svg.selectAll("path").attr("transform",
                                    "translate(" +  zoom.translate() + ")"
                                         + " scale(" + zoom.scale() + ")");
                              //  svg.selectAll("path").attr("d", path);
                            }
                        }
                    },
                    function (err) {
                        var hi = err;
                    });
                });
            }
        };
    }]);

})();