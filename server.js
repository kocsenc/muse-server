var osc = require('node-osc');
var CBuffer = require('CBuffer');
var http = require('http');

var oscServer = new osc.Server(3000, '127.0.0.0');

var exec = require('child_process').exec;

var alreadyBlink = false;
var alreadyClench = false;
var jawClenched = false;

var accelerometerBuffer = new CBuffer(500);
var eeg2 = new CBuffer(400);
var eeg3 = new CBuffer(400);
var eegSemaphore = false;


var acc = {
	xaxis: {
		semaphore: false,
		average: 0
	}
}


oscServer.on("message", function (msg, connection_info) {
	var cmd = msg[0];
  if(cmd === '/muse/elements/jaw_clench' && !alreadyClench && !alreadyClench) {
		if (msg[1] === 1){
			jawClenched = true;
			alreadyClench = true;

			exec('say nope.', function (error, stdout, stderr) {
			// exec('say My name is Steven Hawking. I cheated on my wife twice, but I am pretty smart', function (error, stdout, stderr) {

				alreadyClench= false;
			});
			console.log("Bro, you clenching ur jaw");
		} else {
			jawClenched = false;
		}
  }

  if(cmd === '/muse/elements/blink' && !alreadyClench && !alreadyBlink) {
		if (msg[1] === 1){
			alreadyBlink = true;
			exec('say yes', function (error, stdout, stderr) {
				alreadyBlink = false;
			});

			console.log("BRUH you be BLINK!")
		}
  }


  if (cmd === '/muse/acc'){
  	checkNod(msg[1]);
		accelerometerBuffer.push(msg[1]);
		//console.log(accelerometerBuffer);
		if (!acc.xaxis.semaphore) {
			setAverage();
		}

  }

  if (cmd === '/muse/eeg'){
  	eeg2.push(msg[2]);
  	eeg3.push(msg[3]);
  	if(!eegSemaphore){
	  	onLeftifLeft(function(){
	  		console.log('u looked left');
	  		
				// http.get("http://toggl-tessel.student.rit.edu", function(res) {
				// 	console.log("Got response: " + res.statusCode);
				// }).on('error', function(e) {
				// 	console.log("Got error: " + e.message);
				// });

	  	});
  	}
  }


});




var nod ={
	downNod: false,
	upNod: false
};

var shake = {
	left: false,
	right: false
};

var checkNod = function(value){
	if (nod.downNod && nod.upNod ){
		nod.downNod = false;
		nod.upNod = false;
		console.log('YOU NODDED YES BRUH');
	} else if (shake.left && shake.right ){
		shake.left = false;
		shake.right = false;
		console.log('YOU NODDED NO BRUH');
	}



	// NODDING LEFT?
	if (value > acc.xaxis.average + 350){
		if(jawClenched){
			console.log("left face");
			shake.right = true;
		} else{
			console.log("down nod");
			nod.downNod = true;	
		}
		
	}

	if(value < acc.xaxis.average - 350){
		if (jawClenched){
			console.log("right face");
			shake.right = true;
		} else {
			console.log("up nod");
			exec('say sup!', function (error, stdout, stderr) {
				alreadyBlink = false;
			});	
			nod.upNod = true;	
		}
		
	}
}

/*
 *  Semaphored with eegSemaphore
 *  Call if you want the 'callback' function called
 *  if the user looked left 
 */
var onLeftifLeft = function ( callback ){
	eegSemaphore = true;
	var temptop = eeg2.last();
	var tempbot = eeg3.last();

	var clicks = 0;
	for( var i = 0 ; i < eeg2.length; i++){
		var top = eeg2.data[i];
		var bot = eeg3.data[i];
		//console.log(clicks);

		if (clicks>=10){
			clicks = 0 ;
			callback();
			break;
		}

		if (top > temptop && bot < tempbot){
			clicks++;
			temptop = top;
			tempbot = bot; 
		} 

	}
	
	setTimeout(function(){ eegSemaphore = false; }, 1000);

}


var setAverage = function(){
	acc.xaxis.semaphore = true;
	var sum = 0;
	for( var i = 0; i < accelerometerBuffer.length; i++ ){
		var data = accelerometerBuffer.data[i];
		if (!isNaN(data)){
			sum += accelerometerBuffer.data[i];
		} 
	}

	setTimeout(function(){ acc.xaxis.semaphore = false; }, 1000);
	var average = sum/500;
	acc.xaxis.average = average;

	//console.log("\t\t\t" + average);

	return average;
}

