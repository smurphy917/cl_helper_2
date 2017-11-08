// import $ from 'jquery'
// import crossroads from 'crossroads'
// import angular from 'angular'

const $ = require("jquery");
import {Connector, APPLICATION_TYPES} from './connector'
require("signals");
var crossroads = require("crossroads");
var angular = require("angular");
var hasher = require("hasher");

let baseApp = angular.module("base", []).component("baseApp", {
  templateUrl: 'baseApp.html',
  controller: function BaseController($scope, $http) {
    $scope.connector;
    $scope.alerts = [];
    $scope.data = {};
    $scope.status = "Not Started";
    $scope.periodOptions = [
      {
        name: '4 Minutes',
        value: 4
      },
      {
        name: '6 Minutes',
        value: 6
      },
      {
        name: '8 Minutes',
        value: 8
      }
    ]
    $scope.period = 6; //default

    $scope.init = function(){

      $scope.connector = new Connector(APPLICATION_TYPES.ELECTRON);
      $scope.data.posts = [];
      $scope.data.accounts = [];
      $scope.data.google_accounts = [];

      $scope.connector.google_accounts.subscribe((google_accounts) => {
        $scope.data.google_accounts = google_accounts;
        $scope.$apply();
      });
      $scope.connector.accounts.subscribe((accounts) => {
        $scope.data.accounts = accounts;
        if($scope.data.accounts.length == 1){
          $scope.data.selectedAccounts = [$scope.data.accounts[0]];
        }
        $scope.$apply();
      });
      
      
      $scope.data.selectedAccounts = [];
      $scope.data.newAccount = {
        email:'',
        password: '',
        google_email: ''
      }
      $("select[data-multiselect]").each((i,node) => {
        $(node).data('multiselect',eval('(' + $(node).data('multiselect') + ')'));
        $(node).multiselect();
      });
    }
    $scope.test = () => {
      $.get("#/test");
    };

    $scope.add_google_account = function(){
      $scope.connector.addGoogleAccount();
    }

    $scope.add_account = function(){
      $scope.connector.addAccount(
        {
          email: $scope.data.newAccount.email,
          password: $scope.data.newAccount.password,
          google_email: $scope.data.newAccount.email.endsWith('@gmail.com') ? $scope.data.newAccount.email : $scope.data.newAccount.google_email
        }
      );
      $scope.data.newAccount = {
        email:'',
        password: '',
        google_email: ''
      };
    }

    $scope.start = function(){
      $scope.connector.start({
        accounts: $scope.data.selectedAccounts,
        period: $scope.period
      });
      $scope.status = "Running";
    }

    $scope.init();
  }
});

crossroads.addRoute(/(.*)/, path => {
  console.log(`${path} requested`);
});

//setup hasher
function parseHash(newHash, oldHash) {
  crossroads.parse(newHash);
}
hasher.initialized.add(parseHash); //parse initial hash
hasher.changed.add(parseHash); //parse hash changes
hasher.init(); //start listening for history change

$(() => {
  angular.bootstrap($("body"), ["base"]);
});
