
/**
 * Get all contacts name and addresses from Agendor
 */
function getDataAgendorForMapping()
{
	//disable button and ask user to wait
	document.getElementById("MapBtnId").disabled = true;
	document.getElementById("MapBtnId").value = "Wait";
	
	//First request to get total of contacts
	var contactRequestTotal = createXMLHttp();
    var totalContacts;
    var apikey = "APIKEY";
    const proxyurl = "https://cors-anywhere.herokuapp.com/";
    contactRequestTotal.open('GET', proxyurl+"https://api.agendor.com.br/v3/organizations", true);
    contactRequestTotal.setRequestHeader("Authorization", "Token "+ apikey);
    var contactsData;
    contactRequestTotal.onreadystatechange = function() 
    {
        if (contactRequestTotal.readyState == 4)
        {
        	
            if (contactRequestTotal.status == 200 ) 
            {
                //Second request to get all contacts with one request
                totalContacts = contactRequestTotal.getResponseHeader('Total');
                var contactRequest = createXMLHttp();
                contactRequest.open('GET', proxyurl+"https://api.agendor.com.br/v3/organizations?&per_page=" + totalContacts, true);
                contactRequest.setRequestHeader("Authorization", "Token " + apikey);
                contactRequest.onreadystatechange = function() 
                {
                    if (contactRequest.readyState == 4)
                    {
                    	
                        if (contactRequest.status == 200 ) 
                        {
                            //Build agendor contacts Array
                            var contactsDataObj = JSON.parse(contactRequest.responseText);
                            var contacts = buildAgendorContactsArray(contactsDataObj);
                            if(contacts.length > 0)
                            {
                            	//insert latitude and longitude in all contacts
                            	getLatLng(contacts,0);
                            }
                        	
                        } else 
                        {
                        	document.getElementById("MapBtnId").disabled = false;
                        	document.getElementById("MapBtnId").value = "Generate Map";
                        }
                        
                    }
                }
                contactRequest.send(null);
            	
            }          
        }
    }
    contactRequestTotal.send(null);
    
    
	 
	
}

/**
 * Transform a raw data object from Agendor request into an Array of AgendorContact objects
 * @param contactsDataObj - raw data object from Agendor request
 */
function buildAgendorContactsArrayForMapping(contactsDataObj)
{
	var agendorContacts = new Array();
	console.log("a= " +contactsDataObj.data.length);
    for(var i=0; i < contactsDataObj.data.length; i++)
    {
    	//if(contactsDataObj.data[i].cnpj != null)
    	//{
	    	contact = new AgendorContact();
	    	contact.country = contactsDataObj.data[i].address.country;
	    	contact.name = contactsDataObj.data[i].name;
	    	if(contactsDataObj.data[i].address != null)
	    	{
		    	contact.district = contactsDataObj.data[i].address.district;
		    	contact.streetName = contactsDataObj.data[i].address.streetName;
		    	contact.streetNumber = contactsDataObj.data[i].address.streetNumber;
		    	contact.additionalInfo = contactsDataObj.data[i].address.additionalInfo;
		    	contact.postalCode = contactsDataObj.data[i].address.postalCode;
		    	contact.state = contactsDataObj.data[i].address.state;
		    	contact.city = contactsDataObj.data[i].address.city;
	    	}
	    	else{
	    		contact.district = null;
		    	contact.streetName =null;
		    	contact.streetNumber = null;
		    	contact.additionalInfo = null;
		    	contact.postalCode = null;
		    	contact.state = null;
		    	contact.city = null;
	    	}
	    	agendorContacts.push(contact);   
    }

    return agendorContacts;
}

/**
 * Recursively get latitude and longitude and insert to current contact
 * 
 * @param contacts - array of contacts
 * @param i - current index of contact, to start pass 0 
 * @returns
 */
function getLatLng(contacts,i)
{
	//request to get latitude and longitude of the current contact address
	var addrRequest = createXMLHttp();
	apiKey = "APIKEY";
    const proxyurl = "https://cors-anywhere.herokuapp.com/"; 
    var addr = "";
    
    //build address parameter of current contact
    if(contacts[i].streetName != null && contacts[i].streetName != undefined)
    {
    	addr = addr+" "+contacts[i].streetName+", ";
    }
    if(contacts[i].streetNumber != null && contacts[i].streetNumber != undefined)
    {
    	addr = addr+" "+contacts[i].streetNumber+", ";
    }
    if(contacts[i].district != null && contacts[i].district != undefined)
    {
    	addr = addr+" "+contacts[i].district+", ";
    }
    if(contacts[i].state != null &&  contacts[i].state != undefined)
    {
    	addr = addr+" "+contacts[i].state+", ";
    }
    if(contacts[i].city != null && contacts[i].city != undefined)
    {
    	addr = addr+" "+contacts[i].city+", ";
    }
    if(contacts[i].postalCode != null && contacts[i].postalCode != undefined)
    {
    	addr = addr+" "+contacts[i].postalCode+", ";
    }
    if(contacts[i].country != null && contacts[i].country != undefined)
    {
    	addr = addr+" "+contacts[i].country+" ";
    }

    addr = unescape(encodeURIComponent(addr));
    addrRequest.open('GET', proxyurl+"https://maps.googleapis.com/maps/api/geocode/json?address="+addr+"&key="+apiKey, true);

    addrRequest.onreadystatechange = function() 
    {
        if (addrRequest.readyState == 4)
        {
							
            if (addrRequest.status == 200) 
            {
            	var addrDataObj = JSON.parse(addrRequest.responseText);
            	
            	//if find latitude an longitude
            	if(addrDataObj.status != "ZERO_RESULTS")
            	{
            		//insert info into contact
                	contacts[i].lat = addrDataObj.results[0].geometry.location.lat;
                	contacts[i].lng = addrDataObj.results[0].geometry.location.lng;	
                	console.log("LAT1: "+contacts[i].lat+" LONG: "+contacts[i].lng);
            	}
            	else
            	{
            		//delete contact from array
                	delete contacts[i];		    	
            	}

            }
            
            //if is not finished traveling in all array
	        if(i < contacts.length-1)
	    	{
	        	//get lat and lng for next contact
	        	getLatLng(contacts,i+1)
	    	}
	        else
	        {	
	        	//begin generating map
	        	generateMap(contacts);
	        }
        }
    }
    
    addrRequest.send();
}

/**
 * Generate map with pins showing each contact address 
 * @param contacts - array of contacts
 * @returns
 */
function generateMap(contacts)
{
	//enable map screen location
	document.getElementById("map").style.display = "block";
	document.getElementById("idContDiv").style.display = "none"; 
	
	//clean deleted contacts from array
	for(var i = contacts.length -1; i >=0 ; i--)
	{
		if(contacts[i]== undefined)
		{
			contacts.splice(i,1);
		}
	}
	
	//build location array with all lat and lng of contacts
	var locations = new Array();
	for(i=0; i < contacts.length; i++)
	{
		locations.push({lat: contacts[i].lat, lng: contacts[i].lng});
	}
	
	//create map
	var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -10.338055555555556, lng: -53.21638888888889},
        zoom: 4
      });

	//build array with contacts name, label of pins
	labels = new Array();
	for(i=0; i < contacts.length; i++)
	{
		console.log(contacts[i].name);
		labels.push(contacts[i].name);
	}

    // Add some markers to the map.
    // Note: The code uses the JavaScript Array.prototype.map() method to
    // create an array of markers based on a given "locations" array.
    // The map() method here has nothing to do with the Google Maps API.
    var markers = locations.map(function(location, i) {
      return new google.maps.Marker({
        position: location,
        label: labels[i % labels.length]
      });
    });

    // Add a marker clusterer to manage the markers.
    var markerCluster = new MarkerClusterer(map, markers,
            {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

}