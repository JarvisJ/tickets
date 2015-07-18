'use strict';

(function () {
    /* App Module */
    var ticketApp = angular.module('ticketApp', [
      'ticketControllers',
      'ticketServices',
      'ticketFilters',
      'ticketDirectives',
      'ticketServices',
      'stadiumServices'
    ]);



    var ticketControllers = angular.module('ticketControllers', []);

    ticketControllers.controller('TicketCtrl', ['$scope', 'Prices', 'Stadiums',
        function ($scope, Prices, Stadiums) {
            $scope.sinceDateIdx = 0;
            $scope.data = {};
            $scope.data.qtys = [1,2,3,4,5,6,7,8,9,10]; 
            $scope.minQty = 1;
            $scope.scatUpdate = {};
            $scope.scatUpdate.update = false;
            $scope.orderProp = "va";
            $scope.xAxis = "Row";
            $scope.hoverTicket = [];
            $scope.data.availableEvents = [
                  { "id" : "4373476", "name": "2014 BTT All Sessions","stadiumName":"concesco" },
                  { "id" : "4351791", "name": "IU @ Michigan","stadiumName":"crisler" },
                  { "id" : "4465981", "name": "Man U/Real Madrid","stadiumName":"michigan"},
                  { "id" : "4453306", "name": "2014 UM FB Season Tickets","stadiumName":"michigan"},
                  { "id" : "4446361", "name": "UM vs App State","stadiumName":"michigan"},
                  { "id" : "4446362", "name": "UM vs Miami (Ohio)","stadiumName":"michigan"},
                  { "id" : "4446363", "name": "UM vs Utah","stadiumName":"michigan"},
                  { "id" : "4446364", "name": "UM vs Minnesota","stadiumName":"michigan"},
                  { "id" : "4446366", "name": "UM vs PSU","stadiumName":"michigan"},
                  { "id" : "4446367", "name": "UM vs Indiana","stadiumName":"michigan"},
                  { "id" : "4446368", "name": "UM vs Maryland","stadiumName":"michigan"}]; 

            // copy default Model data values for resets
            $scope.orig = angular.copy($scope.data);

            $scope.reset = function () {
                // note, we do not modify the view data here.
                $scope.data = angular.copy($scope.orig);
            };

          $scope.setOrder = function (orderField) {
              if ($scope.orderProp == orderField) {
                  orderField = "-" + orderField;
              }
              $scope.orderProp = orderField;
          }


            var getPrices = function () {
                Prices.get({ eventID: $scope.data.event.id }, function (prices) {
                    $scope.data.prices = prices;
                    $scope.data.ticketData = {};
                    $scope.data.ticketData.prices = [];
                    for( var key in $scope.data.prices.histPrices.ticketHash ) {
                      $scope.data.prices.histPrices.ticketHash[key].id = key; 
                      $scope.data.ticketData.prices.push($scope.data.prices.histPrices.ticketHash[key]); 
                    }  

                    $scope.data.ticketData.summary = $scope.data.ticketData.prices.reduce(
                      function(p,c,ii) {
                        p.minVals = $scope.data.prices.histPrices.dateAry.map(function(v,i) {
                          if(!p.minVals[i]) 
                            return c.pr[i];
                          if(!c.pr[i])
                            return p.minVals[i];
                          return Math.min(c.pr[i],p.minVals[i]);
                        });
                      

                        p.averages = $scope.data.prices.histPrices.dateAry.map(function(v,i) {
                          if(!p.averages[i]) 
                            return c.pr[i];
                          if(!c.pr[i])
                            return p.averages[i];
                          return c.pr[i]+p.averages[i];
                        });

                        p.counts = $scope.data.prices.histPrices.dateAry.map(function(v,i) {
                          if(!p.counts[i]) 
                            return c.qt[i];
                          if(!c.qt[i])
                            return p.counts[i];
                          return c.qt[i]+p.counts[i];
                        });

                        return p;
                      }
                      ,{
                        "minVals": new Array($scope.data.prices.histPrices.dateAry.length),
                        "averages": new Array($scope.data.prices.histPrices.dateAry.length),
                        "medians": new Array($scope.data.prices.histPrices.dateAry.length),
                        "counts": new Array($scope.data.prices.histPrices.dateAry.length)
                      });

                      $scope.data.ticketData.summary.averages =$scope.data.ticketData.summary.averages.map(function(v) {
                        return v/$scope.data.ticketData.prices.length;
                      });

                    $scope.eventURL = "http://www.stubhub.com/" + prices.genreUrlPath + "/" + prices.eventUrlPath
                });
            }

            var getStadium = function () {
                Stadiums.get({ stadiumName: $scope.data.event.stadiumName }, function (stadium) {
                    stadium.shapeData = [];
                    for( var key in stadium ) {
                      if(key && key.substr(0,1)!="$") {
                        stadium[key].secID = key;
                        stadium[key].ticketArray = [];
                        stadium[key].curPriceAry = [];
                        stadium.shapeData.push(stadium[key]); 
                      }
                    }
                    $scope.data.stadium = stadium;                                                                                        
                });
            }
            $scope.selectEvent = function (event) {
                $scope.reset();
                $scope.data.event = event;
                getStadium();
                getPrices();
            }

            $scope.selectMinQty = function(qty) {
              $scope.minQty = qty;
              $scope.scatUpdate.update = !$scope.scatUpdate.update;
            }

            $scope.selectXAxis = function(axis) {
              if(axis == "sec") {
                $scope.scatterX = scatterXSection;
                $scope.xAxis = "Section";
              }
              else {
                $scope.scatterX = scatterXRow;
                $scope.xAxis = "Row";
              }

              $scope.scatUpdate.update = !$scope.scatUpdate.update;
            }

            $scope.getPrice = function(prAry, i) {
              var numPrices = $scope.data.prices.histPrices.dateAry.length;

              if(prAry.length > numPrices-i-1) {
                return prAry[numPrices-i-1];
              }
              return undefined;
            }


            $scope.selectSinceDate = function(dt,i) {
              $scope.sinceDate = dt;
              $scope.sinceDateIdx = i;
              $scope.scatUpdate.update = !$scope.scatUpdate.update;
            }

            $scope.getEventName = function() {
              if($scope.data.event)
                return $scope.data.event.name;
              return null;
            }

            $scope.scatterFill = circleFill;
            $scope.scatterClick = circleClick;
            $scope.scatterX = scatterXRow;
            $scope.scatterY = scatterY;
            $scope.mouseOver = showTicketInfo;
            $scope.mouseOut = hideTicketInfo;
            function showTicketInfo(d,d3,circle) {
              var d3Circ =d3.select(circle);

              // d3.select(circle.parentElement)
              //   .append("text")
              //     .attr("id","jjTicketText")
              //     .text("Section: " + d.va + "\nRow:" + d.rd + "\nPrice: " + d.pr + "\nQty" + d.qt)
              //     .attr("x",d3Circ.attr("cx"))
              //     .attr("y",+d3Circ.attr("cy")+30);
              $scope.hoverTicket.push(d);
              $scope.$apply();
              d3Circ.style("fill", "purple");
            }

            function hideTicketInfo(d,d3,circle) {
              var d3Circ =d3.select(circle);
              $scope.hoverTicket.pop();
              //d3.select(circle.parentElement).selectAll("#jjTicketText").remove();
              d3Circ.style("fill", circleFill);

            }            

            function circleFill(d) { 
                return "red";
                if(d.pr.length > 1 && !isNaN(d.pr[d.pr.length-1])) {
                  var lastVal =d.pr[d.pr.length-1]; 
                  
                  if(!d.pr[curPrices.dateAry.length-1]) 
                    return "blue";
                                                
                  for(var i = curPrices.dateAry.length-2; i >= 0 && i>= $scope.sinceDateIdx; i-- ) { 
                    
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

            $scope.scatterFilter = function(d) {
              if(d.qt[$scope.sinceDateIdx] &&  +d.qt[$scope.sinceDateIdx] >=  $scope.minQty) {
                return true;
              }
              return false;
            }

            function scatterXRow(d) {
              if($scope.data.event.stadiumName == "concesco")
                return getConcescoRow(+d.rd,d.va);
              else if($scope.data.event.stadiumName == "michigan")
                return getMichiganRow(+d.rd,d.va);
              else
                return getDefaultRow(d.rd,d.va);
            }

            function scatterXSection(d) {
              if($scope.data.event.stadiumName == "michigan") {
                var secSplit = d.va.split(" ");

                var secNum = +secSplit[secSplit.length-1].replace("R","");

                if(secNum > 60) {
                  return 61;
                }
                return secNum; 
              }

              var secSplit = d.va.split(" ");
              return +secSplit[secSplit.length-1].replace("R",""); 
            }


            function scatterY(d) {
              if( !d.pr[$scope.sinceDateIdx]) {
                return "";  
              }
              d.lastPriceSeen = d.pr[$scope.sinceDateIdx];
              return d.pr[$scope.sinceDateIdx]; 
            }

            function getConcescoRow(row,sec) {
              if(sec.substring(0,5) == "Lower") {
                return row; 
              }
              if(sec.substring(0,5) == "Balco") {
                return row+35;  
              }
              
              return row+22;
            }

            function getDefaultRow(row,sec) {
              return row;
            }
            function getMichiganRow(row,sec) {
              if(row == "A") {
                return 1; 
              }
              if(row == "B") {
                return 2;  
              }
              
              return (+row)+2;
            }
            function circleClick(d) { 
              window.open(eventURL + "/?ticket_id=" + d.id); 
            }            
        }
     ]);   
})();