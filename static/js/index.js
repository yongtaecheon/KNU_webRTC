

var ws = new WebSocket('wss://' + location.host + '/call');
var video;
var webRtcPeer;
var state = null;


var videoIpCam = null;
var pipeline = null;
var webRtcIpCamPeer = null;
var ipcamAddress = 'rtsp://admin:@221.164.154.113:25555'
var kurento_uri = 'ws://221.164.154.113:8888/kurento'

const I_CAN_START = 1;

window.onload = function() {
	video = document.getElementById('video');
	videoIpCam = document.getElementById('ipCam');

	// stun, turn 서버 정의
	kurentoUtils.WebRtcPeer.prototype.server.iceServers = [
		{
			"urls":"turn:221.164.154.113",
			"username":"knuproject",
			"credential":"iWKpFjEMcLcrB2RNorXR"
		},
		{
			"urls":"stun:221.164.154.113",
			"username":"knuproject",
			"credential":"iWKpFjEMcLcrB2RNorXR"
		}
	]
}

window.onbeforeunload = function() {
	ws.close();
}

ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);
	console.info('Received message: ' + message.data);

	switch (parsedMessage.id) {
		case 'response':
			response(parsedMessage);
			break;
		case 'stopCommunication':
			dispose();
			break;
		case 'iceCandidate':
			webRtcPeer.addIceCandidate(parsedMessage.candidate)
			break;
		default:
			console.error('Unrecognized message', parsedMessage);
	}
}

function response(message) {
	if (message.response != 'accepted') {
		var errorMsg = message.message ? message.message : 'Unknow error';
		console.info('Call not accepted for the following reason: ' + errorMsg);
        dispose();
	} else {
		// webRtcPeer.processSdpAnswer(message.sdpAnswer);
		setState(I_CAN_START);
		webRtcPeer.processAnswer(message.sdpAnswer);
	}
}

function start() {
	if (!webRtcPeer) {
		showSpinner(video);

		var options = {
		localVideo: undefined,
	    	remoteVideo: video,
	    	onicecandidate : onIceCandidate
		}
		webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(error) {
				if(error) return onError(error);
				this.generateOffer(onOffer);
				});
					var message = {
						id : 'client',
						sdpOffer : onOffer
					};
			//		sendMessage(message);
	}
}

// ipcam related code start
/************************************************************************************** IPCAM Start */
function ipcam_start() {
	// if(!address.value) {
  	//   window.alert("You must set the video source URL first");
  	//   return;
  	// }

  	// address.disabled = true;
  	showSpinner(videoIpCam);
    
	var options = {
      	remoteVideo : videoIpCam
    };

    webRtcIpCamPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
        // if (error) {
    	// 	return console.error(error);
        // }

        webRtcIpCamPeer.generateOffer(onIpCamOffer);
        webRtcIpCamPeer.peerConnection.addEventListener('iceconnectionstatechange', function(event) {        
			if(webRtcIpCamPeer && webRtcIpCamPeer.peerConnection) {
				// console.log("oniceconnectionstatechange -> " + webRtcIpCamPeer.peerConnection.iceConnectionState);
				// console.log('icegatheringstate -> ' + webRtcIpCamPeer.peerConnection.iceGatheringState);
			}
        });
    });
}

function onIpCamOffer(error, sdpOffer) {
    if (error) return onError(error);

  	kurentoClient(kurento_uri, function(error, kurentoClient) {
  		if (error) return onError(error);

  		kurentoClient.create("MediaPipeline", function(error, p) {
  			if (error) return onError(error);

  			pipeline = p;

  			pipeline.create("PlayerEndpoint", {uri: ipcamAddress}, function(error, player) {
  			  	if (error) return onError(error);

  			  	pipeline.create("WebRtcEndpoint", function(error, webRtcEndpoint) {
  					if (error) return onError(error);

          			setIceCandidateCallbacks(webRtcEndpoint, webRtcIpCamPeer, onError);

  					webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
  						if (error) return onError(error);

						webRtcEndpoint.gatherCandidates(onError);
						webRtcIpCamPeer.processAnswer(sdpAnswer);
  					});

  					player.connect(webRtcEndpoint, function(error) {
  						if (error) return onError(error);

  						// console.log("PlayerEndpoint-->WebRtcEndpoint connection established");

  						player.play(function(error) {
							if (error) return onError(error);

							// console.log("Player playing ...");
  						});
  					});
  				});
  			});
  		});
  	});
}

function setIceCandidateCallbacks(webRtcEndpoint, webRtcPeer, onError) {
	webRtcPeer.on('icecandidate', function(candidate) {
	  	// console.log("Local icecandidate " + JSON.stringify(candidate));
  
	  	candidate = kurentoClient.register.complexTypes.IceCandidate(candidate);
  
	  	webRtcEndpoint.addIceCandidate(candidate, onError);
	});

	webRtcEndpoint.on('OnIceCandidate', function(event) {
	  	var candidate = event.candidate;
  
	  	// console.log("Remote icecandidate " + JSON.stringify(candidate));
  
	  	webRtcPeer.addIceCandidate(candidate, onError);
	});
}

function ipcam_stop() {
    // address.disabled = false;

    if (webRtcIpCamPeer) {
		webRtcIpCamPeer.dispose();
		webRtcIpCamPeer = null;
    }

    if (pipeline) {
      	pipeline.release();
      	pipeline = null;
    }

    hideSpinner(videoIpCam);
}
/************************************************************************************** IPCAM Stop */

function setState(nextState) {
	state = nextState;
}
function onIceCandidate(candidate) {
	   console.log('Local candidate' + JSON.stringify(candidate));
	 //  if (state == I_CAN_START){
	   var message = {
	      id : 'onIceCandidate',
	      candidate : candidate
	   };
	   sendMessage(message);
//	}
}

function onOffer(error, offerSdp) {
	if(error) return onError(error);

	console.info('Invoking SDP offer callback function ' + location.host);
	var message = {
		id : 'client',
		sdpOffer : offerSdp
	}
	sendMessage(message);
}
function onError(error) {
	console.log(error);
}
function stop() {
	var message = {
		id : 'stop'
	}
	sendMessage(message);
    dispose();
}

function dispose() {
	if (webRtcPeer) {
        webRtcPeer.dispose();
        webRtcPeer = null;
	}
	hideSpinner(video);
}

function sendMessage(message) {
	var jsonMessage = JSON.stringify(message);
	console.log('Senging message: ' + jsonMessage);
	ws.send(jsonMessage);
}

function showSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].poster = './img/transparent.png';
		arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
	}
}

function hideSpinner(videoStream) {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].src = '';
		if (videoStream == video) {
			arguments[i].poster = './img/Camera_default.png';
		}
		else if (videoStream == videoIpCam) {
			arguments[i].poster = './img/CCTV_default.png';
		}
		arguments[i].style.background = '';
	}
}
