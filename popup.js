var checked = true;
document.addEventListener('DOMContentLoaded', function() {
	console.log('Value is set to');
	chrome.storage.sync.get(['key'], function(result) {
  		document.getElementById('togglePopup').checked = result.key;
  		if (result.key){
  			chrome.runtime.sendMessage({ msg: "checked" });
  		} else {
  			chrome.runtime.sendMessage({ msg: "unchecked" });
  		}
	});
	chrome.runtime.sendMessage({msg: "getLastName"})

	

	var checkPageButton = document.getElementById('button');
		checkPageButton.addEventListener('click', function() {
			chrome.runtime.sendMessage({ msg: "download" });

		}, false);
	document.getElementById('togglePopup').addEventListener('change', (event) => {
		if (event.currentTarget.checked) {
			chrome.runtime.sendMessage({ msg: "checked" });
			checked = true;
		} else {
			chrome.runtime.sendMessage({ msg: "unchecked" });
			checked = false;
		}
		chrome.storage.sync.set({key: checked}, function() {
			console.log('Value is set to ' + checked);
		});
	})
}, false);



chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
    	var lastName = request.name
    	if (lastName == "no transcript to download"){
    		document.getElementById('button').textContent = "Search page";
    	} else {
    		document.getElementById('button').textContent = "Download: " + lastName;
    	}
   	}
)


