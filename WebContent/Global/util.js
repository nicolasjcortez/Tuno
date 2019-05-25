function createXMLHttp(){
    //Initializing our object
    var xmlHttp = null;
    //if XMLHttpRequest is available (chrome, firefox, opera...) then creating and returning it
    if (typeof(XMLHttpRequest) !== undefined) {
        xmlHttp = new XMLHttpRequest();
        //if window.ActiveXObject is available than the user is using IE...so we have to create the newest version of XMLHttp object
    } else if (window.ActiveXObject) {
        var ieXMLHttpVersions = ['MSXML2.XMLHttp.6.0', 'MSXML2.XMLHttp.5.0', 'MSXML2.XMLHttp.4.0', 'MSXML2.XMLHttp.3.0', 'MSXML2.XMLHttp', 'Microsoft.XMLHttp'];
        //In this array we are starting from the first element (newest version) and trying to create it. If there is an
        //exception thrown we are handling it (and doing nothing)
        for (var i = 0; i < ieXMLHttpVersions.length; i++) {
            try {
                xmlHttp = new ActiveXObject(ieXMLHttpVersions[i]);
            } catch (e) {}
        }
    }
    return xmlHttp;
}



/**
 * sends a request to the specified url from a form. this will change the window location.
 * @param {string} path the path to send the post request to
 * @param {object} params the paramiters to add to the url
 * @param {string} [method=post] the method to use on the form
 */

function post(path, params, method) {
    method = method || "post"; // Set method to post by default if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    form.submit();
}

function json2xml(o, tab) {
	   var toXml = function(v, name, ind) {
	      var xml = "";
	      if (v instanceof Array) {
	         for (var i=0, n=v.length; i<n; i++)
	            xml += ind + toXml(v[i], name, ind+"\t") + "\n";
	      }
	      else if (typeof(v) == "object") {
	         var hasChild = false;
	         xml += ind + "<" + name;
	         for (var m in v) {
	            if (m.charAt(0) == "@")
	               xml += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
	            else
	               hasChild = true;
	         }
	         xml += hasChild ? ">" : "/>";
	         if (hasChild) {
	            for (var m in v) {
	               if (m == "#text")
	                  xml += v[m];
	               else if (m == "#cdata")
	                  xml += "<![CDATA[" + v[m] + "]]>";
	               else if (m.charAt(0) != "@")
	                  xml += toXml(v[m], m, ind+"\t");
	            }
	            xml += (xml.charAt(xml.length-1)=="\n"?ind:"") + "</" + name + ">";
	         }
	      }
	      else {
	         xml += ind + "<" + name + ">" + v.toString() +  "</" + name + ">";
	      }
	      return xml;
	   }, xml="";
	   for (var m in o)
	      xml += toXml(o[m], m, "");
	   return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, "");
	}