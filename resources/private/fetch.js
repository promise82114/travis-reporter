var parser = require('./parser.js');
var Travis = require('travis-ci');
var update = require('./updateBase.js');
var travis = new Travis({
  version: '2.0.0'
});
var owner = 'mozilla-b2g',
  reponame = 'gaia';
module.exports ={
    doThing : function(time,callback){
    var newTime=time;
      doRepo(time,function(timeEnd){
        newTime=timeEnd;
        callback(newTime);
      });
    }
};

function doRepo(time,callback){
  var timeTemp=time;
  travis.repos.builds({
  owner_name: owner,
  name: reponame
  }, function (err, res) {
    if(res.builds!=null){
      var BUILD_IDS = res.builds;
      for(i in BUILD_IDS){
        var finishTime = BUILD_IDS[i].finished_at;
        if(finishTime > time || (time==null&&finishTime!=null)){
          if(finishTime>timeTemp||timeTemp==null){
            timeTemp = finishTime;
          }
          doBuild(BUILD_IDS[i].id);
        }
      }
    callback(timeTemp);
    }
  });
}

function doBuild(BUILD_ID){
  travis.builds({
    id: BUILD_ID
  }, function(err, res){
    if(res.build!=null){
      for(var i in res.build.job_ids){
        var JOB_ID = res.build.job_ids[i];
        var time = res.build.finished_at.slice(0,10);
          doJob(JOB_ID,time,BUILD_ID);  
      }
    }
  });
}

function doJob(JOB_ID,time,build){
  travis.jobs({
    id: JOB_ID
  }, function(err, res){
    if(res.job!=null){
      var LOG_ID = res.job.log_id;
      var action = res.job.config.env;
      if(action=="CI_ACTION=marionette_js"){
        doLog(LOG_ID,time,build,JOB_ID);
      }
    }
  });
}

function doLog(LOG_ID,time,build,job){
  travis.logs({
    id :LOG_ID
  }, function(err,res){
    var result = parser.findErrFile(res.log.body);
    if(result!=null){
      doJson(result,time,build,job);
    }
  });
}


function doJson(errfile,time,build,job){
  var length = errfile.length;
  for(i=0;i<length;i++){
    var errPath = errfile[i];
    var result = {
      "buildID" : build,
      "jobID" : job,
      "filePath" : errPath,
      "date" : time
    }
    outJson(result);
  }
}

//send out the result json to the database
function outJson(result){
  update.insertData(result);
}