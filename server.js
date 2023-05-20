var kurento = require('kurento-client');
var express = require('express');
var app = express();
var path = require('path');
var ws = require('ws');
var https =require('https');
var fs = require('fs');
var fileUpload = require("express-fileupload");////////////
var url = require('url');
//app.set('port', process.env.PORT || 8080);

var argv = require('minimist')(process.argv.slice(2), {
    default: {
        as_uri: "https://localhost:8443/",
       // ws_uri: "ws://221.164.154.113:8888/kurento"
	   ws_uri: "ws://221.164.154.113:8888/kurento"
	     // ws_uri: "ws://1"
       // ws_uri: "ws://localhost:8888/kurento"
    }
  });

  var options =
  {
    key:  fs.readFileSync('keys/server.key'),
    cert: fs.readFileSync('keys/server.crt')
  };
/*
 * Definition of global variables.
 */	

//////////////////////////////////////////////////html
var composite = null;
var mediaPipeline = null;

var idCounter = 0;
var clients = {};
var candidatesQueue = {};
var kurentoClient = null;

function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}
/*
 * Server startup
 */
var asUrl = url.parse(argv.as_uri);
var port = asUrl.port

var server = https.createServer(options, app).listen(port, function() {
    console.log('Kurento Tutorial started');
    console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
});



var wss = new ws.Server(
    {
        server : server,
        path : '/call'
    }
);

/*
 * Management of WebSocket messages
 */
wss.on('connection', function(ws)
{
    var sessionId = nextUniqueId();

    console.log('Connection received with sessionId ' + sessionId);

    ws.on('error', function(error)
    {
        console.log('Connection ' + sessionId + ' error');
        stop(sessionId);
    });

    ws.on('close', function()
    {
        console.log('Connection ' + sessionId + ' closed');
        stop(sessionId);
    });

    ws.on('message', function(_message)
    {
        var message = JSON.parse(_message);
	console.log('message id',message.id);
        console.log('Connection ' + sessionId + ' received message ', message.id);

        switch (message.id)
        {
            case 'client':
                addClient(ws,sessionId, message.sdpOffer, function(error, sdpAnswer) {
                    if (error) {
                        return ws.send(JSON.stringify({
                            id : 'response',
                            response : 'rejected',
                            message : error
                        }));
                    }
                    ws.send(JSON.stringify({
                        id : 'response',
                        response : 'accepted',
                        sdpAnswer : sdpAnswer
                    }));
                });
                break;

            case 'stop':
                stop(sessionId);
                break;

        case 'onIceCandidate':
            onIceCandidate(sessionId, message.candidate);
            break;
      
	      default:
                ws.send(JSON.stringify({
                    id : 'error',
                    message : 'Invalid message ' + message
                }));
                break;
        }
    });
});

/*
 * Definition of functions
 */

// Retrieve or create kurentoClient
function getKurentoClient(callback) {
    console.log("getKurentoClient");
    
    if (kurentoClient !== null) {
        console.log("KurentoClient already created");
        return callback(null, kurentoClient);
    }

    kurento(argv.ws_uri, function( error, _kurentoClient ) {
        console.log("creating kurento");
        if (error) {
            console.log("Coult not find media server at address " + ws_uri);
            return callback("Could not find media server at address" + ws_uri
                + ". Exiting with error " + error);
        }
        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
    });
}

// Retrieve or create mediaPipeline
function getMediaPipeline( callback ) {
    
    if ( mediaPipeline !== null ) {
        console.log("MediaPipeline already created");
        return callback( null, mediaPipeline );
    }

    getKurentoClient(function(error, _kurentoClient) {
        if (error) {
            return callback(error);
        }
        _kurentoClient.create( 'MediaPipeline', function( error, _pipeline ) {
            console.log("creating MediaPipeline");
            if (error) {
                return callback(error);
            }
            mediaPipeline = _pipeline;
            callback(null, mediaPipeline);
        });
    });
}

// Retrieve or create composite hub
function getComposite( callback ) {
    if ( composite !== null ) {
        console.log("Composer already created");
        return callback( null, composite, mediaPipeline );
    }
    getMediaPipeline( function( error, _pipeline) {
        if (error) {
            return callback(error);
        }
        _pipeline.create( 'Composite',  function( error, _composite ) {
            console.log("creating Composite");
            if (error) {
                return callback(error);
            }
            composite = _composite;
            callback( null, composite );
        });
    });
}

// Create a hub port
function createHubPort(callback) {
    getComposite(function(error, _composite) {
        if (error) {
            return callback(error);
        }
        _composite.createHubPort( function(error, _hubPort) {
            console.info("Creating hubPort");
            if (error) {
                return callback(error);
            }
            callback( null, _hubPort );
        });
    });
}

// Create a webRTC end point
function createWebRtcEndPoint (callback) {
    getMediaPipeline( function( error, _pipeline) {
        if (error) {
            return callback(error);
        }
        _pipeline.create('WebRtcEndpoint',  function( error, _webRtcEndpoint ) {
            console.info("Creating createWebRtcEndpoint");
            if (error) {
                return callback(error);
            }
            callback( null, _webRtcEndpoint );
        });
    });
}

// Add a webRTC client
function addClient( ws, id, sdp, callback ) {
    createWebRtcEndPoint(function (error, _webRtcEndpoint) {
        if (error) {
            console.log("Error creating WebRtcEndPoint " + error);
            return callback(error);
        }

        if (candidatesQueue[id]) {
            while(candidatesQueue[id].length) {
                var candidate = candidatesQueue[id].shift();
                _webRtcEndpoint.addIceCandidate(candidate);
            }
           
            clients[id] = {
                id: id,
                webRtcEndpoint : null,
                hubPort : null
            }           
        }

        if(!clients.hasOwnProperty(id)) {
            //console.log("client is null");
            return;
        }

        clients[id].webRtcEndpoint = _webRtcEndpoint;
        clients[id].webRtcEndpoint.on('OnIceCandidate', function(event) {
            var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
            ws.send(JSON.stringify({
                id : 'iceCandidate',
                candidate : candidate
            }));
        });

	    console.log("sdp is ",sdp);
        clients[id].webRtcEndpoint.processOffer(sdp, function(error, sdpAnswer) {
            if (error) {
                stop(id);
                console.log("Error processing offer " + error);
                return callback(error);
            }
            callback( null, sdpAnswer);
        });

        clients[id].webRtcEndpoint.gatherCandidates(function(error) {
            if (error) {
                return callback(error);
            }
		});

        createHubPort(function (error, _hubPort) {
            if (error) {
                stop(id);
                console.log("Error creating HubPort " + error);
                return callback(error);
            }

            clients[id].hubPort = _hubPort;
            clients[id].webRtcEndpoint.connect(clients[id].hubPort);
            clients[id].hubPort.connect(clients[id].webRtcEndpoint);
        });
    });
}

// Stop and remove a webRTC client
function stop(id) {
    if (clients[id]) {
        if (clients[id].webRtcEndpoint) {
            clients[id].webRtcEndpoint.release();
        }
        if (clients[id].hubPort) {
            clients[id].hubPort.release();
        }
        delete clients[id];
    }
    if (Object.getOwnPropertyNames(clients).length == 0) {
        if (composite) {
            composite.release();
            composite = null;
        }
        if (mediaPipeline) {
            mediaPipeline.release();
            mediaPipeline = null;
        }
    }
   delete candidatesQueue[id];
}

function onIceCandidate(sessionId, _candidate) {
    var candidate = kurento.register.complexTypes.IceCandidate(_candidate);

    if (clients[sessionId]) {
        console.info('Sending candidate');
        var webRtcEndpoint = clients[sessionId].webRtcEndpoint;
        webRtcEndpoint.addIceCandidate(candidate);
    }
    else {
        console.info('Queueing candidate');
        if (!candidatesQueue[sessionId]) {
            candidatesQueue[sessionId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
}
app.use(express.static(path.join(__dirname, 'static')));

/////////////////////////////////////////////////////////////
app.use(fileUpload());

// (B) EXPRESS HTTP
// (B1) UPLOAD PAGE
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/static/index.html"));
});

// (B3) MANAGE UPLOAD
app.post("/upload", (req, res) => {
  // (B3-1) UPLOADED FILE & DESTINATION
  let upfile = req.files.upfile,
      updest = __dirname+'/download/'+upfile.name;

  // (B3-2) MOVE UPLOADpED FILE
  upfile.mv(updest, (err) => {
    if (err) { return res.status(500).send(err); }
    res.send(`<p align="center">File Uploaded!<p>`);
  });
});

app.get("/downloadsomething",function(req,res){
    
    var files = req.query.files
    console.log(files);
    res.download(files);
});

app.get("/download", function (req, res) {
    fs.readdir(__dirname + "/download", function (err, filelist) {
        if (err) {
            throw err;
        }
        res.setHeader('Content-type', 'text/html');
        var i = 0;
        //var list='<ul style = "list-style:none;">';
        var list = "";
         
        while (i < filelist.length) {
            //  list = list +'\n' + filelist[i];
            list = list + `<option value = "${__dirname}/download/${filelist[i]}" align="center">${filelist[i]} </option>`;
            //list = list + `<li><a href="${__dirname}/download/${filelist[i]}" download>${filelist[i]}</a><li>`;
            i += 1;
        }
        //	list = list + '</ul>';
        var htmla=`<!doctype html> 
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.1/dist/css/bootstrap.min.css" rel="stylesheet"
                            integrity="sha384-iYQeCzEYFbKjA/T2uDLTpkwGzCiq6soy8tYaI1GyVh/UjpbCx/TYkiZhlZB6+fzT" crossorigin="anonymous">
                        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js"
                            integrity="sha384-OERcA2EqjJCMA+/3y+gxIOqMEjwtxJY7qPCqsdltbNJuaOe923+mo//f6V8Qbsw3"
                            crossorigin="anonymous"></script>
                    </head>
                    <body>
                        <form action= "https://localhost:8443/downloadsomething" method = "get" id = "myForm" target=param>
                            <p class="text text-dark" align="center">Choose File to Download<p>
                            <div class="row">
                                <select id="file" name="files" size="${i}" align="center" required>
                                        ${list}
                                </select>
                            </div>
                            <div class="row" style="padding:30px">
                                <button class="btn btn-success" type = "submit" align="center">Download this file</button>
                            </div>
                        </form>
                    </body>
                </html>`
        res.send(htmla);
    });
});

// (C) GO!
app.listen(8081);
