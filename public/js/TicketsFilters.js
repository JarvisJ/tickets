(function () {
    angular.module('ticketFilters', [])
    .filter('percentage', function ($window) {
        return function (input, decimals, suffix) {
            decimals = angular.isNumber(decimals) ? decimals : 3;
            suffix = suffix || '%';
            if ($window.isNaN(input)) {
                return '';
            }
            return Math.round(input * Math.pow(10, decimals + 2)) / Math.pow(10, decimals) + suffix;
        };
    })
    .filter('currencynodigits', ['$filter', '$locale', function ($filter, $locale) {
        var currency = $filter('currency'), formats = $locale.NUMBER_FORMATS;
        return function (amount, symbol) {
            var value = currency(amount, symbol);
            return value.replace(new RegExp('\\' + formats.DECIMAL_SEP + '\\d{2}'), '');
        }
    }])
  .filter('reverse', function() {
  return function(items) {
    if(items)
        return items.slice().reverse();
    return undefined;
  };
});;
})();