'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp.controllers', ['myApp.services']);
angular.module('myApp.directives', ['myApp.filters', 'myApp.services']);
angular.module('myApp.services', ['ngResource']);

angular.module(
        'myApp', ['myApp.filters',
            'myApp.services',
            'myApp.directives',
            'myApp.controllers',
            'ngRoute',
            'ngSanitize',
            'mgcrea.ngStrap'
        ])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'partials/evidence.html'
        });
        $routeProvider.otherwise({
            redirectTo: '/'
        });
    }])

// Store config for data and tool access in the rootScope after promise resolution
.run(['$resource', '$location', '$rootScope', function ($resource, $location, $rootScope) {
    // remove /# and everything following to ensure we get host root url (and everything between / and #)
    $rootScope.absUrl = $location.absUrl().replace(/(\/.*#.*)/, '');
    // remove trailing slash
    $rootScope.absUrl = $rootScope.absUrl.replace(/(\/)$/, '');

    var index = $rootScope.absUrl.indexOf('lig');
    if (index == -1) {
        index = $rootScope.absUrl.indexOf('limsi');
    }
    if (index != -1) {
        $rootScope.absUrl = $rootScope.absUrl.substr(0, index - 1);
    }

}]);

function streamTest(){
        var path = document.getElementById("localServerInput").value+"/3-24/0121200000DVBT6x1.mp4";
        var html = '<video id="playertest" src='+path+' height="80px" style="margin-top:-40px; margin-left:15px;" crossorigin="anonymous"></video>';
        document.getElementById('videoTest').innerHTML = html;
        document.getElementById('playertest').currentTime = 12*60+56;
        document.getElementById('playertest').pause();
    }
    function eraseTest(){
        document.getElementById('videoTest').innerHTML = "";
    }
    function updateLabel(){
        document.getElementById('label_name').innerHTML = document.getElementById('entry_input').value;
    }