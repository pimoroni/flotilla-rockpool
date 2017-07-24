rockpool.mock = function(){
    //return;
	if(!window.location.href.startsWith("file:///")) return;

    $(window).on('beforeunload',function(){
        rockpool.saveCurrentState('_autosave');
    });
    setTimeout(function(){
        rockpool.setupMock();
        rockpool.fakeAdd(0, 'rainbow');
        rockpool.fakeAdd(1, 'colour');
        rockpool.fakeAdd(2, 'slider');
        rockpool.fakeAdd(3, 'motor');
        rockpool.fakeAdd(4, 'joystick');
        rockpool.fakeAdd(5, 'number');
        rockpool.fakeAdd(6, 'touch');
        rockpool.fakeAdd(7, 'weather');
        rockpool.loadState('_autosave');
    },200);
}

rockpool.setupMock = function(){
    rockpool.closePrompt();

    rockpool.socket = {}

    rockpool.subscribed_to = 0;

    rockpool.dock_version = 'v0.99';
    rockpool.dock_user = 'Fred';
    rockpool.dock_name = 'Fred'
    rockpool.dock_serial = 'fake';

    rockpool.socket.send = function(data){

    }

    rockpool.socket.close = function(){

    }

    rockpool.run();

    var touch = setInterval(function(){

        rockpool.fakeUpdate(6, 'touch', [Math.round(Math.random(0,1)),Math.round(Math.random(0,1)),Math.round(Math.random(0,1)),Math.round(Math.random(0,1))]);

    },1000);

    var weather = setInterval(function(){

        rockpool.fakeTemperature(7, Math.sin(rockpool.getTime()/7000) * 40);

    },100);
}

rockpool.fakeTemperature = function(channel, temperature){
    rockpool.fakeUpdate(channel, 'weather', [temperature * 100, 10000]);
}

rockpool.fakeAdd = function(channel, module){
    rockpool.fakeCommand('c ' + channel.toString() + '/' + module);
}

rockpool.fakeUpdate = function(channel, module, args){
    rockpool.fakeCommand('u ' + channel.toString() + '/' + module + ' ' + args.join(','));
}

rockpool.fakeCommand = function(command){
    rockpool.parseCommand('dock:0 data:' + command); 
}