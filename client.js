var client = new Paho.MQTT.Client("mqtt-ws.sdi.hevs.ch", 443, "/ws", "sdi04" + Math.floor(Math.random() * 100));
var btn1;
var btn2;

client.onConnectionLost = function(responseObject)
{
  if (responseObject.errorCode !== 0)
  {
    console.error("Connection:" + responseObject.errorMessage);
  }
  else
  {
    console.log("Connection closed.");
  }
}

client.onMessageArrived = function(message)
{
  //var logTA = document.getElementById('log');
  var splittedName = message.destinationName.split('/');

  switch(splittedName[1])
  {
    case 'status':
      var obj = JSON.parse(message.payloadString);
      //logTA.textContent += 'New status:' + '\n' + obj.connected=='true'?'Connected':'Disconnected' + '\n' + 'Thingies connected: ' + obj.thingies.length + '\n';
      break;
    case 'C4:64:02:60:D9:16':
      //console.log('Button of Thingy 1: ' + ((message.payloadString=="true")?'pressed':'released') + '\n');
      if(btn1) {
        btn1 = false;
        //console.log("BTN1 released");
      }
      else {
        btn1 = true;
        //console.log("BTN1 pressed");
      }
      break;
    case 'C6:95:1B:A6:49:E6':
      if(btn2) {
        btn2 = false;
        //console.log("BTN2 released");
      }
      else {
        btn2 = true;
        //console.log("BTN2 pressed");
      }
      break;
    default:
      console.log("Got message: topic=" + message.destinationName + ', payload=' + message.payloadString);
      break;
  }
}

client.connect({
  userName: 'sdi04',
  password: 'e15ab829f40849a393136e53ea97a9f9',
  keepAliveInterval: 30,
  cleanSession: true,
  useSSL: true,
  onSuccess: function() {
    console.log("Client Connected.");
    client.subscribe("sdi04/status");
    client.subscribe("sdi04/+/button");
    client.send('sdi04/C4:64:02:60:D9:16/led', JSON.stringify({
      red: 100,
      green: 0,
      blue: 150
    }));
    client.send('sdi04/C6:95:1B:A6:49:E6/led', JSON.stringify({
      red: 0,
      green: 100,
      blue: 0
    }));
  },
  onFailure: function()
  {
    console.error("Failed to connect !");
  }
});

function setLED(t){
  var red = document.getElementById('red').value;
  var green = document.getElementById('green').value;
  var blue = document.getElementById('blue').value;
  if(t==1)
  {
    client.send('sdi04/C4:64:02:60:D9:16/led', '{"red": ' + red + ',"green": ' + green + ',"blue": ' + blue + '}');
  }
  else if(t==2)
  {
    client.send('sdi04/C6:95:1B:A6:49:E6/led', '{"red": ' + red + ',"green": ' + green + ',"blue": ' + blue + '}');
  }
}

function loadGame(){
    //
}
