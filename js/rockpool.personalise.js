var rockpool = rockpool || {};

rockpool.personalise = function(host){

	var dom_ui = $("<div>");

	var dom_name = $("<input>").attr({maxlength:8}).addClass("dockName").appendTo(dom_ui);
	var dom_user = $("<input>").attr({maxlength:8}).addClass("dockUser").appendTo(dom_ui);
	var submit = $("<div>").addClass("dockSubmit").appendTo(dom_ui);

	submit.on('click',function(){
		var dock_name = dom_name.val();
		var dock_user = dom_user.val();

		if(dock_name.length > 8){
			// Validation error
			return;
		}
		if(dock_user.length > 8){
			// Validation error
			return;
		}

		rockpool.setDockName(host, dock_name);
		rockpool.setDockUser(host, dock_user);
	});

}