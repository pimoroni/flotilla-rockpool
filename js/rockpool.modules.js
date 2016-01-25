var rockpool = rockpool || {};
rockpool.module_handlers = rockpool.module_handlers || {};

/*
#Flotilla Module Definitions

These are settings definitions which define the behaviour of
each Flotilla module. They include several key parameters
which define inputs, outputs, name and address.

Where applicable a definition should also include a 'send'
or 'receve' function which governs how data should be sent
to or receievd from the host transport.

'<handle>': {
    'title': '<Human-readable title>',
    'address': <i2c-address>,
    'color': <physical-module-color>,
    'receive': function(data){ return { <new key value data> } },
    'send':    function(data){ return [ <array of messages to send> ] },
    'inputs'  ...
    'outputs' ... 
}

Flotilla Module inputs and outputs

*/

rockpool.module_handlers['touch'] = {
    'title': 'Touch',
    'address': 0x2c,
    'color': 'red',
    'receive': function(data){
        var result = {}
        for( var x = 0; x < 4; x++ ){
            result[x+1] = data[x] >= 1 ? 1.0 : 0.0;
        }
        return result;
    },
    'inputs': {
        'button': function(){

            this.name = "Touch"
            this.icon = "button"
            this.data = {1:0.0,2:0.0,3:0.0,4:0.0}
            this.options = [
                {name: 'One',   channel: 1},
                {name: 'Two',   channel: 2},
                {name: 'Three', channel: 3},
                {name: 'Four',  channel: 4}
            ]

            this.get = function(options) {

                if(!options) return 0;

                return this.data[options.channel]

            }

        }
    }
}

rockpool.module_handlers['rainbow'] = {
    'title': 'Rainbow',
    'address': 0x54,
    'color': 'yellow',
    'send': function(data){
        var brightness = Math.round(255*data.brightness);
        var grb = [Math.floor(data.r*brightness),Math.floor(data.g*brightness),Math.floor(data.b*brightness)];
        return [grb];
    },
    'outputs': {
        'LED': function() {
            this.name = "LED"
            this.data = {r:{}, g:{}, b:{}, brightness:null}
            this.defaults = {brightness:1}
            this.bgColor = rockpool.palette.green;

            this.options = [
                {name: "Rainbow Red",       channel: 'r'},
                {name: "Rainbow Green",     channel: 'g'},
                {name: "Rainbow Blue",      channel: 'b'},
                {name: "Brightness",        channel: 'brightness'},
                {name: "Rainbow Hue",       channel: 'hue'}
            ]

            this.set = function(value, id, options){
                if(!options) return;

                if( options.channel == 'hue' ){

                    var h = value;
                    var s = 1.0;
                    var v = 1.0;
                    var r, g, b, i, f, p, q, t;
                    i = Math.floor(h * 6);
                    f = h * 6 - i;
                    p = v * (1 - s);
                    q = v * (1 - f * s);
                    t = v * (1 - (1 - f) * s);
                    switch (i % 6) {
                        case 0: r = v, g = t, b = p; break;
                        case 1: r = q, g = v, b = p; break;
                        case 2: r = p, g = v, b = t; break;
                        case 3: r = p, g = q, b = v; break;
                        case 4: r = t, g = p, b = v; break;
                        case 5: r = v, g = p, b = q; break;
                    }

                    this.data.r[id] = r;
                    this.data.g[id] = g;
                    this.data.b[id] = b;

                    return;
                }

                if(!this.data[options.channel]) this.data[options.channel] = {}

                this.data[options.channel][id] = value

            }

            this.stop = function(id) {
                for( var key in this.data ){
                    if(this.data[key] != null){
                        this.data[key][id] = null
                    }
                }
            }

        }
    }
}

rockpool.module_handlers['motion'] = {
    'title': 'Motion',
    'address': 0x1d,
    'color': 'red',
    'receive': function(data){

        var i;
        var _X = 0;
        var _Y = 1;
        var _Z = 2;

        //console.log(data);
        var x = (parseInt(data[0]) + 33767) / 65535;
        var y = (parseInt(data[1]) + 33767) / 65535;
        var z = (parseInt(data[2]) + 33767) / 65535;
        var m_x = (parseInt(data[3]) + 33767) / 65535;
        var m_y = (parseInt(data[4]) + 33767) / 65535;
        var m_z = (parseInt(data[5]) + 33767) / 65535;

        var accel = [0,0,0];
        for(i = 0; i < 3; i++){
            accel[i] = parseInt(data[i]) / Math.pow(2, 15) * 2;
            accel[i] = Math.min(Math.abs(accel[i]), 1.0) * Math.sign(accel[i]);
        }

        var mag = [0,0,0];
        for(i = 0; i < 3; i++){
            mag[i] = parseInt(data[3+i]);
        }


        var pitch = Math.asin(-1*accel[_X]);
        var roll = Math.abs(Math.cos(pitch)) >= Math.abs(accel[_Y]) ? Math.asin(accel[_Y]/Math.cos(pitch)) : 0;

        var tiltcomp = [0,0,0];

        tiltcomp[_X] = mag[_X] * Math.cos(pitch) + mag[_Z] * Math.sin(pitch);

        tiltcomp[_Y] = mag[_X] * Math.sin(roll) * Math.sin(pitch) + 
                       mag[_Y] * Math.cos(roll) - mag[_Z] * Math.sin(roll) * Math.cos(pitch);

        tiltcomp[_Z] = mag[_X] * Math.cos(roll) * Math.sin(pitch) +
                       mag[_Y] * Math.sin(roll) + 
                       mag[_Z] * Math.cos(roll) * Math.cos(pitch);

        var heading = Math.atan2(tiltcomp[_Y], tiltcomp[_X]);

        if( heading < 0 ){
            heading += 2*Math.PI;
        }
        if( heading > 2*Math.PI ){
            self.heading -= 2*Math.PI;
        }

        heading = heading * (180/Math.PI);

        var deviation = heading;

        if( heading >= 180 ){
            deviation = heading - 360;
        }

        deviation += 180.0;
        deviation /= 360.0;

        return {
            'x': x, 'y': y, 'z': z,
            'm_x': m_x, 'm_y': m_y, 'm_z': m_z,
            'd': deviation
        };
    },
    'inputs': {
        'axis': function(){

            this.name = "Axis"
            this.icon = "joystick"
            this.data = {x:0,y:0,z:0,m_x:0,m_y:0,m_z:0,d:0}
            this.options = [
                {name: 'Accel X', axis: 'x'},
                {name: 'Accel Y', axis: 'y'},
                {name: 'Accel Z', axis: 'z'},
                {name: 'Mag X', axis: 'm_x'},
                {name: 'Mag Y', axis: 'm_y'},
                {name: 'Mag Z', axis: 'm_z'},
                {name: 'From N', axis: 'd'}
            ]

            this.get = function(options) {

                if(!options) return 0;

                return this.data[options.axis]

            }

        }
    }
}

rockpool.module_handlers['colour'] = {
    'title': 'Colour',
    'address': 0x39,
    'color': 'purple',
    'receive': function(data) {
        var r = parseInt(data[0])/255.0;
        var g = parseInt(data[1])/255.0;
        var b = parseInt(data[2])/255.0;
        var c = parseInt(data[3])/255.0;
        return {'r': r, 'g': g, 'b': b, 'brightness': c};
    },
    'inputs': {
        'colour': function() {
            this.name = "Colour"
            this.bgColor = rockpool.palette.blue
            this.data = {r:0,g:0,b:0,brightness:0}
            this.options = [
                {name:'Red', channel:'r'},
                {name:'Green', channel:'g'},
                {name:'Blue', channel:'b'},
                {name:'Brightness', channel:'brightness'}
            ]
            this.get = function(options){

                if(!options) return 0;

                return this.data[options.channel]

            }
        }
    }
}

rockpool.module_handlers['weather'] = {
    'title': 'Weather',
    'address': 0x00,
    'color': 'blue',
    'receive': function(data){
        return {'temperature': parseInt(data[0]), 'pressure': parseInt(data[1])}
    },
    'inputs': {
        'temperature': function(){
            this.name = "Temperature"
            this.data = {temperature:0}
            this.options = [
                {name: "+- 50c",  highest: 50,  lowest: -50},
                {name: "+- 100c", highest: 100, lowest: -100}
            ]
            this.raw = function(){
                return (this.data.temperature / 100.00) + 'c';
            }
            this.get = function(options){

                var highest = options ? options.highest : 50.00;
                var lowest = options ? options.lowest : -50.00;
                var temp = this.data.temperature / 100.00;

                if(temp > temp) {temp = highest}

                var output_temp = (temp - lowest) / (highest-lowest);

                return output_temp;
            }
        },
        'pressure': function(){
            this.name = "Pressure"
            this.data = {pressure:0}
            this.get = function(){
                var highest = 108.00;
                var lowest = 90.00;
                var pressure = this.data.pressure / 1000.00;

                if(pressure > highest) {pressure = highest}

                var output_pressure = (pressure - lowest) / (highest-lowest);

                return output_pressure;
            }
        }
    }
}

rockpool.module_handlers['light'] = {
	'title': 'Light',
    'address': 0x29,
    'color': 'green',
    'receive': function(data) {
        var vis = parseInt(data[0]);
        return {'vis': vis};
    },
    'inputs': {
        'visible': function() {
            this.name = "Light Visible"
            this.data = {vis:0}
            this.get = function () { return (this.data.vis/3000) > 1 ? 1 : (this.data.vis/3000) }
        }
    }
}

rockpool.module_handlers['matrix'] = {
	'title': 'Matrix',
    'average': false,
    'address': 0x63,
    'color': 'blue',
    'send': function(data){
        return [
            [
                data.image[0],
                data.image[1],
                data.image[2],
                data.image[3],
                data.image[4],
                data.image[5],
                data.image[6],
                data.image[7],
                data.brightness
            ]
        ];
    },
    'outputs': {
        'display': function() {
            this.name = 'Matrix'

            this.data = {
                image:[0, 0, 0, 0, 0, 0, 0, 0],
                brightness: 30
            }

            this.history = [0,0,0,0,0,0,0,0];
            this.x = 4;
            this.y = 4;

            this.max_brightness = 30;

            this.options = [
                {name:'Line Graph',  fn: function(value,t){
                    t.history.push(1 << Math.round( value * 7 ));
                    t.history = t.history.slice(Math.max(t.history.length - 10, 0))

                    t.data.image = t.history;
                }},
                {name:'Plot X',  fn: function(value,t){
                    t.x = Math.round( value * 7 );
                    var p = [0,0,0,0,0,0,0,0];

                    p[t.x] = t.y;

                    t.data.image = p;
                }},
                {name:'Plot Y',  fn: function(value,t){
                    t.y = 1 << Math.round( value * 7 );
                    var p = [0,0,0,0,0,0,0,0];

                    p[t.x] = t.y;

                    t.data.image = p;
                }},
                {name:'Number', fn: function(value,t){ t.data.image = matrix_font[Math.ceil(value * 9).toString().charCodeAt(0)]; } },
                {name:'Letter', fn: function(value,t){ t.data.image = matrix_font[ 97 + Math.ceil(value * 25) ]; } },
                {name:'Brightness', fn: function(value,t){ t.data.brightness = Math.round(value*t.max_brightness); }}
            ]

            this.set = function (value, id, options){
                if(!options) return false;

                options.fn(value,this);
            }

        }
    }
}

var number_digit_map = [
 252,//0b11111100,
 96, //0b01100000,
 218,//0b11011010,
 242,//0b11110010,
 102,//0b01100110,
 182,//0b10110110,
 190,//0b10111110,
 224,//0b11100000,
 254,//0b11111110,
 230 //0b11100110
]

rockpool.module_handlers['number'] = {
	'title': 'Number',
    'address': 0x63,
    'color': 'red',
    'send': function(data){
        // Input should look like "XXXX" or "X.XXX" or "XX.XX" or "XX:XX" or "XX:X'"
        console.log(data);
        var display = [0,0,0,0,0,0,0]; // 7 bytes, char 1-4, colon, apostrophe and brightness

        for(var x = 0; x<data.number.toString().length; x++){

            var ord = data.number.toString().charCodeAt(x) - 48;

            if( ord >= 0 && ord < 48+number_digit_map.length){
                display[x] = number_digit_map[ord];
            }

        }

        display[4] = data.colon; // Colon
        display[5] = data.apostrophe; // Apostrophe

        display[6] = data.brightness; // Brightness

        return [ display ];
    },
	'outputs': {
		'number': function() {
			this.name = "Number"
			this.data = {number:"0000", brightness:50, colon: 0, apostrophe: 0}
			this.pad = function (str, max) {
				return str.length < max ? this.pad("0" + str, max) : str;
		      }
			this.set = function (value) { this.data.number = this.pad( Math.ceil(value * 1000).toString(), 4 ); }
		}
	}
}

rockpool.module_handlers['dial'] = {
	'title': 'Dial',
    'address': 0x15,
    'color': 'yellow',
    'icon': 'dial',
    'receive': function(data) {
        var val = parseInt(data[0]);
        if( val >= 1021 ){ val = 1024; }

        return { 'position': Math.min(val/1024.0,1.0) };
    },
	'inputs': {
		'position': function () {
			this.name = "Dial"
			this.data = {position:0}
            this.options = [
                {name: "Position"}
            ]
			this.get = function (options) { return this.data.position }
		}
	}
}

rockpool.module_handlers['slider'] = {
	'title': 'Slider',
    'address': 0x16,
    'color': 'yellow',
    'icon': 'slider',
    'receive': function(data) {
        var val = parseInt(data[0]);
        if( val >= 1021 ){ val = 1024; }

        return { 'position': Math.min(val/1024.0,1.0) };
    },
	'inputs': {
		'position': function () {
			this.name = "Slider"
			this.data = {position:0}
            this.options = [
                {name: "Position"}
            ]
			this.get = function (options) { return this.data.position }
		}
	}
}

rockpool.module_handlers['motor'] = {
	'title': 'Motor',
    'address': 0x64,
    'color': 'purple',
    'send': function(data){
        return [
            [Math.round(data.speed).toString()]
        ];
    },
	'outputs': {
        'speed': function () {
            this.name = "Speed"
            this.data = {speed:{}}

            this.options = [
                {name: "Speed",     fn: function(value){return (value*126)-63;}},
                {name: "Forwards",  fn: function(value){return value == 0 ? null : (value*63);}},
                {name: "Backwards", fn: function(value){return value == 0 ? null : -(value*63);}}
            ]

            this.set = function( value, id, options ){
                var fn = options ? options.fn : this.options[0].fn;

                this.data.speed[id] = fn(value);
            }

            this.stop = function(id) { this.data.speed[id] = null }
        }
	}
	}

rockpool.module_handlers['joystick'] = {
	'title': 'Joystick',
    'address': 0x12,
    'icon': "joystick",
    'color': 'green',
    'receive': function(data) {
        var x = parseInt(data[1]);
        var y = parseInt(data[2]);
        var b = parseInt(data[0]);
        return {'x': x, 'y': y, 'button': b};
    },
	'inputs': {
        'direction': function(){
            this.name = "Joystick"
            this.data = {x:0.5,y:0.5,button:0}

            this.options = [
                {name:'Button', fn: function(data){     return (data.button) }},
                {name:'X', fn: function(data){     return (data.x)/1023 }},
                {name:'Y', fn: function(data){     return (data.y)/1023 }},
                {name:'Up', fn: function(data){    return (data.y) < 512 ? 0 : (data.y-512)/512 }},
                {name:'Down', fn: function(data){  return (data.y) > 512 ? 0 : (512-data.y)/512 }},
                {name:'Left', fn: function(data){  return (data.x) < 512 ? 0 : (data.x-512)/512 }},
                {name:'Right', fn: function(data){ return (data.x) > 512 ? 0 : (512-data.x)/512 }}
            ]

            this.get = function(options) {
                var fn = options ? options.fn : this.options[0].fn;

                return fn(this.data);
            }
        }
    }
}




var matrix_font = [
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x18,0x00,0x18,0x18,0x3c,0x3c,0x18],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x6c,0x6c],
    [0x00,0x6c,0x6c,0xfe,0x6c,0xfe,0x6c,0x6c],
    [0x00,0x30,0xf8,0x0c,0x78,0xc0,0x7c,0x30],
    [0x00,0xc6,0x66,0x30,0x18,0xcc,0xc6,0x00],
    [0x00,0x76,0xcc,0xdc,0x76,0x38,0x6c,0x38],
    [0x00,0x00,0x00,0x00,0x00,0xc0,0x60,0x60],
    [0x00,0x18,0x30,0x60,0x60,0x60,0x30,0x18],
    [0x00,0x60,0x30,0x18,0x18,0x18,0x30,0x60],
    [0x00,0x00,0x66,0x3c,0xff,0x3c,0x66,0x00],
    [0x00,0x00,0x30,0x30,0xfc,0x30,0x30,0x00],
    [0x60,0x30,0x30,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0xfc,0x00,0x00,0x00],
    [0x00,0x30,0x30,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x80,0xc0,0x60,0x30,0x18,0x0c,0x06],
    [0x00,0x7c,0xe6,0xf6,0xde,0xce,0xc6,0x7c],
    [0x00,0xfc,0x30,0x30,0x30,0x30,0x70,0x30],
    [0x00,0xfc,0xcc,0x60,0x38,0x0c,0xcc,0x78],
    [0x00,0x78,0xcc,0x0c,0x38,0x0c,0xcc,0x78],
    [0x00,0x1e,0x0c,0xfe,0xcc,0x6c,0x3c,0x1c],
    [0x00,0x78,0xcc,0x0c,0x0c,0xf8,0xc0,0xfc],
    [0x00,0x78,0xcc,0xcc,0xf8,0xc0,0x60,0x38],
    [0x00,0x30,0x30,0x30,0x18,0x0c,0xcc,0xfc],
    [0x00,0x78,0xcc,0xcc,0x78,0xcc,0xcc,0x78],
    [0x00,0x70,0x18,0x0c,0x7c,0xcc,0xcc,0x78],
    [0x00,0x30,0x30,0x00,0x00,0x30,0x30,0x00],
    [0x60,0x30,0x30,0x00,0x00,0x30,0x30,0x00],
    [0x00,0x18,0x30,0x60,0xc0,0x60,0x30,0x18],
    [0x00,0x00,0xfc,0x00,0x00,0xfc,0x00,0x00],
    [0x00,0x60,0x30,0x18,0x0c,0x18,0x30,0x60],
    [0x00,0x30,0x00,0x30,0x18,0x0c,0xcc,0x78],
    [0x00,0x78,0xc0,0xde,0xde,0xde,0xc6,0x7c],
    [0x00,0xcc,0xcc,0xfc,0xcc,0xcc,0x78,0x30],
    [0x00,0xfc,0x66,0x66,0x7c,0x66,0x66,0xfc],
    [0x00,0x3c,0x66,0xc0,0xc0,0xc0,0x66,0x3c],
    [0x00,0xf8,0x6c,0x66,0x66,0x66,0x6c,0xf8],
    [0x00,0xfe,0x62,0x68,0x78,0x68,0x62,0xfe],
    [0x00,0xf0,0x60,0x68,0x78,0x68,0x62,0xfe],
    [0x00,0x3e,0x66,0xce,0xc0,0xc0,0x66,0x3c],
    [0x00,0xcc,0xcc,0xcc,0xfc,0xcc,0xcc,0xcc],
    [0x00,0x78,0x30,0x30,0x30,0x30,0x30,0x78],
    [0x00,0x78,0xcc,0xcc,0x0c,0x0c,0x0c,0x1e],
    [0x00,0xe6,0x66,0x6c,0x78,0x6c,0x66,0xe6],
    [0x00,0xfe,0x66,0x62,0x60,0x60,0x60,0xf0],
    [0x00,0xc6,0xc6,0xd6,0xfe,0xfe,0xee,0xc6],
    [0x00,0xc6,0xc6,0xce,0xde,0xf6,0xe6,0xc6],
    [0x00,0x38,0x6c,0xc6,0xc6,0xc6,0x6c,0x38],
    [0x00,0xf0,0x60,0x60,0x7c,0x66,0x66,0xfc],
    [0x00,0x1c,0x78,0xdc,0xcc,0xcc,0xcc,0x78],
    [0x00,0xe6,0x66,0x6c,0x7c,0x66,0x66,0xfc],
    [0x00,0x78,0xcc,0x1c,0x70,0xe0,0xcc,0x78],
    [0x00,0x78,0x30,0x30,0x30,0x30,0xb4,0xfc],
    [0x00,0xfc,0xcc,0xcc,0xcc,0xcc,0xcc,0xcc],
    [0x00,0x30,0x78,0xcc,0xcc,0xcc,0xcc,0xcc],
    [0x00,0xc6,0xee,0xfe,0xd6,0xc6,0xc6,0xc6],
    [0x00,0xc6,0x6c,0x38,0x38,0x6c,0xc6,0xc6],
    [0x00,0x78,0x30,0x30,0x78,0xcc,0xcc,0xcc],
    [0x00,0xfe,0x66,0x32,0x18,0x8c,0xc6,0xfe],
    [0x00,0x78,0x60,0x60,0x60,0x60,0x60,0x78],
    [0x00,0x02,0x06,0x0c,0x18,0x30,0x60,0xc0],
    [0x00,0x78,0x18,0x18,0x18,0x18,0x18,0x78],
    [0x00,0x00,0x00,0x00,0xc6,0x6c,0x38,0x10],
    [0xff,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x18,0x30,0x30],
    [0x00,0x76,0xcc,0x7c,0x0c,0x78,0x00,0x00],
    [0x00,0xdc,0x66,0x66,0x7c,0x60,0x60,0xe0],
    [0x00,0x78,0xcc,0xc0,0xcc,0x78,0x00,0x00],
    [0x00,0x76,0xcc,0xcc,0x7c,0x0c,0x0c,0x1c],
    [0x00,0x78,0xc0,0xfc,0xcc,0x78,0x00,0x00],
    [0x00,0xf0,0x60,0x60,0xf0,0x60,0x6c,0x38],
    [0xf8,0x0c,0x7c,0xcc,0xcc,0x76,0x00,0x00],
    [0x00,0xe6,0x66,0x66,0x76,0x6c,0x60,0xe0],
    [0x00,0x78,0x30,0x30,0x30,0x70,0x00,0x30],
    [0x78,0xcc,0xcc,0x0c,0x0c,0x0c,0x00,0x0c],
    [0x00,0xe6,0x6c,0x78,0x6c,0x66,0x60,0xe0],
    [0x00,0x78,0x30,0x30,0x30,0x30,0x30,0x70],
    [0x00,0xc6,0xd6,0xfe,0xfe,0xcc,0x00,0x00],
    [0x00,0xcc,0xcc,0xcc,0xcc,0xf8,0x00,0x00],
    [0x00,0x78,0xcc,0xcc,0xcc,0x78,0x00,0x00],
    [0xf0,0x60,0x7c,0x66,0x66,0xdc,0x00,0x00],
    [0x1e,0x0c,0x7c,0xcc,0xcc,0x76,0x00,0x00],
    [0x00,0xf0,0x60,0x66,0x76,0xdc,0x00,0x00],
    [0x00,0xf8,0x0c,0x78,0xc0,0x7c,0x00,0x00],
    [0x00,0x18,0x34,0x30,0x30,0x7c,0x30,0x10],
    [0x00,0x76,0xcc,0xcc,0xcc,0xcc,0x00,0x00],
    [0x00,0x30,0x78,0xcc,0xcc,0xcc,0x00,0x00],
    [0x00,0x6c,0xfe,0xfe,0xd6,0xc6,0x00,0x00],
    [0x00,0xc6,0x6c,0x38,0x6c,0xc6,0x00,0x00],
    [0xf8,0x0c,0x7c,0xcc,0xcc,0xcc,0x00,0x00],
    [0x00,0xfc,0x64,0x30,0x98,0xfc,0x00,0x00],
    [0x00,0x1c,0x30,0x30,0xe0,0x30,0x30,0x1c],
    [0x00,0x18,0x18,0x18,0x00,0x18,0x18,0x18],
    [0x00,0xe0,0x30,0x30,0x1c,0x30,0x30,0xe0],
    [0x00,0x00,0x00,0x00,0x00,0x00,0xdc,0x76],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00]
]

var buttonfactory = function(button_index,button_title){
    return function() {
                this.name = button_title ? button_title : "Key " + button_index
                this.data = {'button':[]}
                this.icon = "button"
                this.bgColor = rockpool.palette.red
                this.get = function () {  return this.data.button[button_index] ? 1 : 0 }
            }
}
