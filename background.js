
var isclicked = false;
var canShow;
var checked;
var once = true;
var lastUrl = "";
var lastName = "no transcript to download";

chrome.storage.sync.get(['key'], function(result) {
	checked = result.key;
	canShow = checked;
});

chrome.tabs.onUpdated.addListener(
	function(tabId, changeInfo, tab) {
		if (changeInfo.status == 'complete' && tab.active) {
			once = true;
			if (checked && tab.url.includes("microsoftstream.com")){
				canShow = true;
			}
			lastUrl = "";
			lastName = "no transcript to download";
		}
	}
)

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
    	if (request.msg == "getLastName"){
    		chrome.runtime.sendMessage({name: lastName})
    	}
    	if (request.msg == "checked"){
    		canShow = false
    		checked = true
    	}
    	if (request.msg == "unchecked"){
    		canShow = false
    		checked = false
    	}
    }
)

chrome.webRequest.onSendHeaders.addListener(checkTranscript, {urls: ["*://*.api.microsoftstream.com/*"]})

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
    	if (request.msg == "download"){
    		if (lastUrl.includes("https://")){
	    		chrome.tabs.getSelected(null,function(tab) {
					var url = tab.url
		    		if (url.includes("microsoftstream.com")){
						download(lastUrl);
						canShow = false
					} else {
						var res = confirm("Are you sure you want to download the last transcript?")
						if (res==true){
							canShow = false
							download(lastUrl)
						}
					}
				})
    		} else {
    		chrome.tabs.getSelected(null,function(tab) {
				var url = tab.url
				if (url.includes("microsoftstream.com")){
					isclicked = true;
					chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  						chrome.tabs.reload(tabs[0].id);
					});
				} else window.alert("No transcript found on this page.")
			})
    	}
    	}
    	
    }
);

function checkTranscript(details){
	chrome.tabs.getSelected(null,function(tab) {
		if(details.url.includes("texttracks") && once){
			once = false;
			getTranscriptUrl(details.url)
		}
	});
}

function getTranscriptUrl(url){
	var client = new HttpClient();
	client.get(url, function(response) {
		lastUrl = response.slice(response.lastIndexOf('"url":') + 7, response.lastIndexOf(",") -1);
		console.log(lastUrl)
		if (lastUrl.includes("value")){
			if (isclicked){window.alert("No transcript found."); isclicked = false}
			return
		} else {
			getTitle()
			if (canShow){
				canShow = false
				var res = confirm("A transcript has been found, do you want to download it?")
				
				if (res==true){
					download(lastUrl)
				}
			}
		}
		
	});
	
}

function download(url){
	var client = new HttpClient();
	client.get(url, function(response) {
   		cleanVtt(response)
	});
}


function downloadText(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}


var HttpClient = function() {
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                aCallback(anHttpRequest.responseText);
        }
        anHttpRequest.open( "GET", aUrl, true );            
        anHttpRequest.send( null );
    }
}


function cleanVtt(text){
	text = text.replace(/WEBVTT[\r\n]/,"");
	text = text.replace(/NOTE duration:.*[\r\n]/,"");
	text = text.replace(/NOTE language:.*[\r\n]/,"");
	text = text.replace(/NOTE Confidence:.+\d/g,"");
	text = text.replace(/NOTE recognizability.+\d/g,"");
	text = text.replace(/[\r\n].+-.+-.+-.+-.+/g,"");
	text = text.replace(/[\r\n].+ --> .+[\r\n]/g,"");
	text = text.replace(/.[\r\n]. --> .+[\r\n]/g,"");
	text = text.replace(/[\n](.)/g," $1");
	text = text.replace(/[\r\n]+/g,"");
	text = text.replace(/^ /,"");
	downloadText(lastName + ".txt", text)
}

function getTitle(){
	chrome.tabs.getSelected(null,function(tab) {
		var title = tab.title
		title = title.slice(title.indexOf("\u00a0")+1, title.lastIndexOf("\u00a0"))
		chrome.tabs.getSelected(null,function(tab) {
			var url = tab.url
    		if (url.includes("microsoftstream.com")){
    			lastName = title
				chrome.runtime.sendMessage({name: title})
			}
		})
	})
}