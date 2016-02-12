var rockpool = rockpool || {};

/*
 w = 87  u = 38
 s = 83  d = 40
 a = 65  l = 37
 d = 68  r = 39
*/

rockpool.time = 0;

rockpool.pressed={
    87: false,
    83: false,
    65: false,
    68: false,
    38: false,
    40: false,
    37: false,
    39: false
};

rockpool.inputs = {
    state: function() {
        this.name = "Value"
        this.icon = "half"
        this.bgColor = rockpool.palette.blue
        this.category = 'Value'
        this.setValue = function(option,value){
            this.options[option].value = parseFloat(value);
        }
        /*
        this.configure_ui = function(obj_rule,dom_configure){
            var obj_rule_input = obj_rule.getInput();
            var current_value = obj_rule_input.options ? obj_rule_input.options.value : 0;

            var dom = $('<div>').addClass('pure-g');
            var dom_slider_container = $('<div>').addClass('pure-u-4-5').appendTo(dom);
            var dom_ok_container = $('<div>').addClass('pure-u-1-5').appendTo(dom);

            var dom_slider = $('<div>').addClass('config-slider color-grey').appendTo(dom_slider_container);
            var dom_slider_bar = $('<div>').css({width:(current_value*100)+'%'}).appendTo(dom_slider);
            var dom_slider_status = $('<span>').addClass('status').appendTo(dom_slider);

            $('<i class="icon-off option"><span class="name">Off</span></i>').data({'key':'state','seq':0}).appendTo(dom_slider);
            $('<i class="icon-on option"><span class="name">On</span></i>').data({'key':'state','seq':10}).appendTo(dom_slider);

            var dom_save = $('<div class="color-green option"><i class="icon-tick"><span class="name">Save</span></i></div>')
                .addClass('save')
                .data({'key':'state','seq':11,'value':current_value})
                .appendTo(dom_ok_container);

            if(current_value == 1){
                dom_slider.find('.icon-on').addClass('current');
                dom_save.data({'key':'state','seq':10,'value':current_value});
            }
            else if(current_value == 0){
                dom_save.data({'key':'state','seq':0,'value':current_value});
            }

            dom_slider_status.text(Math.round(current_value * 1000) +'%');

            function update_slider(e,obj){

                var offset = e.pageX - obj.position().left - 97 ;
                var width = obj.width();

                var percent = offset/width;
                if(percent < 0.001){percent = 0.001};
                if(percent > 0.999){percent = 0.999};
                
                obj.find('div').css({width:(Math.round(percent*1000.0)/10.0) + '%'});

                dom_save.data({'key':'state','seq':11,'value':percent});

                dom_slider_status.text(Math.round(percent*1000.0) +'%');  
            }
            var dragging = false;

            dom_slider.on('mousedown',function(){dragging=true});
            dom_slider.on('mouseup',function(){dragging=false});
            dom_slider.on('mousemove',function(e){
                if(dragging){
                update_slider(e,$(this));
                }
            })

            dom_slider.on('click',function(e){
                update_slider(e,$(this));
            });

            dom.appendTo(dom_configure);
        }*/

        this.options = [
                {name:'Off',     value: 0.0, icon: "off" },
                {name:'Percentage', value: 0.5, ui: 'slider' },
                {name:'On',      value: 1.0, icon: "on" }
            ]

        this.get = function ( options ) {
            return (options && options.value) ? options.value : 0
        }
    },
    time: function() {
        this.name = "Time"
        this.sindex = 0;
        this.icon = "clock"
        this.color = "navy"

        this.options = [
            {name:'Minute'},
            {name:'Hour'},
            {name:'Day'}
        ];

        this.raw = function(){
            return new Date().toLocaleTimeString();
        }

        this.get = function(options){
            var type = ( options && options.name ) ? options.name : this.options[0].name;

            var d = new Date();

            switch(type){
                case 'Minute':
                    return d.getSeconds() / 59;
                case 'Hour':
                    return d.getMinutes() / 59;
                case 'Day':
                    return d.getHours() / 23;

            }
        }
    },
    random: function() {
        this.name = "Random"
        this.sindex = 0;
        this.icon = "random"
        this.color = "navy"
        this.tick = 0;
        this.value = 0;

        this.options = [
            {name:'Slow', speed:15},
            {name:'Medium', speed:10},
            {name:'Fast', speed:5}
        ];

        this.get = function(options){

            var speed = ( options && options.speed ) ? options.speed : this.options[0].speed;


            if(this.tick == 0){
                this.value = Math.random();
            }

            this.tick++;
            this.tick%=speed;

            return this.value;

        }
    },
    wave: function() {
        this.name = "Wave"
        this.sindex = 0;
        this.icon = "sine"
        this.color = "navy"

        this.frequency = 0;

        this.options = [
            {name:'Slow', frequency:0.01},
            {name:'Medium', frequency:0.5},
            {name:'Fast', frequency:1.0},
            {name:'Custom', frequency:9.0, ui:'slider'}
        ];

        this.frequency = 0;
        this.phase = 0.0;

        this.setValue = function(option,value){
            this.options[option].frequency = parseFloat(value);
        }

        this.get = function(options){

            var time = rockpool.time;

            var frequency = ( options && options.frequency ) ? options.frequency : this.options[0].frequency;

            if(frequency != this.frequency){
                var c = (time * this.frequency + this.phase) % (2.0 * Math.PI);
                var n = (time * frequency) % (2.0 * Math.PI);

                this.phase = c - n;
                this.frequency = frequency;
            }

            return (Math.sin(time * this.frequency + this.phase) + 1.0) / 2.0;

        }
    },
    square: function() {
        this.name = "Square"
        this.sindex = 0;
        this.icon = "square"
        this.color = "navy"

        this.options = [
            {name:'Slow', speed:1.0},
            {name:'Medium', speed:5.0},
            {name:'Fast', speed:9.0},
            {name:'Custom', speed:9.0, ui:'slider'}
        ];

        this.setValue = function(option,value){
            this.options[option].speed = parseFloat(value) * 90;
        }

        this.get = function(options){

            var speed = ( options && options.speed ) ? options.speed : this.options[0].speed;

            return Math.round(rockpool.time/(90/speed)) % 2;

        }
    }/*,
    pattern: function () {
        this.name = "Pattern"
        this.sindex = 0
        this.icon = "random"
        this.bgColor = rockpool.palette.blue
        this.category = 'Pattern'

        this.options = [
                {category: 'Waveforms', name:'Sine',     sequence: function(){ return (Math.sin(rockpool.time/10) + 1.0) / 2.0 }, icon: "sine"},
                {category: 'Waveforms', name:'Random',   sequence: function(){ return Math.random() }, icon: "random" },
                {category: 'Waveforms', name:'Pulse',    sequence: function(){ return 1.0 - (((rockpool.time/10) % 10) / 10.0);}, icon: "pulse"}, // [0, 0.5, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1]
                {category: 'Waveforms', name:'Square',   sequence: function(){ return Math.round(rockpool.time/10) % 2;}, icon: "square"}, // [0, 0, 1, 1]
                {category: 'Waveforms', name:'Triangle', sequence: function(){ return Math.abs(((rockpool.time/10)%10)-5)/5.0;console.log(r);}, icon: "triangle"}, // [0, 0.5, 1, 0.5]
                {category: 'Waveforms', name:'Saw',      sequence: function(){ return (((rockpool.time/10) % 5) / 5.0);}, icon: "saw"}//, //[1,0.5,0]
                //{category: 'Waveforms', name:'Clock',    sequence: function(){ return ((rockpool.time/10) % 2) / 2.0;}, icon: "clock"} // function(){ var d = new Date(); return d.getTime() % 2;}
            ]

        this.get = function ( options ) {
            var sequence = ( options && options.sequence ) ? options.sequence : this.sequence;

            if( !sequence ) return 0

            if( typeof( sequence ) === 'function' ){
                return sequence();
            }
            var value =  sequence[this.sindex]
            this.sindex++
            if( this.sindex >= sequence.length ){
                this.sindex = 0
            }
            return value;
        }
    },*/
}

if(window.DeviceMotionEvent) {
    rockpool.tilt = {x:0.5,y:0.5,z:0.5};

    window.addEventListener('devicemotion', function(event) {

        var x = event.accelerationIncludingGravity.x;
        var y = event.accelerationIncludingGravity.y;
        var z = event.accelerationIncludingGravity.z;

        if(!rockpool.inputs.tilt && x + y + z != 0){
            rockpool.inputs.tilt = function() {
                this.name = "Tilt"
                this.icon = "motion"
                this.bgColor = rockpool.palette.blue
                this.category = 'Orientation'

                this.options = [
                    {category: 'Tilt', name: 'X', icon: "motion"},
                    {category: 'Tilt', name: 'Y', icon: "motion"},
                    {category: 'Tilt', name: 'Z', icon: "motion"},
                ]

                this.get = function(options){
                    switch(options.name){
                        case 'X':
                            return rockpool.tilt.x;
                        case 'Y':
                            return rockpool.tilt.y;
                        case 'Z':
                            return rockpool.tilt.z;
                    }
                }
            }
        }

        rockpool.tilt = {
            x: (Math.max(-1.0,Math.min(1.0,x / 9.5)) + 1.0) / 2,
            y: (Math.max(-1.0,Math.min(1.0,y / 9.5)) + 1.0) / 2,
            z: (Math.max(-1.0,Math.min(1.0,z / 9.5)) + 1.0) / 2
        }
    });
}


    $(window).on('keydown',function(e){
         rockpool.pressed[e.keyCode] = true;
    });

    $(window).on('keyup',function(e){
         rockpool.pressed[e.keyCode] = false;
    });

    rockpool.inputs.keyboard = function () {
        this.name = "Keyboard"
        this.keys = []
        this.icon = "keyboard"
        this.bgColor = rockpool.palette.blue
        this.category = 'Keys'

        this.options = [
                {category: 'Keyboard Key', name:"Up",     keys:[87, 38], icon: "keyboard-up"},
                {category: 'Keyboard Key', name:"Down",   keys:[83, 40], icon: "keyboard-down"},
                {category: 'Keyboard Key', name:"Left",   keys:[65, 37], icon: "keyboard-left"},
                {category: 'Keyboard Key', name:"Right",  keys:[68, 39], icon: "keyboard-right"},
                {category: 'Keyboard Key', name:"0",      keys:[48], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"1",      keys:[49], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"2",      keys:[50], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"3",      keys:[51], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"4",      keys:[52], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"5",      keys:[53], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"6",      keys:[54], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"7",      keys:[55], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"8",      keys:[56], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"9",      keys:[57], icon: "keyboard-number"},
            ]
        this.get = function(options){
            var x = options ? options.keys.length : this.keys.length
            while(x--){
                if(rockpool.pressed[options ? options.keys[x] : this.keys[x]]){
                    return 1.0
                }
            }
            return 0.0
        }
    }