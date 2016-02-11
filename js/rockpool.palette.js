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
    $('.fancybox-overlay,.fancybox-wrap').on('click','.close', function(){ $.fancybox.close(); });
    $('.fancybox-overlay,.fancybox-wrap').on('click', function(){

        if( close_on_click ){
            $.fancybox.close();
        }

    })
}

rockpool.closePrompt = function(){
    $.fancybox.close();
}

rockpool.refreshPalette = function(type){

    rockpool.refreshConnectedModules($('.palette.' + type).find('.connected-modules'), type);

}

rockpool.refreshConnectedModules = function(obj, type){

    var dock_id = 0;

    var dom_channels = obj.find('div.channels');
    if(!dom_channels.length){
        dom_channels = $('<div>').addClass('channels pure-g').appendTo(obj);

        for(x = 0; x<8; x++){
            $('<div><i></i><span>').appendTo(dom_channels);
        }
    }

    for(channel_index = 0; channel_index<8; channel_index++){
        var module = rockpool.getModule(dock_id, channel_index);
        var dom_module = dom_channels.find('div:eq(' + channel_index + ')');
        if(module === false || module.active === false){
            dom_module
                .attr('class','color-grey disabled')
                .find('i')
                .attr('class','');
            dom_module.find('span').text('');
        }
        else
        {
            dom_module
                .attr('class','color-grey')
                .data({
                    'type': type,
                    'channel': channel_index
                })
                .find('i')
                .attr('class','icon-' + module.icon);

            dom_module.find('span').text(module.title);

            if( (type === 'input' && module.input_count > 0)
            ||  (type === 'output' && module.output_count > 0)){

                dom_module
                    .attr('class','color-' + module.color + ' active');

            }
        }
    }


}

rockpool.refreshVirtualModules = function(obj, type){

    var dom_virtual = obj.find('div.virtual');
    if(!dom_virtual.length){
        dom_virtual = $('<div>').addClass('virtual pure-g').appendTo(obj);
    }
    dom_virtual.find('div').remove();

    var collection = rockpool.inputs;
    if(type == 'outputs'){
        collection = rockpool.outputs;
    }

    for(key in collection){
        var item = collection[key];

        if(item.type && item.type == 'module') continue;

        if(typeof(item) === "function") item = new item;


        var dom_item = $('<div><i></i><span>')
            .data({
                'type': type,
                'key':key
            })
            .addClass('active')
            .appendTo(dom_virtual);
        dom_item.find('span').text(item.name);
    }

}

rockpool.generatePalette = function(type){
    var dom_palette = $('.palette.' + type);

    if( dom_palette.length == 0 ){
        dom_palette = $('<div>').addClass('palette').addClass(type).appendTo('.palettes');
        $('<i>').addClass('close').appendTo(dom_palette);
    }

    if(type == 'input' || type == 'output'){

        var dom_connected_modules = $('<div>').addClass('connected-modules');
        rockpool.refreshConnectedModules(dom_connected_modules,type);
        dom_connected_modules.appendTo(dom_palette);


        var dom_virtual_modules = $('<div>').addClass('virtual-modules');
        rockpool.refreshVirtualModules(dom_virtual_modules,type);
        dom_virtual_modules.appendTo(dom_palette);

        return;
    }

}

rockpool.add = function(type, rule, index){
    var dom_palette = $('.palette.' + type);
    if(!dom_palette.length) return;

    dom_palette.find('.popup').hide();

    if(type == 'converter'){

        rule = rule instanceof rockpool.rule ? rule : new rockpool.rule();
        rule.start();
        rule.setHandler(index,"add");
        rockpool.closePrompt();

        return;
    }


    // Type is "input" or "output"
    dom_palette
    .off('click')
    .on('click','.virtual .active', function(){

        var key = $(this).data('key');
        var type = $(this).data('type');

        var collection = rockpool.inputs;
        if(type == 'outputs'){
            collection = rockpool.outputs;
        }

        var module = typeof(collection[key]) === "function" ? new collection[key] : collection[key];

        if(module.options && module.options.length > 0){
            // Needs configuration
            rockpool.virtualConfigureMenu(type, rule, key, module);
        }
        else
        {
            rule = rule instanceof rockpool.rule ? rule : new rockpool.rule();
            rule.start();
            rule.setHandler(type,key);
            rockpool.closePrompt();
        }

    })
    .on('click','.channels .active', function(){
        var dock_id = 0;
        var channel_index = $(this).data('channel');
        var type = $(this).data('type');

        var module = rockpool.getModule(dock_id, channel_index);

        console.log(type, channel_index, module);

        if(module.needsConfiguration(type))
        {
            rockpool.moduleConfigureMenu(type, rule, index, module);
        }
        else
        {
            rule = rule instanceof rockpool.rule ? rule : new rockpool.rule();
            rule.start();
            rule.setHandler(type,[module.key,module.firstInput().key].join('_'));
            rockpool.closePrompt();
        }
    });

    rockpool.prompt(dom_palette, false);
}

rockpool.virtualConfigureMenu = function(type, rule, key, module){

    var dom_palette = $('.palette.' + type);

    var dom_popup = dom_palette.find('.popup.' + key);
    if(dom_popup.length == 0){

        var dom_popup = $('<div><ul>').addClass('popup').addClass(key).appendTo(dom_palette);

        var dom_menu = dom_popup.find('ul');

        for(var idx in module.options){

            var option = module.options[idx];

            $('<li>')
                .data({
                    'key':key,
                    'idx':idx
                })
                .addClass('option')
                .text(option.name)
                .appendTo(dom_menu);

        }

    }

    dom_popup.off('click').show().on('click','li',function(){

        var key = $(this).data('key');
        var idx = parseInt($(this).data('idx'));

        rule = rule instanceof rockpool.rule ? rule : new rockpool.rule();
        rule.start();
        rule.setHandler(type,key,idx);
        rockpool.closePrompt();

    });



}

rockpool.moduleConfigureMenu = function(type, rule, index, module){
    var dom_palette = $('.palette.' + type);

    var options = module.getOptions(type);

    var dom_popup = dom_palette.find('.popup.' + module.key);
    if(dom_popup.length == 0){

        var dom_popup = $('<div><ul>').addClass('popup').addClass(module.key).appendTo(dom_palette);

        var dom_menu = dom_popup.find('ul');

        for(var idx in options){
            var option = options[idx];

            $('<li>')
                .data({
                    'key':option.key,
                    'idx':option.option
                })
                .addClass('option')
                .text(option.title)
                .appendTo(dom_menu);
        }

    }

    dom_popup.off('click').show().on('click','li',function(){

        var key = $(this).data('key');
        var idx = parseInt($(this).data('idx'));

        rule = rule instanceof rockpool.rule ? rule : new rockpool.rule();
        rule.start();
        rule.setHandler(type,key,idx);
        rockpool.closePrompt();

    });

}


rockpool.updatePalettes = function() {
    rockpool.refreshPalette('input')
    rockpool.refreshPalette('output')
}
