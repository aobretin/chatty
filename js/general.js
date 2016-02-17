function isEmpty(obj) {
	var prop;

    for (prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}

function keyDown(btn) {
	var buttons = document.querySelectorAll(btn);

	onkeydown = function(e) {
		for (var i = 0; i < buttons.length; i++) {
			if (e.which == 13 && !buttons[i].disabled) {
				triggerStart = document.createEvent("HTMLEvents");
				triggerStart.initEvent('click', true, false);
				buttons[i].dispatchEvent(triggerStart);
			}
		}
		
	}		
}