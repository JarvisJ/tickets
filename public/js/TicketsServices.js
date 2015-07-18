

(function () {
    var ticketServices = angular.module('ticketServices', ['ngResource']);

    ticketServices.factory('Prices', ['$resource',
      function ($resource) {
          return $resource('/curprices/:eventID', {}, {
            //  query: { method: 'GET', params: {}, isArray: true }
          });
      }]);

    var stadiumService = angular.module('stadiumServices', ['ngResource']);

    stadiumService.factory('Stadiums', ['$resource',
      function ($resource) {
        return $resource('json/:stadiumName.json', {}, {
          // query: {method:'GET', params:{phoneId:'phones'}, isArray:true}
        });
      }]);
})();