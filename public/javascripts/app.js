/* Autor: Luis Bahamonde */

angular.module('starter',
    ['ionic', 'starter.controllers', 'starter.services', 'jett.ionic.filter.bar', 'ion-gallery',
     'jett.ionic.scroll.sista', 'ngIOS9UIWebViewPatch', 'ion-affix'])

.run(function($ionicPlatform) {

    $ionicPlatform.ready(function() {

        //setTimeout(function () {
        //    navigator.splashscreen.hide();
        //}, 2000);

        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            //StatusBar.styleDefault();
            StatusBar.styleLightContent();
        }

  });
})

    .directive('hideTabs', function($rootScope) {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {
                scope.$on('$ionicView.beforeEnter', function() {
                    scope.$watch(attributes.hideTabs, function(value){
                        $rootScope.hideTabs = value;
                    });
                });

                scope.$on('$ionicView.beforeLeave', function() {
                    $rootScope.hideTabs = false;
                });
            }
        };
    })


.config(function($stateProvider, $urlRouterProvider, $ionicFilterBarConfigProvider, $ionicConfigProvider) {

        $ionicFilterBarConfigProvider.theme('light');
        $ionicFilterBarConfigProvider.clear('ion-close');
        $ionicFilterBarConfigProvider.search('ion-search');
        $ionicFilterBarConfigProvider.backdrop(true);
        $ionicFilterBarConfigProvider.transition('vertical');
        $ionicFilterBarConfigProvider.placeholder('Search...');

        $ionicConfigProvider.backButton.previousTitleText(false);
        $ionicConfigProvider.backButton.text('');



    $stateProvider

  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })
  .state('tab.home', {
    url: '/home',
    views: {
      'tab-home': {
        templateUrl: 'templates/tab-home.html',
        controller: 'homeController'
      }
    }
  })
    .state('tab.home-invite', {
        url: '/home/:inviteCode',
        views: {
            'tab-home': {
                templateUrl: 'templates/tab-home.html',
                controller: 'homeController'
            }
        }
    })
        .state('tab.rmbDetail', {
            url: '/rmbDetail',
            views: {
                'tab-home': {
                    templateUrl: 'templates/tab-detail.html',
                    controller: 'currentAssetDetailController'
                }
            }
        })
  .state('tab.taskHall', {
      url: '/taskHall',
      views: {
        'tab-taskHall': {
          templateUrl: 'templates/tab-taskHall.html',
          controller: 'TaskHallController'
        }
      }
    })
    .state('tab.task-detail', {
      url: '/task/:taskId',
      views: {
        'tab-taskHall': {
          templateUrl: 'templates/task-detail.html',
          controller: 'TaskDetailController'
        }
      }
    })
    .state('tab.myTask', {
        url: '/myTask',
        views: {
            'tab-myTask': {
                templateUrl: 'templates/tab-myTask.html',
                controller: 'MyTaskController'
            }
        }
    })
    .state('tab.myTask-detail', {
        url: '/myTask/:taskId',
        views: {
            'tab-myTask': {
                templateUrl: 'templates/task-detail.html',
                controller: 'TaskDetailController'
            }
        }
    })
  .state('tab.account', {
        url: '/account',
        views: {
            'tab-account': {
                templateUrl: 'templates/tab-account.html',
                controller: 'AccountController'
            }
        }
  }).state('tab.lottery', {
        url: '/lottery',
        views: {
            'tab-lottery': {
                templateUrl: 'templates/tab-lottery.html',
                controller: 'LotteryController'
            }
        }
    }).state('tab.manual', {
        url: '/manual',
        views: {
            'tab-lottery': {
                templateUrl: 'templates/tab-lotteryManual.html',
                controller: 'lotteryManualController'
            }
        }
    }).state('tab.results', {
        url: '/results',
        views: {
            'tab-lottery': {
                templateUrl: 'templates/tab-lotteryResults.html',
                controller: 'lotteryResultsController'
            }
        }
    });
  /*Si ninguno de los siguientes estados esta activo reenviar a /tab/agenda */
  $urlRouterProvider.otherwise('/tab/home');

});
