/**
  Created By Lizhenqi on 2017/06/07
*/

/****************数据库控制方面******************/
//获取日历数据库对象
function getCurrentDb() {
//打开数据库，或者直接连接数据库参数：数据库名称，版本，概述，大小
//如果数据库不存在那么创建之
try{
    var db = openDatabase("calendarDb", "", "日历", 1024 * 1024, function () { });
}catch(e){
    return;
}
return db;
}

function createTable() {
//设置
 var db = getCurrentDb();//初始化数据库
 if(!db) {
    alert("您的浏览器不支持HTML5本地数据库,无法使用该应用,建议使用Chrome");return;
 }
 db.transaction(function (trans) {//启动一个事务，并设置回调函数
  //执行创建表的Sql脚本
  trans.executeSql("create table if not exists planList(id int null, dayNo text null, beginTime text null, endTime text null, affair text null, bgcolor text null)", [], 
    function (trans, result) {
        console.info("创建数据表planList成功"+result);
    },
     function (trans, message) {
        console.info("创建数据表planList失败",message);
     });//创建planList表
  trans.executeSql("create table if not exists log(id int null, operation text null, Time text null)", [], 
    function (trans, result) {
        console.info("创建数据表plog成功"+result);
    },
     function (trans, message) {
        console.info("创建数据表log失败",message);
     });//创建log表

  });

}
createTable();//创建数据表


/*********************增加计划卡部分********************/

//点击添加计划按钮，显示输入框
$('#add-plan').click(function(){
    selectPlanList();//展示计划卡
    $('.add-container').attr('style', 'display:block;');//显示
    $('.details').attr('style', 'opacity: 0.3;');
    $('.main').attr('style', 'opacity: 0.3;');
});

//点击新增提交按钮，插入数据，并恢复原本样式
$("#add-main-button").click(function(){
    var dayNo = $("#add-weekdayNo").find("option:selected").text();
    var beginTime = $("#add-beginTime").find("option:selected").text();
    var endTime = $("#add-endTime").find("option:selected").text();
    var affair = $("input[name='affair']").val();
    var bgcolor = $("#add-bgcolor").find("option:selected").text();
    var id =0;

    if(beginTime>=endTime){
        window.alert("beginTime is not bigger than endTime!");
    }else{
        insertPlanList(id,dayNo,beginTime,endTime,affair,bgcolor);
        $('.add-container').attr('style', 'display:none;');//显示
        $('.details').attr('style', 'opacity: 1;');
        $('.main').attr('style', 'opacity: 1;');
    }
    
});

//点击添加取消按钮，恢复原有样式
$('#cancel-add-button').click(function(){
    selectPlanList();//展示计划卡
    $('.add-container').attr('style', 'display:none;');//显示
    $('.details').attr('style', 'opacity: 1;');
    $('.main').attr('style', 'opacity: 1;');
});

//插入数据
function insertPlanList(id,dayNo,beginTime,endTime,affair,bgcolor){
    var db = getCurrentDb();//获取数据库
     db.transaction(function (ts) {
        var size = localStorage.getItem("psize");
        if(size==null){
            localStorage.setItem("psize",1);
            id=1;
        }else{
            size = parseInt(size)+parseInt(1);
            localStorage.setItem("psize",size);
            id=size;
        }
        ts.executeSql("insert into planList(id,dayNo,beginTime,endTime,affair,bgcolor) values(?,?,?,?,?,?) ", [id,dayNo,beginTime,endTime,affair,bgcolor], function (ts, result) {
            console.dir("插入数据成功！"+result);
            selectPlanList();//展示计划
             /************记录操作************/
            insertLog("new plan card");
        }, function (ts, message) {
            console.info("插入数据失败！"+message);
        });
     });
}


/***********************展示计划卡部分 *************************/


//查找数据表planList所有数据
function selectPlanList(){
    var db = getCurrentDb();//获取数据库
    db.transaction(function (ts) {
    ts.executeSql("select * from planList ", [], function (ts, result) {
    if (result) {
        for (var i = 0; i < result.rows.length; i++) {
            console.info((result.rows.item(i)));
            var id=result.rows.item(i).id;
            var beginTime=result.rows.item(i).beginTime;
            var endTime=result.rows.item(i).endTime;
            var dayNo=result.rows.item(i).dayNo;
            var affair=result.rows.item(i).affair;
            var bgcolor=result.rows.item(i).bgcolor;
            formatDiary(id,dayNo,beginTime,endTime,affair,bgcolor);
        }
    }
    console.info("查询数据成功！");
    }, function (ts, message) {
    console.info("查询数据失败！"+message);
    });
    });
}
selectPlanList();//一开始展示所有计划卡

//根据数据，设置计划卡样式
function setPlanCard(id, h, top, left, bg, time, text){
	var diary;
    var padTop = "15px",fontS ="18px";
    if(h<75){
        padTop = "5px";
        fontS = "14px";
    }
    diary ='<div class="details" style="padding-top:' +padTop+ ';font-size:' +fontS+ '; height:'+h+'px;top:'+top+'px;left:'+left+'%;background-color:'+bg+';">';
	var span = '<span class="details-time">'+ time+ '</span>';
	var p = '<p class="details-text">' + text +'</p>';
	var editSpan= '<span title="Edit Plan" class="details-edit" mid="'+ id + '"></span>';
	var modifySpan= '<span title="Delete Plan" class="details-delete"mid="'+ id+ '"></span>';
	diary +=span;
	diary +=p;
	diary +=editSpan;
	diary +=modifySpan;
	$("#container").append(diary);
}

//转换格式
function formatDiary(id,dayNo,beginTime,endTime,affair,bgcolor){
    var h = formatHeight(beginTime, endTime);
    var top = formatHeight("09:00",beginTime);
    var time = beginTime + "-" + endTime;
    var left ;
   // window.alert("Monday0");
    if(dayNo=="Monday") left= 0;
    else if(dayNo=="Tuesday") left= 20;
    else if(dayNo=="Wednesday") left= 40;
    else if(dayNo == "Thursday") left= 60;
    else left= 80;
    setPlanCard(id, h, top, left, bgcolor, time, affair);
}

//获得高度
function formatHeight(begin ,end){
    var beginNo=0,endNo=0,h;
    //全部转化为分钟，然后相减，在乘上每分钟的间距100/60(一个小时的间距是100px)
    beginNo = begin.substr(0,1)*600 + begin.substr(1,1)*60 + begin.substr(3,2)*1;
    endNo = end.substr(0,1)*600 + end.substr(1,1)*60 + end.substr(3,2)*1;
    h=(endNo-beginNo)*100/60;
    return h;
}

//获得左边距离百分比
function formatLeft(dayNo){
    if(dayNo=="Monday") return 0;
    else if(dayNo=="Tuesday") return 20;
    else if(dayNo=="Wednesday") return 40;
    else if(dayNo == "Thursday") return 60;
    else return 80;
}



/************************删除计划卡****************************/

$(".details-delete").live('click', function() {
	var com = window.confirm("Deleting!Are you sure?");
	if(com){
		var id = $(this).attr("mid");
       /************记录操作************/
       insertLog("delete plan card");
       deletePlanList(id);
	}
});

//删除数据
function deletePlanList(id){
	var db = getCurrentDb();//获取数据库
	 db.transaction(function (ts) {
     ts.executeSql("delete from planList where id = ? ", [id], function (ts, result) {
        console.info("删除数据成功！"+result);
         window.location.reload();
     }, function (ts, message) {
         console.info("删除数据失败！"+message);
         window.alert("删除数据失败！");
     });
    });
}

/********************修改计划卡***********************/

 window.ModifyId = 1;//全局变量记录要修改记录卡的ID

$(".details-edit").live('click', function() {
	selectPlanList();
	$('.modify-container').attr('style', 'display:block;');//显示
	$('.details').attr('style', 'opacity: 0.3;');
	$('.main').attr('style', 'opacity: 0.3;');
    var mid = $(this).attr("mid");
    window.ModifyId = mid;
    selectPlanListById(mid);
});


//根据ID，查找数据表planList数据，并展示是否修改
function selectPlanListById(id){
	var db = getCurrentDb();//获取数据库
	db.transaction(function (ts) {
    ts.executeSql("select * from planList where id=?", [id], function (ts, result) {
    if (result) {
        for (var i = 0; i < result.rows.length; i++) {
            console.info((result.rows.item(i)));
            var id=result.rows.item(i).id;
            var beginTime=result.rows.item(i).beginTime;
            var endTime=result.rows.item(i).endTime;
            var dayNo=result.rows.item(i).dayNo;
            var affair=result.rows.item(i).affair;
            var bgcolor=result.rows.item(i).bgcolor;

            $("#modify-affair").val(affair);
            $("#modify-beginTime").val(beginTime);
            $("#modify-endTime").val(endTime);
            $("#modify-weekdayNo").val(dayNo);
            $("#modify-bgcolor").val(bgcolor);
        }
    }
    console.info("查询数据成功！");
    }, function (ts, message) {
    console.info("查询数据失败！"+message);
    });
   });
}


$("#modify-main-button").click(function(){
	var dayNo = $("#modify-weekdayNo").find("option:selected").text();
	var beginTime = $("#modify-beginTime").find("option:selected").text();
	var endTime = $("#modify-endTime").find("option:selected").text();
	var affair = $("#modify-affair").val();
	var bgcolor = $("#modify-bgcolor").find("option:selected").text();
	var id = window.ModifyId;
    if(beginTime>=endTime){
        window.alert("beginTime is not bigger than endTime!");
    }else{
         /************记录操作************/
      insertLog("update plan card");
      updatePlanList(dayNo,beginTime,endTime,affair,bgcolor,id);
    }
});

//点击修改取消按钮，恢复原有样式
$('#cancel-modify-button').click(function(){
    selectPlanList();//展示计划卡
    $('.modify-container').attr('style', 'display:none;');//显示  
    $('.details').attr('style', 'opacity: 1;');
    $('.main').attr('style', 'opacity: 1;');
});

//更新数据表
function updatePlanList(dayNo,beginTime,endTime,affair,bgcolor,id){
	var db = getCurrentDb();//获取数据库
	db.transaction(function (ts) {
    ts.executeSql("update planList set dayNo=?,beginTime=?,endTime=?,affair=?,bgcolor=? where id = ? ", [dayNo,beginTime,endTime,affair,bgcolor,id], function (ts, result) {
     console.info("更新数据成功！"+result);
     window.location.reload();
     }, function (ts, message) {
     console.info("更新数据失败！"+message);
   });
   });
}

/***********************日志部分****************************/

window.LookLogFalsh = 0;

//插入数据id , operation , time
function insertLog(operation){
	var id;
	var time = getNowFormatDate();
    var db = getCurrentDb();//获取数据库
     db.transaction(function (ts) {
     	var size = localStorage.getItem("lsize");
     	if(size==null){
     		localStorage.setItem("lsize",1);
     		id=1;
     	}else{
     		size = parseInt(size)+parseInt(1);
     		localStorage.setItem("lsize",size);
     		id=size;
     	}
    	ts.executeSql("insert into log(id,operation,time) values(?,?,?) ", [id,operation,time], function (ts, result) {
    		console.dir("插入日志数据成功！"+result);
    	}, function (ts, message) {
    		console.info("插入数据失败！"+message);
    	});
     });
}

//展示日志
$("#look-log").click(function(){
	var play = $("#log-main").css("display");
	if(play =="none"){
		$("#log-main").css("display","block");
        if(LookLogFalsh==0){
            selectLog();
            LookLogFalsh=1;
        }
	}else{
		$("#log-main").css("display","none");
	}
	
});

//根据数据，展示日志
function setLog(operation, time){
	var log='<div class="log-row"><span class="log-span">';
	log +=operation;
	log +='</span><span class="log-span ">';
	log +=time;
	log +='</span></div>';
	$("#log-main").append(log);

}

//获取当前的日期时间 格式“yyyy-MM-dd HH:MM:SS”
function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + date.getHours() + seperator2 + date.getMinutes()
            + seperator2 + date.getSeconds();
    return currentdate;
} 

//查找数据表log所有数据
function selectLog(){
	var db = getCurrentDb();//获取数据库
	db.transaction(function (ts) {
    ts.executeSql("select * from log ", [], function (ts, result) {
    if (result) {
        if(result.rows.length==0){
                LookLogFalsh=0;
        }
        for (var i = 0; i < result.rows.length; i++) {
            console.info((result.rows.item(i)));
            var operation=result.rows.item(i).operation;
            var time=result.rows.item(i).Time;
            setLog(operation,time);
        }
    }
    console.info("查询数据成功！");
    }, function (ts, message) {
    console.info("查询数据失败！"+message);
    });
    });
}