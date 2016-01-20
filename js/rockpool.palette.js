var rockpool = rockpool || {};

rockpool.prompt = function(content, close_on_click){
    if( close_on_click = null || typeof( close_on_click ) === 'undefined' ){
        close_on_click = true;
    }
    $.fancybox.open({
        openEffect  : 'none',
        closeEffect : 'none',
        modal       : true,
        content     : content,
        width       : '100%',
        margin      : [10, 10, 10, 10],
        beforeClose : function(){}
        //helpers     : {overlay : {locked : false}}
    });
    $('.fancybox-overlay,.fancybox-wrap').on('click', function(){

        if( close_on_click ){
            $.fancybox.close();
        }

    })
}

rockpool.closePrompt = function(){
    $.fancybox.close();
}

rockpool.generatePalette = function(type){

    switch(type){
        case 'input':
            var collection = rockpool.inputs;
            break;
        case 'output':
            var collection = rockpool.outputs;
            break;
        case 'converter':
            var collection = rockpool.converters;
            break;
        default:
            return;
    }



    var dom_list = $('.palette.' + type);

    if( dom_list.length == 0 ){
        var title = (type == 'input') ? 'Inputs' : ((type == 'output') ? 'Outputs' : 'Converters')
        dom_list = $('<div>').addClass('palette').addClass(type).appendTo('.palettes');
        $('<i>').addClass('close').appendTo(dom_list);
    }

    dom_list.find('div').remove();


    if( type == 'converter' ){

        var dom_section = $("<div><header><h1>" + rockpool.languify("Choose a converter") + "</h1></header>").appendTo(dom_list);

        /*
            Converters are assigned logical, named groups depending on what they do
        */
        var categories = {};

        for(var k in collection){
            var handler = (typeof(collection[k]) === 'function') ? new collection[k] : collection[k];

            var color = handler.color ? 'color-' + handler.color : 'color-grey';

            var category = handler.category ? handler.category : 'General';

            var dom_parent = categories[category] ? categories[category] : categories[category] = $('<ul><li><h2>' + rockpool.languify(category) + '</h2></li></ul>').appendTo(dom_section);


            var icon = handler.icon ? 'css/images/icons/icon-' + handler.icon + '.png' : 'css/images/icons/icon-default.png';

            var dom_option = $('<li><i><img src=""><span class="name">' + rockpool.languify(handler.name) + '</span></i></li>')
                                    .addClass('option')
                                    .addClass(color)
                                    .data({
                                        'key': k
                                    })
                                    .appendTo(dom_parent)
                                    .find('img').attr('src',icon);

        }

    }
    else
    {
        /*
            Inputs and outputs are grouped by parent module or type ( variable, value, generator etc )
        */
        var types = {};
        types["real"] = $("<div><header><h1>" + rockpool.languify("Choose an " + type) + "</h1></header>").appendTo(dom_list);
        types["virtual"] = $("<div><header><h1>" + rockpool.languify("Choose a virtual " + type) + "</h1></header>").appendTo(dom_list);

        for(var k in collection){
            var handler = (typeof(collection[k]) === 'function') ? new collection[k] : collection[k]

            var active = (handler.type == "module") ? handler.active : true;

            if(!active) continue

            var type = (handler.type == "module") ? "real" : "virtual";

            var icon = handler.icon ? handler.icon : 'default';

            var channel = (handler.channel != null) ? handler.channel : -1;

            var color = handler.color ? 'color-' + handler.color : 'color-grey';

            var dom_parent = $('<ul><li class="' + color + '" data-key="' + k + '"><i><img src=""><span class="name">' + rockpool.languify(handler.name) + '</span></i></li></ul>').appendTo(types[type]);
            dom_parent.find('img').attr('src','css/images/icons/icon-' + icon + '.png');

            if(handler.options){

                dom_parent.find('li').data('seq',0);

                for(var idx in handler.options){
                    var opt = handler.options[idx]

                    var dom_option = $('<li><i><img src=""><span class="name">' + rockpool.languify(opt.name) + '</span></i></li>')
                                    .addClass(color)
                                    .data({
                                        'seq': idx,
                                        'key': k
                                    })
                                    .appendTo(dom_parent);

                    var icon = opt.icon ? opt.icon : (handler.icon ? handler.icon : 'default');

                    if(opt.type){d.addClass(item.type)}
                    if(icon){dom_option.find('img').attr('src','css/images/icons/icon-' + icon + '.png')}
                }

            }


        } 
    }



}

rockpool.add = function(type, rule, index){
	switch(type){
        case 'tool':
            var categories = {}

            var dom_list = $('<div><h1>Tools</h1>').addClass('palette')

            for( var k in rockpool.tools ){
                var tool = new rockpool.tools[k]
                var d = $('<li data-key="' + k + '"><i><img src=""><span class="name">' + k + '</span></i></li>')
                if(tool.bgColor){d.find('.icon').css({color:tool.bgColor}) }

                if(!categories[tool.category]){

                    var channel_title = tool.category? '<h2>' + rockpool.languify(tool.category) + '</h2>' : ''
                    categories[tool.category] = $('<div>' + channel_title + '<ul></ul></div>').appendTo(dom_list)

                }

                categories[tool.category].find('ul').append(d)
            }

            rockpool.prompt(dom_list)

            dom_list.on('click','li',function(){
                $.fancybox.close()
                $(this).parent().remove()
                rockpool.tool($(this).data('key'))
            })

        break;
        case 'input':
        case 'output':
        case 'converter':

            var dom_list = $('.palettes .palette.' + type).off('click');

            rockpool.prompt(dom_list)

            dom_list.on('click','ul',function(e){
                e.preventDefault();
                e.stopPropagation();
            })

            switch(type){
                case 'input':
                        dom_list.on('click','li',function(){

                            var k = $(this).data('key');
                            var o = parseInt($(this).data('seq'));

                            rule = rule instanceof rockpool.rule ? rule : new rockpool.rule()
                            rule.start();
                            rule.setInputHandler(k, o)
                            $.fancybox.close()
                        })
                    break;
                case 'output':
                        dom_list.on('click','li',function(){

                            var k = $(this).data('key');
                            var o = parseInt($(this).data('seq'));

                            rule = rule instanceof rockpool.rule ? rule : new rockpool.rule()
                            rule.start();
                            rule.setOutputHandler(k, o);
                            $.fancybox.close()
                        })
                    break;
                default:
                    dom_list.on('click','li.option',function(){
                        var k = $(this).data('key')
                        $.fancybox.close()

                        rule = rule instanceof rockpool.rule ? rule : new rockpool.rule()
                        rule.start();
                        var widget_index = typeof(index) === 'number' ? index - 2 : Math.floor(rule.converter_count/2);

                        rule.setHandler(widget_index, k)
                    })
            }

        break;
    }
}


rockpool.updatePalettes = function() {
    rockpool.generatePalette('input')
    rockpool.generatePalette('output')
}
