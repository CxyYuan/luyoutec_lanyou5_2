
//user code
var gUserCId;
var interval = 1000;


function getUserCode()
{
    if (window.localStorage) {
        gUserCId = localStorage.getItem("userCId");
    } else {
        gUserCId = getCookie('userCId');
    }
}

angular.module('starter.controllers', ['angularFileUpload'])
.controller('homeController', function($scope, $http, $location, $ionicPopup, $timeout, $ionicLoading) {
    //是否是被邀请的
    var homeUrlList = $location.absUrl().split('/');
    var inviteCode = homeUrlList[homeUrlList.length - 1];

    getUserCode();

    //设备判定
    $scope.isIOSDevice = 0;
    $scope.isAndroidDevice = 0;
    if(/(iPhone|iPad|iPod|iOS|MacIntel|Macintosh)/i.test(navigator.userAgent)){
        $scope.isIOSDevice = 1;
    }else if(/android/i.test(navigator.userAgent)){
        $scope.isAndroidDevice = 1;
    }

    $scope.isQQBrowser = 0;
    $scope.isWeixinBrowser = 0;
    $scope.isiPhoneSafari = 0;
    if($scope.isAndroid || $scope.isIOSDevice){
        if(/QQ/i.test(navigator.userAgent)){
            $scope.isQQBrowser = 1;
        }else if(/MicroMessenger/i.test(navigator.userAgent)){
            $scope.isWeixinBrowser = 1;
        }else if(/Safari/i.test(navigator.userAgent)){
            $scope.isiPhoneSafari = 1;
        }
    }

    //alert(navigator.platform);
    //alert(navigator.userAgent);
    if($scope.isIOSDevice == 1 && $scope.isiPhoneSafari == 1){

        $ionicLoading.show();

        try{
            localStorage.setItem("testSafariMode", 'xiaomaTest');
        }
        catch(e) {
            $ionicLoading.hide();
            //alert(e);
            alert('无痕模式无法正常使用小马哦,点击右下角后,再点击左下角关闭无痕模式');
            return;
        }

        $scope.refreshHome = function(isRefresh) {
            var userInfoUrl = '/taskUser/' + gUserCId + '/' + inviteCode;
            $http.get(userInfoUrl)
                .success(function (response) {
                    //alert( 'errorId ' + response.errorId + ' userCode ' + response.userCode + ' masterCode ' + response.masterCode);
                    if (response.errorId == 0) {
                        //succeed
                        if (window.localStorage) {
                            try {
                                localStorage.setItem("userCId", response.userInfoObject.userCId);
                                localStorage.setItem("userCode", response.userInfoObject.userCode);
                            }
                            catch (e) {
                                //alert(e);
                                alert('无痕模式无法正常使用小马哦,点击【Safari工具栏右下角】按钮后,再点【新工具栏击左下角】按钮，从而关闭无痕模式');
                                return;
                            }
                        } else {
                            setCookie("userCId", response.userInfoObject.userCId);
                            setCookie("userCode", response.userInfoObject.userCode);
                            // alert('set cookie succeed');
                        }

                        if(inviteCode != 'home'){
                            $scope.inviteUrl = $location.absUrl().substring(0, $location.absUrl().length - inviteCode.length - 1) + '/' + response.userInfoObject.userCode;
                        }else {
                            $scope.inviteUrl = $location.absUrl() + '/' + response.userInfoObject.userCode;
                        }

                        $scope.userInfoObject = response.userInfoObject;
                        $scope.masterConfig = response.masterConfig;
                    } else {
                        $scope.errorId = response.errorId;
                        $scope.message = response.message;
                    }
                })
                .finally(function () {
                    // Stop the ion-refresher from spinning
                    $ionicLoading.hide();
                    if (isRefresh == 1) {
                        $scope.$broadcast('scroll.refreshComplete');
                    }
                });
        };

        $scope.refreshHome(0);

        //拜师提交不存在弹出窗
        $scope.showAlert = function() {
            var myPopup = $ionicPopup.show({
                title: '师傅的邀请码错误',
            });

            $timeout(function() {
                myPopup.close(); //由于某种原因3秒后关闭弹出
            }, 1000);
        };
        //长按复制

        //拜师(绑定邀请码接口)
        var bindLock =  0;
        $scope.ctrlScope = $scope;
        $scope.bindMaster = function(){
            if(bindLock == 1 || $scope.ctrlScope.inputMasterCode == undefined || $scope.ctrlScope.inputMasterCode.length == 0){
                return;
            }
            var bindUrl = '/taskUser/bindMaster';
            var bindParams = {'userCode' : $scope.userInfoObject.userCode, 'masterCode' : $scope.ctrlScope.inputMasterCode};
            bindLock = 1;
            $ionicLoading.show();
            $http.post(bindUrl, bindParams).success(function(response){
                $ionicLoading.hide();
                bindLock = 0;
                if(response.errorId == 0){
                    $scope.masterCode = $scope.ctrlScope.inputMasterCode;
                }else {
                    $scope.showAlert();
                    //error note
                }
            });
        };

        //推广大使
        $scope.becomeMaketingPeople = function () {
            var bindUrl = '/taskUser/becomeMarketingUser';
            var bindParams = {'userCId' : $scope.userInfoObject.userCId};
            $ionicLoading.show();
            $http.post(bindUrl, bindParams).success(function(response){
                $ionicLoading.hide();
                bindLock = 0;
                if(response.errorId == 0){
                    $scope.errorId = response.errorId;
                    toastr.success('成功成为推广大使');
                }else {
                    toastr.error(response.message);
                    $scope.showAlertError(response.message);
                    //error note
                }
            });
        };

        //test select
        $scope.unselectUrl = function(){
            try {
                //var inviteEle = document.getElementById("inviteEle");
                //alert(inviteEle);
                //inviteEle.select();
                document.execCommand('Unselect');
            }catch (e){
                alert(e);
            }
        }
    }
})

.controller('TaskHallController', function($scope, $http, $ionicFilterBar, $timeout, $ionicLoading) {
    getUserCode();
    var pageCount = 20;

    //click
    $scope.taskClick = function(clickTask){
        ///app#/tab/task/57eb3f645bbb50005d759375
        window.location.href = '/app#/tab/task/' + clickTask.taskId;
    };

    //返回键

    //默认下载
    $scope.downloadTasks = [];
    $scope.commentTasks = [];

    $scope.downloadHasMore = false;

    //isMore 1(load more) 0(refresh) -1(button click)
    $scope.switchTaskType = function (taskType, isMore) {
        $scope.taskType = taskType;
        var tasksUrl;
        if(taskType == 1){
            if($scope.downloadTasks.length > 0 && isMore == -1){
                return;
            }
            if(isMore == 0){
                //refresh
                tasksUrl = '/taskHall/' + taskType + '/' + gUserCId + '/' + 0;
            }else {
                if($scope.downloadTasks == undefined || $scope.downloadTasks.length == 0){
                    $ionicLoading.show();
                }
                tasksUrl = '/taskHall/' + taskType + '/' + gUserCId + '/' + $scope.downloadTasks.length/pageCount;
            }

            $scope.downloadLoading = true;
        }
        //else if(taskType == 2){
        //    if($scope.commentTasks.length > 0 && isMore == -1){
        //        return;
        //    }
        //    if(isMore == 0) {
        //        //refresh
        //        tasksUrl = '/taskHall/' + taskType + '/' + gUserCId + '/' + 0;
        //    }else {
        //        if($scope.commentTasks == undefined || $scope.commentTasks.length == 0){
        //            $ionicLoading.show();
        //        }
        //        tasksUrl = '/taskHall/' + taskType + '/' + gUserCId + '/' + $scope.commentTasks.length / pageCount;
        //    }
        //    $scope.commentLoading = true;
        //}

        if(tasksUrl == undefined){
            console.error('tasksUrl == undefined');
            return;
        }

        $http.get(tasksUrl)
            .success(function (response) {
            if(taskType == 1){
                $scope.downloadLoading = false;
            }
            //else if(taskType == 2){
            //    $scope.commentLoading = false;
            //}

            if(response.errorId == 0){
                $scope.masterConfig = response.masterConfig;

                //succeed
                if(taskType == 1){
                    if(response.tasks.length > 0){
                        if(isMore == 0){
                            //refresh
                            $scope.downloadTasks = [];
                        }
                        $scope.downloadTasks = $scope.downloadTasks.concat(response.tasks);

                        // $scope.downloadTasks.sort(function(a,b){
                        //     return b.remainCount - a.remainCount;
                        // });
                    }
                }
                //else if(taskType == 2){
                //    if(response.tasks.length > 0){
                //        if(response.tasks.length == pageCount) {
                //            $scope.commentHasMore = true;
                //        }else {
                //            $scope.commentHasMore = false;
                //        }
                //        if(isMore == 0){
                //            //refresh
                //            $scope.commentTasks = [];
                //        }
                //        $scope.commentTasks = $scope.commentTasks.concat(response.tasks);
                //    }else {
                //        $scope.commentHasMore = false;
                //    }
                //}
            }else {
                $scope.errorId = response.errorId;
                $scope.message = response.message;
            }
        })
            .finally(function() {
                $ionicLoading.hide();
                // Stop the ion-refresher from spinning

                if(isMore == 1){
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                }
                if(isMore == 0){
                    $scope.$broadcast('scroll.refreshComplete');
                }

                $timeout(function() {
                    if($scope.downloadTasks.length > 0 && $scope.downloadTasks.length % pageCount == 0){
                        $scope.downloadHasMore = true;
                    }else {
                        $scope.downloadHasMore = false;
                    }
                }, 1000);
        });
    };

    $scope.switchTaskType(1, -1);

    $scope.refreshTaskHall = function(){
        $scope.switchTaskType($scope.taskType, 0);
    };

    $scope.loadMore = function(){
        if($scope.downloadHasMore == true){
            $scope.switchTaskType($scope.taskType, 1);
        }
    };
})

.controller('TaskDetailController', function($rootScope, $scope, $http, $location, FileUploader, $ionicPopup, $interval, $timeout, $ionicLoading,$ionicModal) {
    getUserCode();

    var appurlList = $location.absUrl().split('/');
    var taskId = appurlList[appurlList.length - 1];

    $scope.lockTaskId = undefined;
    $scope.dataStatus = 0;

    var taskDetailTimer;

//例图
    $scope.showAle = function() {
        $scope.bigImage = true;
    };
    $scope.bigImage = false;    //初始默认大图是隐藏的
    $scope.hideBigImage = function () {
        $scope.bigImage = false;
    };


    $scope.showAle1 = function() {
        $scope.bigImage1 = true;
    };
    $scope.bigImage1 = false;    //初始默认大图是隐藏的
    $scope.hideBigImage1 = function () {
        $scope.bigImage1 = false;
    };

    $scope.showAle3=function(index){
        $scope.imgshow=true;
        $scope.img_index=index;
    };
        $scope.imgshow=false;
    $scope.imghidden=function(){
        $scope.imgshow=false;
    };

    $scope.showAle2 = function() {
        $scope.bigImage2 = true;
    };
    $scope.bigImage2 = false;    //初始默认大图是隐藏的
    $scope.hideBigImage2 = function () {
        $scope.bigImage2 = false;
    };
    //excise

   


    //下载和评论的图片宽度不一样
    $scope.setwidth=function(taskType){
        var widthnew ;
        if(taskType=='下载'){
            widthnew=45+'%';

        }
          else if(taskType=='评论' || taskType == '定制评论'){
            widthnew=30+'%';
        }
       return{"width":widthnew};
    };

    $scope.setwidth1=function(doTaskImgs){
       var length=$scope.taskDetail.doTaskImgs.length;
        var widthnew1;
        if(length==2){
            widthnew1=45+'%';

        }
        else if(length==3){
            widthnew1=30+'%';
        }
        return{"width":widthnew1};
    };
    //任务操作
    //newTaskStatus  增加任务,做完任务,放弃任务
    //未完成

    function refreshMyTaskStatus(newTaskStatus){

        if($rootScope.retList == undefined){
            //未进入过 我的任务界面,无需修改
            return;
        }

        var pointerMyTask;
        var pointerIndex;
        for (var i = 0; i < $rootScope.retList.length; i++){
            var myTask = $rootScope.retList[i];
            if(myTask.taskId == taskId){
                pointerMyTask = myTask;
                pointerIndex = i;
            }
        }

        //放弃任务
        if(newTaskStatus == '放弃任务' && pointerIndex != undefined){
            $rootScope.retList.splice(pointerIndex, 1);
        }
        //做完了任务
        //领取任务
        else{
            if(pointerMyTask == undefined){
                var myTaskObject = Object();
                myTaskObject.appIcon = $scope.taskDetail.appIcon;
                myTaskObject.appName = $scope.taskDetail.appName;
                myTaskObject.doTaskPrice = $scope.taskDetail.doTaskPrice;
                myTaskObject.taskId = taskId;

                myTaskObject.statusDes = newTaskStatus;
                myTaskObject.createdAt = $scope.doTaskCreatedAt;
                $rootScope.retList.unshift(myTaskObject)
            }else {
                pointerMyTask.statusDes = newTaskStatus;
            }
        }
    }

    //获取任务详情
    var tasksUrl = '/taskHall/' + gUserCId + '/' + taskId;
    $scope.loading = true;
    $ionicLoading.show();
    $scope.userSpecialNeeds = '';
    $http.get(tasksUrl).success(function (response) {
        $scope.loading = false;
        if(response.errorId == 0){
            //succeed
            $scope.taskDetail = response.taskDetail;
            $scope.lockTaskId = response.taskDetail.lockTaskId;
            $scope.dataStatus = 1;

            $scope.tempTaskMaxTime = response.taskDetail.tempTaskMaxTime;

            var toastTask = '';

            if(response.taskDetail.specialNeeds != undefined){
                for (var i= 0; i < response.taskDetail.specialNeeds.length; i++){
                    $scope.userSpecialNeeds = response.taskDetail.specialNeeds[i]
                }
            }

            if($scope.taskDetail.screenShotOne.needGet == true){
                toastTask += '该任务需要首次下载' + '<br>';
            }
            if($scope.taskDetail.screenShotTwo.registerStatus == 'third'){
                toastTask += '该任务需要第三方登陆' + '<br>';
            }
            if($scope.taskDetail.screenShotThird.needMoreReviewContent == true){
                toastTask += '该任务需要超长评论' + '<br>';
            }
            if ($scope.userSpecialNeeds.AppleID == 'on'){
                toastTask += '该任务需要填写Apple ID' + '<br>';
            }
            if ($scope.userSpecialNeeds.userNickName == 'on'){
                toastTask += '该任务需要填写用户昵称' + '<br>';
            }
            if ($scope.userSpecialNeeds.weChat == 'on'){
                toastTask += '该任务需要填写微信号' + '<br>';
            }

            if(toastTask.length > 1){
                $ionicPopup.confirm({
                    title: '特殊任务要求提示',
                    template: toastTask
                });
            }


            if($scope.lockTaskId != undefined){
                //任务已经领取
                if(taskDetailTimer != undefined){
                    $interval.cancel(taskDetailTimer);
                    taskDetailTimer = undefined;
                }
                if($scope.taskDetail.doTaskStatus != 'uploaded'){
                    //做任务倒计时
                    taskDetailTimer = $interval(function(){
                        var now = new Date();
                        var taskTimerStr = $scope.taskDetail.doTaskCreatedAt.replace(/-/g,"/");
                        var taskDate = new Date(taskTimerStr);
                        //TODO 被拒绝任务的倒计时应该是第二天10点前
                        var leftTime;
                        if($scope.taskDetail.doTaskStatus == 'refused'){
                            var nextDay = new Date(now.getTime() + 24*60*60*1000);
                            nextDay.setHours(9);    //10点
                            nextDay.setMinutes(0);
                            nextDay.setSeconds(0);
                            nextDay.setMilliseconds(0);
                            leftTime = nextDay.getTime() - now.getTime();
                        }else {
                            leftTime = $scope.tempTaskMaxTime - (now.getTime() - taskDate.getTime());
                        }

                        if(leftTime < 0){
                            if(taskDetailTimer != undefined){
                                $interval.cancel(taskDetailTimer);
                                taskDetailTimer = undefined;
                            }
                            return;
                        }

                        if($scope.taskDetail.doTaskStatus == ''){
                            if(taskDetailTimer != undefined){
                                $interval.cancel(taskDetailTimer);
                                taskDetailTimer = undefined;
                            }
                            return;
                        }

                        var leftSecond = parseInt(leftTime / 1000);
                        //var day = Math.floor(leftSecond / daySeconds);
                        leftSecond = leftSecond % (60 * 60 * 24);
                        var hour = Math.floor(leftSecond / 3600);
                        leftSecond = leftSecond % 3600;
                        var minute = Math.floor(leftSecond / 60);
                        leftSecond = leftSecond % 60;
                        var second = leftSecond;

                        var countDownStr = (hour > 0 ? (hour + ":") : '') +
                            (minute > 0 ? (minute + ":") : '')  + second;
                        if($scope.taskDetail.doTaskStatus == 'uploaded' || $scope.taskDetail.doTaskStatus == 'reUploaded' || $scope.taskDetail.doTaskStatus == 'refused'){
                            $scope.uploadButtonTitle = '重新上传' + $scope.taskPicCount + '张任务截图  ' + countDownStr;
                        }else {
                            $scope.uploadButtonTitle = '上传' + $scope.taskPicCount + '张任务截图  ' + countDownStr;
                        }

                    }, interval);
                }

                //倒计时结束

                $scope.taskPicCount = response.taskDetail.taskPicCount;
                $scope.progressNum = 0;

                if($scope.taskDetail.doTaskStatus == 'uploaded' || $scope.taskDetail.doTaskStatus == 'reUploaded' || $scope.taskDetail.doTaskStatus == 'refused'){
                    $scope.uploadButtonTitle = '重新上传' + $scope.taskPicCount + '张任务截图';
                }else {
                    $scope.uploadButtonTitle = '上传' + $scope.taskPicCount + '张任务截图';
                }

                if(response.taskDetail.doTaskStatus == 'refused'){
                    $scope.errorId = -1;
                    $scope.errorMsg = response.taskDetail.refusedReason;
                }
            }
        }else {
            $scope.errorId = response.errorId;
            $scope.message = response.message;
        }
    })
        .finally(function(){
            $ionicLoading.hide();
        });

    var locklock = 0;
    $scope.lockTask = function(){
        if(locklock == 1){
            return;
        }
        locklock = 1;
        $ionicLoading.show();
        var lockTaskUrl = '/taskHall/lockTask';
        var lockParam = {'userCId' : gUserCId, 'taskId' : taskId};
        $http.post(lockTaskUrl, lockParam).success(function(response){
            locklock = 0;
            if(response.errorId == 0){
                $scope.lockTaskId = response.lockTaskId;
                $scope.doTaskCreatedAt = response.doTaskCreatedAt;
                $scope.taskPicCount = response.taskPicCount;
                $scope.taskDetail = response.taskDetail;
                $scope.uploadButtonTitle = '上传' + $scope.taskPicCount + '张任务截图' ;
                $scope.progressNum = 0;

                refreshMyTaskStatus('未完成');

                //倒计时
                if(taskDetailTimer != undefined){
                    $interval.cancel(taskDetailTimer);
                    //taskDetailTimer = undefined;
                }

                taskDetailTimer = $interval(function(){
                    var now = new Date();
                    var taskTimerStr = $scope.doTaskCreatedAt.replace(/-/g,"/");
                    var taskDate = new Date(taskTimerStr);
                    var leftTime = $scope.tempTaskMaxTime - (now.getTime() - taskDate.getTime());

                    if(leftTime < 0){
                        if(taskDetailTimer != undefined){
                            $interval.cancel(taskDetailTimer);
                            taskDetailTimer = undefined;
                        }
                        return;
                    }

                    var leftSecond = parseInt(leftTime / 1000);
                    //var day = Math.floor(leftSecond / daySeconds);
                    leftSecond = leftSecond % (60 * 60 * 24);
                    var hour = Math.floor(leftSecond / 3600);
                    leftSecond = leftSecond % 3600;
                    var minute = Math.floor(leftSecond / 60);
                    leftSecond = leftSecond % 60;
                    var second = leftSecond;

                    var countDownStr = (hour > 0 ? (hour + ":") : '') +
                        (minute > 0 ? (minute + ":") : '')  + second;

                    if($scope.taskDetail.doTaskStatus == 'uploaded' || $scope.taskDetail.doTaskStatus == 'reUploaded' || $scope.taskDetail.doTaskStatus == 'refused'){
                        $scope.uploadButtonTitle = '重新上传' + $scope.taskPicCount + '张任务截图 ' + countDownStr;
                    }else {
                        $scope.uploadButtonTitle = '上传' + $scope.taskPicCount + '张任务截图 ' + countDownStr;
                    }

                }, interval);
                //倒计时结束
            }else {


                if (response.errorId <= -100){
                    var myPopup = $ionicPopup.show({
                        title: response.message,
                        buttons: [
                            {text: '确定'}
                        ]
                    });
                }else {
                    var myPopup = $ionicPopup.show({
                        title: response.message,
                    });

                    $timeout(function() {
                        myPopup.close(); //由于某种原因3秒后关闭弹出
                    }, 1500);
                }
            }
        })
            .finally(function(){
                $ionicLoading.hide();
            });
    };

    var unlocklock = 0;
    $scope.unlockTask = function(){
        if(unlocklock == 1 || $scope.lockTaskId == undefined){
            return;
        }
        unlocklock = 1;
        $ionicLoading.show();
        var lockTaskUrl = '/taskHall/unlockTask';
        var lockParam = {'userCId' : gUserCId, 'lockTaskId' : $scope.lockTaskId};
        $http.post(lockTaskUrl, lockParam).success(function(response){
            unlocklock = 0;
            if(taskDetailTimer != undefined){
                $interval.cancel(taskDetailTimer);
                taskDetailTimer = undefined;
            }

            if(response.errorId == 0){
                $scope.lockTaskId = undefined;
                $scope.taskDetail = response.taskDetail;
                refreshMyTaskStatus('放弃任务');
            }
        })
            .finally(function(){
                $ionicLoading.hide();
            });
    };

    //点击复制标题
    $scope.copyTitleKeyword = function(type){
        if (type == 'A'){
            var div = document.getElementById('titleKeywordA');
            if (document.selection) {
                // for IE
                var r = document.body.createTextRange();
                r.moveToElementText(div);
                r.moveEnd("character");
                r.select();
            } else {
                // For others
                var s = window.getSelection();
                var d = document.createRange();
                d.selectNode(div);
                s.addRange(d);
                document.execCommand("Copy"); // 执行浏览器复制命令
                alert("已复制好，可贴粘。");
                s.removeAllRanges()
            }
        }
        else {
            var divA = document.getElementById('commentKeywordA');
            if (document.selection) {
                // for IE
                var e = document.body.createTextRange();
                e.moveToElementText(divA);
                e.moveEnd("character");
                e.select();
            } else {
                // For others
                var f = window.getSelection();
                var i = document.createRange();
                i.selectNode(divA);
                f.addRange(i);
                document.execCommand("Copy"); // 执行浏览器复制命令
                alert("已复制好，可贴粘。");
                f.removeAllRanges()
            }
        }

    };

    //var posklock = 0;
    //$scope.postTask = function(){
    //    if(posklock == 1){
    //        return;
    //    }
    //    posklock = 1;
    //
    //    var uploadTaskUrl = '/taskHall/tempUserDoTask';
    //    var lockParam = {'userCId' : gUserCId, 'taskId' : $scope.taskDetail.id};
    //    $http.post(uploadTaskUrl, lockParam).success(function(response){
    //        posklock = 0;
    //    });
    //};

    $scope.preUploadFile = function () {
        $scope.imgError = 1;
        uploader.clearQueue();
    };

    $scope.ert = $scope;
    $scope.clickImg = function(){
        var input;
        if ($scope.userSpecialNeeds.AppleID == 'on'){
            input = 'Apple ID:<input type="text" ng-model="ert.appleId">'
        }
        if ($scope.userSpecialNeeds.userNickName == 'on'){
            input = '用户昵称:<input type="text" ng-model="ert.userNickName">'
        }
        if ($scope.userSpecialNeeds.weChat == 'on'){
            input = '填写微信:<input type="text" ng-model="ert.userWeChat">'
        }

        if ($scope.userSpecialNeeds.AppleID == 'on' && $scope.userSpecialNeeds.userNickName == 'on'){
            input = 'Apple ID:<input type="text" ng-model="ert.appleId">' + '<br>' + '用户昵称:<input type="text" ng-model="ert.userNickName">'
        }

        if ($scope.userSpecialNeeds.userNickName == 'on' && $scope.userSpecialNeeds.weChat == 'on'){
            input = '用户昵称:<input type="text" ng-model="ert.userNickName">' + '<br>' + '填写微信:<input type="text" ng-model="ert.userWeChat">'
        }

        if ($scope.userSpecialNeeds.AppleID == 'on' && $scope.userSpecialNeeds.weChat == 'on'){
            input = 'Apple ID:<input type="text" ng-model="ert.appleId">' + '<br>' + '填写微信:<input type="text" ng-model="ert.userWeChat">'
        }

        if ($scope.userSpecialNeeds.AppleID == 'on' && $scope.userSpecialNeeds.userNickName == 'on' &&
            $scope.userSpecialNeeds.weChat == 'on'){
            input = 'Apple ID:<input type="text" ng-model="ert.appleId">' + '<br>' + '用户昵称:<input type="text" ng-model="ert.userNickName">' + '<br>'
            + '填写微信:<input type="text" ng-model="ert.userWeChat">'
        }

        $ionicPopup.show({
            template: input,
            title: '用户输入内容',
            scope: $scope,
            buttons: [
                {text: '取消'},
                {
                    text: '<b>确认</b>',
                    type: 'button-positive',
                    onTap: function () {
                        $scope.userInputDetail();
                    }

                }

            ]
        });
    };

    var userInputArray = Array();
    $scope.userInputDetail = function(){
        var ertObject = Object();
        if ($scope.ert.appleId != '' || $scope.ert.appleId != undefined){
            ertObject.appleID = $scope.ert.appleId;
        }
        if ($scope.ert.userNickName != '' || $scope.ert.userNickName != undefined){
            ertObject.userNickName = $scope.ert.userNickName;
        }
        if ($scope.ert.weChat != '' || $scope.ert.weChat != undefined){
            ertObject.weChat = $scope.ert.weChat;
        }

        userInputArray.push(ertObject);

    };



    //上传图片的代码
    if (window.localStorage) {
        $scope.userCode = localStorage.getItem("userCode");
    } else {
        $scope.userCode = getCookie('userCode');
    }

    //upload file
    var uploader = $scope.uploader = new FileUploader({
        url: '/upload/img',
        queueLimit: 3
        //removeAfterUpload:true
    });

    uploader.filters.push({
        name: 'imageFilter',
        fn: function (item /*{File|FileLikeObject}*/, options) {
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|'.indexOf(type) !== -1;
        }
    });

    //$scope.deletFile = function () {
    //    $scope.imgError = 1;
    //    uploader.clearQueue();
    //};

    var fileUrls = new Array();

    uploader.onAfterAddingFile = function (fileItem) {
        //
    };

    uploader.onAfterAddingAll = function (addedFileItems) {
        $scope.errorId = 0;
        $scope.progressNum = 5;

        uploader.uploadAll();
        console.info('onAfterAddingAll', addedFileItems);
    };

    uploader.onProgressAll = function (progress) {
        $scope.progressNum = progress*0.8 > 10 ? progress*0.8 : 10;
        console.info('onProgressAll', progress);
    };
    uploader.onSuccessItem = function (fileItem, response, status, headers) {
        console.info('onSuccessItem', fileItem, response, status, headers);
    };
    uploader.onErrorItem = function (fileItem, response, status, headers) {
        $scope.errorId = 1;
        $scope.errorMsg = '上传图片失败';
        console.info('onErrorItem', fileItem, response, status, headers);
    };
    uploader.onCancelItem = function (fileItem, response, status, headers) {
        console.info('onCancelItem', fileItem, response, status, headers);
    };

    uploader.onCompleteItem = function (fileItem, response, status, headers) {
        if(response.files != undefined && response.files.length > 0){
            fileUrls.push(response.files[0]);
            console.info('onCompleteItem', fileItem, response, status, headers);
        }else {
            $scope.errorId = -100;
            $scope.errorMsg = '一张或多张图片上传失败,刷新网页重新上传';
        }

    };

    function showAlertError(errorMsg){
        var myPopup = $ionicPopup.show({
            title: errorMsg
        });

        $timeout(function() {
            myPopup.close();
        }, 2000);
    }

    uploader.onCompleteAll = function () {
        console.info('onCompleteAll');
        var Url = '/taskHall/tempUserDoTask';
        $scope.progressNum = 90;

        if(fileUrls.length < $scope.taskPicCount){
            showAlertError('图片个数不对,需要' + $scope.taskPicCount + '张图片');
            $scope.progressNum = 0;
            uploader.clearQueue();
            fileUrls = Array();
            return;
        }

        if (($scope.ert.appleId == '' || $scope.ert.appleId == undefined) && $scope.userSpecialNeeds.AppleID == 'on'){
            showAlertError('AppleID未填');
            $scope.progressNum = 0;
            uploader.clearQueue();
            fileUrls = Array();
            return;
        }
        if (($scope.ert.userNickName == '' || $scope.ert.userNickName == undefined) && $scope.userSpecialNeeds.userNickName == 'on'){
            showAlertError('用户昵称未填');
            $scope.progressNum = 0;
            uploader.clearQueue();
            fileUrls = Array();
            return;
        }
        if (($scope.ert.weChat == '' || $scope.ert.weChat == undefined) && $scope.userSpecialNeeds.weChat == 'on'){
            showAlertError('微信未填');
            $scope.progressNum = 0;
            uploader.clearQueue();
            fileUrls = Array();
            return;
        }

        if (userInputArray.length == 0 && $scope.userSpecialNeeds.length > 0){
            showAlertError('必填项未填');
            $scope.progressNum = 0;
            uploader.clearQueue();
            fileUrls = Array();
            return;
        }


        $http.post(Url, {
                'userCId':gUserCId,
                'taskId':$scope.lockTaskId,
                'uploadName':$scope.userCode,
                'requirementImgs': fileUrls,
                'userInputArray':userInputArray
            })
            .success(function (response) {
                $scope.errorId = response.errorId;
                $scope.errorMsg = response.errorMsg;
                console.log($scope.errorId);
                console.log($scope.errorMsg);
                if($scope.errorId == 0){
                    if(taskDetailTimer != undefined){
                        $interval.cancel(taskDetailTimer);
                        taskDetailTimer = undefined;
                    }
                    $scope.downloadTasks = 'uploaded';
                    $scope.doTaskImgs = response.requirementImgs;
                    $scope.uploadButtonTitle = '确认提交任务';

                    $scope.nowUpladedImgs = 1;

                    refreshMyTaskStatus('审核中');

                    if(response.message.length > 10){
                        //未绑定手机号

                        //绑定手机号
                        $rootScope.showPhoneConfirm(response.message);
                    }

                    //$("#up").attr("disabled", true);
                }else {
                    $scope.errorId = response.errorId;
                    $scope.errorMsg = response.message;
                }

                $scope.progressNum = 0;

                uploader.clearQueue();
                fileUrls = Array();
            });
    };
    $scope.backlastpage = function(){
        if($scope.uploadButtonTitle == '确认提交任务'){
            window.history.back();
        }
    };
    $scope.endTask = function(){
        //location.href='/myClaim/' + $scope.oneAppInfo.userObjectId;
    }
})

.controller('MyTaskController', function($rootScope, $scope, $http, $interval, $timeout, $ionicLoading) {
    getUserCode();

    //倒计时代码
    var myTaskTimer;

    //click
    $scope.taskClick = function(clickTask){
        ///app#/tab/task/57eb3f645bbb50005d759375
        window.location.href = '/app#/tab/myTask/' + clickTask.taskId;
    };

    $scope.refreshMyTask = function(refreshTag){
        $http.post(tasksUrl, {'userCId': gUserCId}).success(function (response) {
                $ionicLoading.hide();
                $scope.loading = false;
                if(response.errorId == 0){
                    //succeed
                    $scope.masterConfig = response.masterConfig;
                    $rootScope.retList = response.retList;
                    $scope.undoTask = response.undoTask;
                    $scope.willGetRmb = response.willGetRmb;
                    $scope.tempTaskMaxTime = response.tempTaskMaxTime;

                    //*******************************开始倒计时
                    if(myTaskTimer != undefined){
                        $interval.cancel(myTaskTimer);
                        myTaskTimer = undefined;
                    }
                    myTaskTimer = $interval(function(){
                        var now = new Date();
                        for (var i = 0; i < $scope.retList.length; i++){
                            var myTaskObject = $scope.retList[i];
                            if(myTaskObject.createdAt != undefined){
                                var taskTimerStr = myTaskObject.createdAt.replace(/-/g,"/");
                                var taskDate = new Date(taskTimerStr);
                                var leftTime = $scope.tempTaskMaxTime - (now.getTime() - taskDate.getTime());

                                if(leftTime < 0){
                                    myTaskObject.createdAt == undefined;
                                    myTaskObject.statusDes = '已超时';

                                    if(myTaskTimer != undefined){
                                        $interval.cancel(myTaskTimer);
                                        myTaskTimer = undefined;
                                    }
                                    return;
                                }

                                var leftSecond = parseInt(leftTime / 1000);
                                //var day = Math.floor(leftSecond / daySeconds);
                                leftSecond = leftSecond % (60 * 60 * 24);
                                var hour = Math.floor(leftSecond / 3600);
                                leftSecond = leftSecond % 3600;
                                var minute = Math.floor(leftSecond / 60);
                                leftSecond = leftSecond % 60;
                                var second = leftSecond;

                                myTaskObject.downcountDisplay = (hour > 0 ? (hour + "时") : '') +
                                    (minute > 0 ? (minute + "分") : '')  + second + "秒";
                            }
                        }
                    }, interval);
                }else {
                    $scope.errorId = response.errorId;
                    $scope.message = response.message;
                }
            })
            .finally(function() {
                // Stop the ion-refresher from spinning
                $scope.$broadcast('scroll.refreshComplete');
            });
    };

    var tasksUrl = '/taskHall/myTask';
    $ionicLoading.show();
    $scope.refreshMyTask(-1);
})

.controller('AccountController', function($rootScope, $scope, $http, $timeout, $ionicLoading, $ionicPopup) {
    getUserCode();
    $scope.settings = {
        enviarNotificaciones: true
    };

    $scope.refreshTaskAccount = function(refreshTask){
        var accountUser = '/taskUser/withdrawDeposit';
        $http.post(accountUser, {'userCId':gUserCId})
            .success(function(response){
            $ionicLoading.hide();
            $scope.temUserInfo = response.temUserInfo;
            $scope.canWithdrawMoney = response.temUserInfo.canWithdrawMoney;
            console.log($scope.canWithdrawMoney)
        })
            .finally(function () {
                // Stop the ion-refresher from spinning
                $ionicLoading.hide();
                if (refreshTask == 1) {
                    $scope.$broadcast('scroll.refreshComplete');
                }
            });
    };

    $scope.refreshTaskAccount(1);

    //推广大师
    var tempUserCode;
    if (window.localStorage) {
        tempUserCode = localStorage.getItem("userCode");
    } else {
        tempUserCode = getCookie('userCode');
    }

    var accountUser = '/taskUser/marketingApprenticeCount';
    $http.post(accountUser, {'userCId':gUserCId, 'userCode':tempUserCode})
        .success(function(response){
            $scope.rewardMessages = response.rewardMessages;
            console.log($scope.canWithdrawMoney)
        })
        .finally(function () {
            // Stop the ion-refresher from spinning
        });

    $scope.getMarketingReward = function () {
        $ionicLoading.show();
        var accountUser = '/taskUser/getMarketingApprenticeReward';

        $http.post(accountUser, {'userCId':gUserCId, 'userCode':tempUserCode})
            .success(function(response){
                $ionicLoading.hide();
                if(response.errorId == 0){
                    $scope.temUserIncanWithdrawMoney = response.temUserInfo.canWithdrawMoney;
                    toastr.success(response.message);
                }else {
                    toastr.error(response.message);
                }

            })
            .finally(function () {
                // Stop the ion-refresher from spinning
                $ionicLoading.hide();
            });
    };

    function showAlertError(errorMsg){
        var myPopup = $ionicPopup.show({
            title: errorMsg
        });

        $timeout(function() {
            myPopup.close();
        }, 2000);
    }


    //绑定接口
    var bindLock = 0;
    $rootScope.bindpay = function(type){
        if(bindLock == 1){
            return;
        }
        var bindpay;
        var binditem;
        if(type == 'aliAccount'){
            if($scope.ctrlScope.inputaliAccount == undefined && $scope.ctrlScope.inputaliAccount.length == 0){
                return;
            }
            binditem = {'userCId' : gUserCId, 'aliAccount' : $scope.ctrlScope.inputaliAccount};
            bindpay = '/taskUser/bindAliPay';
        }else if(type == 'requestSms'){
            if($scope.ctrlScope.phoneNumber == undefined && $scope.ctrlScope.phoneNumber.length == 0){
                return;
            }
            binditem = {'userCId' : gUserCId, 'phoneNumber' : $scope.ctrlScope.phoneNumber};
            bindpay = '/taskUser/requestSms';
        }else if(type == 'bindPhone'){
            if($scope.ctrlScope.smsCode == undefined && $scope.ctrlScope.smsCode.length == 0){
                return;
            }
            binditem = {'userCId' : gUserCId, 'phoneNumber' : $scope.ctrlScope.phoneNumber , 'smsCode': $scope.ctrlScope.smsCode};
            bindpay = '/taskUser/bindPhone';
        }
        else if(type == 'aliPayUserName'){
            if($scope.ctrlScope.aliPayUserName == undefined && $scope.ctrlScope.aliPayUserName.length == 0){
                return;
            }
            binditem = {'userCId' : gUserCId, 'aliPayUserName' : $scope.ctrlScope.aliPayUserName};
            bindpay = '/taskUser/aliPayName';
        }
        else {
            return;
        }


        bindLock = 1;
        $ionicLoading.show();

        $http.post(bindpay, binditem).success(function(response){
            $ionicLoading.hide();
            bindLock = 0;
            if(response.errorId == 0){
                if(type == 'requestSms'){
                    $rootScope.binderPhoneNumber();
                }else if (type == 'aliPayUserName'){
                    alert('赞！绑定姓名成功,提现会在1~2个工作日到账');
                    $scope.temUserInfo.aliPayUserName = response.aliPayUserName;
                }
                else if (type == 'aliAccount'){
                    alert('支付宝绑定成功,如需修改支付宝,请联系管理员');
                    $scope.temUserInfo = response.temUserInfo;
                }
                else {

                    //refresh cookie
                    if (window.localStorage) {
                        try {
                            localStorage.setItem("userCId", response.temUserInfo.userCId);
                            localStorage.setItem("userCode", response.temUserInfo.userCode);
                        }
                        catch (e) {
                            //alert(e);
                            alert('无痕模式无法正常使用小马哦,点击右下角后,再点击左下角关闭无痕模式');
                            return;
                        }
                    } else {
                        setCookie("userCId", response.temUserInfo.userCId);
                        setCookie("userCode", response.temUserInfo.userCode);
                        alert('set cookie succeed');
                    }

                    getUserCode();
                    $scope.temUserInfo = response.temUserInfo;

                    if(type == 'bindPhone'){
                        alert('赞！绑定手机号成功,小马会在每天下午2-3点放出大量任务');
                    }

                }
            }else {
                //error note
                showAlertError(response.message);

            }
        });
    };

    //申请提现
    var askForWithdrawLock = 0;
    $scope.askForWithdraw = function(){
        if(askForWithdrawLock == 1){
            return;
        }
        var withdrawUrl = '/taskUser/withDraw';
        var params = {'userCId' : gUserCId};
        askForWithdrawLock = 1;
        $ionicLoading.show();
        $http.post(withdrawUrl, params).success(function(response){
            $ionicLoading.hide();
            askForWithdrawLock = 0;
            if(response.errorId == 0){
                alert("提现成功");
                $scope.temUserInfo = response.temUserInfo;
            }else {
                //error note
                showAlertError(response.message);
            }
        });
    };

    //绑定支付宝账号
    $scope.ctrlScope = $scope;
    $scope.showConfirm = function() {
        $ionicPopup.show({
            template: '<input type="text" ng-model="ctrlScope.inputaliAccount">',
            title: '绑定你的支付宝',
            scope: $scope,
            buttons: [
                {text: '取消'},
                {
                    text: '<b>绑定</b>',
                    type: 'button-positive',
                    onTap: function () {
                        $rootScope.bindpay('aliAccount');
                    }
                },

            ]
        });
    };

    //绑定手机号
    $rootScope.binderPhoneNumber = function() {
        $ionicPopup.show({
            template: '<input type="text" placeholder="验证码" ng-model="ctrlScope.smsCode">',
            title: '输入你的验证码',
            scope: $scope,
            buttons: [
                {text: '取消'},
                {
                    text: '<b>绑定</b>',
                    type: 'button-positive',
                    onTap: function () {
                        $rootScope.bindpay('bindPhone');
                    }
                }

            ]
        });
    };


    //发送验证码
    $rootScope.showPhoneConfirm = function(popTitle) {
        $ionicPopup.show({
            template: '<input type="text" placeholder="手机号" ng-model="ctrlScope.phoneNumber">',
            title: popTitle,
            scope: $scope,
            buttons: [
                {text: '取消'},
                {
                    text: '<b>获取验证码</b>',
                    type: 'button-positive',
                    onTap: function () {
                        $rootScope.bindpay('requestSms');
                    }
                }
            ]
        });
    };

    // 绑定支付宝帐号的真实姓名
    $rootScope.showaliPayUserNameConfirm = function(popTitle) {
        $ionicPopup.show({
            template: '<input type="text" placeholder="绑定支付宝账号的真实姓名" ng-model="ctrlScope.aliPayUserName">',
            title: popTitle,
            scope: $scope,
            buttons: [
                {text: '取消'},
                {
                    text: '<b>确定</b>',
                    type: 'button-positive',
                    onTap: function () {
                        $rootScope.bindpay('aliPayUserName');
                    }
                }
            ]
        });
    };

    //申请提现
    $scope.Withdraw = function(){
        if($scope.canWithdrawMoney < $scope.temUserInfo.minUserWithDrawRMB && ($scope.temUserInfo.isMarketingApprentice == undefined
            || $scope.temUserInfo.isMarketingApprentice == false)){
            var alertPopup = $ionicPopup.alert({
                title: '满' + $scope.temUserInfo.minUserWithDrawRMB + '元方可提现',
                subTitle: '每次提现金额为' + $scope.temUserInfo.minUserWithDrawRMB + '的整数倍',
            });

            $timeout(function() {
                alertPopup.close(); //由于某种原因3秒后关闭弹出
            }, 2000);
        }

        else if ($scope.canWithdrawMoney < $scope.temUserInfo.apprenticeUserWithDrawRMB && $scope.temUserInfo.isMarketingApprentice == true){

            var alerPopup = $ionicPopup.alert({
                title: '满' + $scope.temUserInfo.apprenticeUserWithDrawRMB + '元方可提现',
                subTitle: '每次提现金额为' + $scope.temUserInfo.apprenticeUserWithDrawRMB + '的整数倍',
            });

            $timeout(function() {
                alerPopup.close(); //由于某种原因3秒后关闭弹出
            }, 2000);
        }
        else{
            $scope.askForWithdraw();
        }

    }
})

.controller('currentAssetDetailController', function($scope, $http, $ionicLoading, $timeout){
    getUserCode();
    var pageCount = 20;

    //默认下载
    $scope.downloadTasks = [];
    $scope.commentTasks = [];
    $scope.apprenticeInfo = [];
    $scope.withdrawDeposits = [];

    $scope.downloadHasMore = false;
    $scope.commentLoadHasMore = false;
    $scope.apprenticeInfoLoadHasMore = false;
    $scope.withdrawDepositsLoadHasMore = false;

    //isMore 1(load more) 0(refresh) -1(button click)
    $scope.switchQueryType = function (taskType, isnMore) {
        $scope.taskType = taskType;
        var currentAssURL;
        if(taskType == 1){
            if($scope.downloadTasks.length > 0 && isnMore == -1){
                return;
            }
            if(isnMore == 0){
                //refresh
                currentAssURL = '/taskUserDetails/currentAsset/' + taskType + '/' + gUserCId + '/' + 0;
            }else {
                if($scope.downloadTasks == undefined || $scope.downloadTasks.length == 0){
                    $ionicLoading.show();
                }
                currentAssURL = '/taskUserDetails/currentAsset/' + taskType + '/' + gUserCId + '/' + $scope.downloadTasks.length/pageCount;
            }

        }
        else if(taskType == 2){
            if($scope.commentTasks.length > 0 && isnMore == -1){
                return;
            }
            if(isnMore == 0) {
                //refresh
                currentAssURL = '/taskUserDetails/currentAsset/' + taskType + '/' + gUserCId + '/' + 0;
            }else {
                if($scope.commentTasks == undefined || $scope.commentTasks.length == 0){
                    $ionicLoading.show();
                }
                currentAssURL = '/taskUserDetails/currentAsset/' + taskType + '/' + gUserCId + '/' + $scope.commentTasks.length / pageCount;
            }

        }
        else if (taskType == 3){
            if($scope.apprenticeInfo.length > 0 && isnMore == -1){
                return;
            }
            if(isnMore == 0) {
                //refresh
                currentAssURL = '/taskUserDetails/currentAsset/' + taskType + '/' + gUserCId + '/' + 0;
            }else {
                if($scope.apprenticeInfo == undefined || $scope.apprenticeInfo.length == 0){
                    $ionicLoading.show();
                }
                currentAssURL = '/taskUserDetails/currentAsset/' + taskType + '/' + gUserCId + '/' + $scope.apprenticeInfo.length / pageCount;
            }

        }
        else if (taskType == 4){
            if($scope.withdrawDeposits.length > 0 && isnMore == -1){
                return;
            }
            if(isnMore == 0) {
                //refresh
                currentAssURL = '/taskUserDetails/currentAsset/' + taskType + '/' + gUserCId + '/' + 0;
            }else {
                if($scope.withdrawDeposits == undefined || $scope.withdrawDeposits.length == 0){
                    $ionicLoading.show();
                }
                currentAssURL = '/taskUserDetails/currentAsset/' + taskType + '/' + gUserCId + '/' + $scope.withdrawDeposits.length / pageCount;
            }

        }


        $http.get(currentAssURL)
            .success(function (response) {
                if(response.errorId == 0){
                    if(taskType == 1){
                        if(response.retApps.length > 0){
                            if(isnMore == 0){
                                //refresh
                                $scope.downloadTasks = [];
                            }
                            $scope.downloadTasks = $scope.downloadTasks.concat(response.retApps);
                        }
                    }
                    else if(taskType == 2){
                        if(response.retApps.length > 0){
                            if(isnMore == 0){
                                //refresh
                                $scope.commentTasks = [];
                            }
                            $scope.commentTasks = $scope.commentTasks.concat(response.retApps);

                        }
                    }
                    else if (taskType == 3){
                        if(response.discipleArray.length > 0){
                            if(isnMore == 0){
                                //refresh
                                $scope.apprenticeInfo = [];
                            }
                            $scope.apprenticeInfo = $scope.apprenticeInfo.concat(response.discipleArray);

                        }
                    }
                    else if (taskType == 4){
                        if(response.depositsList.length > 0){
                            if(isnMore == 0){
                                //refresh
                                $scope.withdrawDeposits = [];
                            }
                            $scope.withdrawDeposits = $scope.withdrawDeposits.concat(response.depositsList);

                        }
                    }

                }else {
                    $scope.errorId = response.errorId;
                    $scope.message = response.message;
                }
            })
                .finally(function() {
                    $ionicLoading.hide();
                    // Stop the ion-refresher from spinning
                    if(isnMore == 1){
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                    }
                    if(isnMore == 0){
                        $scope.$broadcast('scroll.refreshComplete');
                    }

                    $timeout(function() {
                        if ($scope.taskType == 1){
                            if($scope.downloadTasks.length > 0 && $scope.downloadTasks.length % pageCount == 0){
                                $scope.downloadHasMore = true;
                            }
                            else {
                                $scope.downloadHasMore = false;
                            }
                        }
                        else if ($scope.taskType == 2){
                            if ($scope.commentTasks.length > 0 && $scope.commentTasks.length % pageCount == 0){
                                $scope.commentLoadHasMore = true;
                            }
                            else {
                                $scope.commentLoadHasMore = false;
                            }

                        }
                        else if ($scope.taskType == 3){
                            if ($scope.apprenticeInfo.length > 0 && $scope.apprenticeInfo.length % pageCount == 0){
                                $scope.apprenticeInfoLoadHasMore = true;
                            }
                            else {
                                $scope.apprenticeInfoLoadHasMore = false;
                            }
                        }
                        else {
                            if ($scope.withdrawDeposits.length > 0 && $scope.withdrawDeposits.length % pageCount == 0){
                                $scope.withdrawDepositsLoadHasMore = true;
                            }
                            else {
                                $scope.withdrawDepositsLoadHasMore = false;
                            }
                        }
                    }, 1000);
                });
    };

    $scope.switchQueryType(1, -1);

    $scope.loadMore = function(){
        if($scope.downloadHasMore == true){
            $scope.switchQueryType(1, 1);
        }
        else if ($scope.commentLoadHasMore == true){
            $scope.switchQueryType(2, 1);
        }
        else if ($scope.apprenticeInfoLoadHasMore == true){
            $scope.switchQueryType(3, 1);
        }
        else if ($scope.withdrawDepositsLoadHasMore == true){
            $scope.switchQueryType(4, 1);
        }
    };

})

.controller('LotteryController', function($rootScope, $scope, $http, $timeout, $ionicPopup) {
    getUserCode();
    $scope.currentBidDic = {};
    function getLotteryInfo(userCId)
    {
        var url = '/lottery/' + userCId;
        $http.get(url).success(function(response) {
            for (var i = 1;i <= 9; i++) {
                $scope.currentBidDic[i] = response.currentBidArray[i];
                $scope.pool = response.pool;
                $scope.totalMoney = response.totalMoney;
            }
        })
    }

    getLotteryInfo(gUserCId);

    $scope.bidConfirm = function(money, index) {
        if (money < 1) {
            var alertPopup = $ionicPopup.alert({
                title: '下注失败',
                template: '你的余额不足'
            });
            alertPopup.then(function(res) {
            });
        }
        else {
            var confirmPopup = $ionicPopup.confirm({
                title: '下注确认',
                template: '你确定要消费1元,购买一注数字' + index + '吗?',
                cancelText: '取消', // String (默认: 'Cancel')。一个取消按钮的文字。
                okText: '确认' // String (默认: 'OK')。OK按钮的文字。
            });
            confirmPopup.then(function(res) {
                if(res) {
                    var biddingUrl = '/lottery/' + gUserCId + '/' + index;
                    $http.get(biddingUrl)
                        .success(function (response) {
                            var alertPopup = $ionicPopup.alert({
                                title: '下注成功',
                                template: '已成功下注数字' + index + '一注'
                            });
                            alertPopup.then(function(res) {
                            });
                            getLotteryInfo(gUserCId);
                            console.log('确认购买');
                        })
                        .catch(function(response){
                            var alertPopup = $ionicPopup.alert({
                                title: '下注失败',
                                template: response.message
                            });
                            alertPopup.then(function(res) {
                            });
                            console.log(response.message);
                        });
                } else {
                    console.log('取消购买');
                }
            });
        }
    };
})

    .controller('lotteryManualController', function($rootScope, $scope, $http) {

    })
    .controller('lotteryResultsController', function($rootScope, $scope, $http) {
        var url = '/lotteryResults';
        $http.get(url).success(function(response) {
            $scope.pools = response.pools;
            console.log($scope.pools);
        })
    })
;
