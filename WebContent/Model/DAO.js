/**
 * @name Data Access Object and Integrator  
 * @version version 1.0
 * @author Nicolas Cortez
 * @fileoverview
 * The functions from this file 
 * get data from Agendor and Bling and integrates it
 */


onload = inicia

/**
 * Function called on loading index.html
 */
function inicia()
{
	document.getElementById("map").style.display = "none";
	document.getElementById("idBeginIntegration").addEventListener("click", getDataAgendor);
}


/**
 * Start process of getting contacts data, after pressing Btn Begin integation
 * get contacts data form Agendor 
 * when finished, call a function to get contacts data from Bling
 */
function getDataAgendor()
{
	document.getElementById("idBeginIntegration").disabled = true;
	document.getElementById("idBeginIntegration").value = "Wait";
	
	
	//First request to get total of contacts
	var contactRequestTotal = createXMLHttp();
    var totalContacts;
    var apikey = "1a1e9f16-7848-47f6-a7e4-a1aa94f18974";
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
                totalContacts = contactRequestTotal.getResponseHeader('Total');
                
                //Second request to get all contacts with one request
                var contactRequest = createXMLHttp();
                contactRequest.open('GET', proxyurl+"https://api.agendor.com.br/v3/organizations?&per_page=" + totalContacts, true);
                contactRequest.setRequestHeader("Authorization", "Token " + apikey);
                contactRequest.onreadystatechange = function() 
                {
                    if (contactRequest.readyState == 4)
                    {
                    	
                        if (contactRequest.status == 200 ) 
                        {
                            var contactsDataObj = JSON.parse(contactRequest.responseText);
                            
                            //Build global agendor contacts Array
                            var agendorContacts = buildAgendorContactsArray(contactsDataObj);
                            window.agendorContacts = agendorContacts;
                            
                            //Get Bling Data recursively, per page  
                            var blingContacts = null;
                            getDataBling(1, blingContacts);
                        	contactsData =  contactRequest.responseText;
                        	
                        } else 
                        {
                        	document.getElementById("idBeginIntegration").disabled = false;
                        	document.getElementById("idBeginIntegration").value = "Begin Integration";
                        }
                        
                    }
                }
                contactRequest.send(null);
            	
            } else 
            {
            	document.getElementById("idBeginIntegration").disabled = false;
            	document.getElementById("idBeginIntegration").value = "Begin Integration";
            }

            
        }
    }
    contactRequestTotal.send(null);	
}


/**
 * Transform a raw data object from Agendor request into an Array of AgendorContact objects
 * @param contactsDataObj - raw data object from Agendor request
 */
function buildAgendorContactsArray(contactsDataObj)
{
	var agendorContacts = new Array();
	console.log("a= " +contactsDataObj.data.length);
    for(var i=0; i < contactsDataObj.data.length; i++)
    {
    	contact = new AgendorContact();
    	contact.id = contactsDataObj.data[i].id;
    	contact.country = contactsDataObj.data[i].address.country;

    	contact.name = contactsDataObj.data[i].name;
    	contact.legalName = contactsDataObj.data[i].legalName;
    	contact.email = contactsDataObj.data[i].email;
    	contact.cnpj = contactsDataObj.data[i].cnpj;
    	if(contactsDataObj.data[i].contact != null)
    	{
    		contact.mobile = contactsDataObj.data[i].contact.mobile;
    	}
    	else
    	{
    		contact.mobile = null;
    	}
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
 * log Agendor Contacts Array into console
 * @param AgendorContacts Array
 */
function logAgendorContact(agendorContacts)
{
  for(i=0; i< agendorContacts.length; i++)
  {
  	console.log("id : "+agendorContacts[i].id);
  	console.log("Nome: " +agendorContacts[i].name);
  	console.log("fantasia: " +agendorContacts[i].legalName);
  	console.log("email: " +agendorContacts[i].email);
  	console.log("cnpj :" +agendorContacts[i].cnpj);
  	console.log("telefone: " +agendorContacts[i].mobile); 
  	console.log("pais: " +agendorContacts[i].country);
  	console.log("bairro: " +agendorContacts[i].district);
  	console.log("rua: " +agendorContacts[i].streetName);
  	console.log("numero rua: " +agendorContacts[i].streetNumber);
  	console.log("complemento end: " +agendorContacts[i].additionalInfo); 
  	console.log("CEP: " +agendorContacts[i].postalCode);
  	console.log("Estado: " +agendorContacts[i].state );
  	console.log("cidade: " +agendorContacts[i].city );
  }
}



/**
 * Get data from Bling recursively, make a get contacts request for each page
 * until there is no more contacts. When is done, it calls build conflict function
 * 
 * @param page current page for the request
 * @param blingContacts Array of bling contacts that is being build, first call pass it as null
 * 
 */
function getDataBling(page, blingContacts)
{
	//Fist call receive null, then create array
	if(blingContacts == null)
	{
		blingContacts = new Array();		
	}
	
	//Request to get contacts data from Bling for current page
    var contactRequest = createXMLHttp();
    const proxyurl = "https://cors-anywhere.herokuapp.com/";
    apikey = "2f6e63b56e954b3f536ec3d7c41706fa67b20846168c2b71f753760db4f50ff2a4b1697a";
    contactRequest.open('GET', proxyurl+"https://bling.com.br/Api/v2/contatos/page="+page+"/json/&apikey="+apikey, true);
    contactRequest.onreadystatechange = function() 
    {
        if (contactRequest.readyState == 4)
        {
            if (contactRequest.status == 200) 
            {
            	//get object from json response
                var contactsDataObj = JSON.parse(contactRequest.responseText);
                
                //check if there is an erro in the return
                if(contactsDataObj.retorno.erros != undefined)
                {
                	//check if the erro means that it was the last page
                	if(contactsDataObj.retorno.erros[0].erro.cod == 14)
                	{
                		//end of recursion 
                		console.log("b: " + blingContacts.length + " a:" + window.agendorContacts.length);
                		
                		//build conflicts array and display them
                		buildConflictLists(window.agendorContacts, blingContacts);

                	}
               	}
                else
            	{
                	//push Bling raw data into the Array of BlingContacts
                	blingContacts = pushBlingContactsToArray(contactsDataObj.retorno, blingContacts);
                	
                	//recursive call, next page 
                	page++;
                	getDataBling(page, blingContacts);
            	}
                
            	
            } else 
            {
            	//error situation, let user try again
            	document.getElementById("idBeginIntegration").disabled = false;
            	document.getElementById("idBeginIntegration").value = "Begin Integration";
            }
        }
    }
    contactRequest.send(null);
	
}

/**
 * Push Bling raw data into the Array of BlingContacts
 * 
 * @param contactsDataObj raw data from the request
 * @param blingContacts the array that will receive new data
 * @returns blingContacts updated
 */
function pushBlingContactsToArray(contactsDataObj, blingContacts)
{
    for(var i=0; i < contactsDataObj.contatos.length; i++)
    {
    	if(contactsDataObj.contatos[i].contato.tipo == "J" )
    	{
	    	contact = new BlingContact();
	    	contact.id = contactsDataObj.contatos[i].contato.id;
	    	contact.tipo = contactsDataObj.contatos[i].contato.tipo;

	    	contact.nome = contactsDataObj.contatos[i].contato.nome;
	    	contact.fantasia = contactsDataObj.contatos[i].contato.fantasia;
	    	contact.email = contactsDataObj.contatos[i].contato.email;
	    	contact.cnpj = contactsDataObj.contatos[i].contato.cnpj;
	    	contact.fone = contactsDataObj.contatos[i].contato.fone;
	    	contact.bairro = contactsDataObj.contatos[i].contato.bairro;
	    	contact.endereco = contactsDataObj.contatos[i].contato.endereco;
	    	contact.numero = contactsDataObj.contatos[i].contato.numero;
	    	contact.complemento = contactsDataObj.contatos[i].contato.complemento;
	    	contact.cep = contactsDataObj.contatos[i].contato.cep;
	    	contact.uf = contactsDataObj.contatos[i].contato.uf;
	    	contact.cidade = contactsDataObj.contatos[i].contato.cidade;
	    	contact.situacao = contactsDataObj.contatos[i].contato.situacao;
	    	blingContacts.push(contact);   
    	}

    }

    return blingContacts;
}

/**
 * log Bling Contacts Array into console
 * @param BlingContacts Array
 */
function logBlingContact(blingContacts)
{
  for(i=0; i< blingContacts.length; i++)
  {
  	//console.log(i); 	
  	console.log("id: "+blingContacts[i].id);
  	console.log("nome: "+blingContacts[i].nome);
  	console.log("tipo: "+blingContacts[i].tipo );
  	console.log("fantasia: "+blingContacts[i].fantasia);
  	console.log("email: "+blingContacts[i].email);
  	console.log("cnpj: "+blingContacts[i].cnpj);
  	console.log("telefone: "+blingContacts[i].fone); 
  	console.log("bairro: "+blingContacts[i].bairro);
  	console.log("rua: "+blingContacts[i].endereco);
  	console.log("numero: "+blingContacts[i].numero);
  	console.log("complemento end: "+blingContacts[i].complemento); 
  	console.log("cep: "+blingContacts[i].cep);
  	console.log("estado: "+blingContacts[i].uf );
  	console.log("cidade: "+blingContacts[i].cidade );
  }
}

/**
 * Transform Array of contacts from Agendor and Bling into 
 * Array of AgendorContacts to be inserted into Bling  - window.contactsFromAgendorNotInBling
 * Array of BlingContacts to be inserted into Agendor - window.contactsFromBlingNotInAgendor
 * Array of AgendorContacts that have conflit info with Bling contacts - window.contactsWithConflitAgendor
 * Array of BlingContacts that have conflit info with Agendor contacts - window.contactsWithConflitBling
 * In the end call function to Display conflict list for the user to solve them
 * 
 * @param fullAgendorContacts - AgendorContacts Array with all contacts obtained from request
 * @param fullBlingContacts - BlingContacts Array with all contacts obtained from request
 */
function buildConflictLists(fullAgendorContacts, fullBlingContacts)
{
	//Array of AgendorContacts that have conflict info with Bling contacts
	var contactsWithConflitAgendor = new Array();
	
	//Array of BlingContacts that have conflict info with Agendor contacts
	var contactsWithConflitBling = new Array();
	
	//copy of fullBlingContacts that will be Array of BlingContacts to be inserted into Agendor
	var contactsFromBlingNotInAgendor = JSON.parse(JSON.stringify(fullBlingContacts));
	
	//copy of fullAgendorContacts that will be Array of AgendorContacts to be inserted into Bling
	var contactsFromAgendorNotInBling = JSON.parse(JSON.stringify(fullAgendorContacts));
	
	//For all pairs of contacts, Agendor - Bling
	for(var i =0; i < fullAgendorContacts.length; i++)
	{
		for(var j =0; j < fullBlingContacts.length; j++)
		{
			//Put Agendor current contact cnpj in the same format as Blings Contatc
			var agendorCnpj = fullAgendorContacts[i].cnpj;
			if(agendorCnpj != null)
			{
				agendorCnpj = agendorCnpj.substr(0,2)+"."+agendorCnpj.substr(2,3)+"."+agendorCnpj.substr(5,3)+"/"+agendorCnpj.substr(8,4)+"-"+agendorCnpj.substr(12,2);
			}
			
			//Check if is the same contact
			if((agendorCnpj == fullBlingContacts[j].cnpj) || (fullAgendorContacts[i].name == fullBlingContacts[j].nome))
			{
				// build boolean to check if there is diferente info disregarding null and ""  
				isDifName = (fullAgendorContacts[i].name != fullBlingContacts[j].nome) && !(fullAgendorContacts[i].name ==  null && fullBlingContacts[j].nome == "");
				isDifLegalName = fullAgendorContacts[i].legalName != fullBlingContacts[j].fantasia && !((fullAgendorContacts[i].legalName ==  null || fullAgendorContacts[i].legalName ==  "null")&& fullBlingContacts[j].fantasia == "");
				isDifStreetName = fullAgendorContacts[i].streetName != fullBlingContacts[j].endereco && (fullAgendorContacts[i].streetName ==  null && fullBlingContacts[j].endereco == "");
				isDifStreetNumber = fullAgendorContacts[i].streetNumber != fullBlingContacts[j].numero && !(fullAgendorContacts[i].streetNumber ==  null && fullBlingContacts[j].numero == "");
				isDifDistrict = fullAgendorContacts[i].district != fullBlingContacts[j].bairro && !(fullAgendorContacts[i].district ==  null && fullBlingContacts[j].bairro == "");
				isDifCity = fullAgendorContacts[i].city != fullBlingContacts[j].cidade && !(fullAgendorContacts[i].city ==  null && fullBlingContacts[j].cidade == "");
				
				//Put CEP in the same format
				var cleanBlingCep = fullBlingContacts[j].cep.replace(/[^0-9]/g,'');
				var agendorCep = fullAgendorContacts[i].postalCode;
				
				isDifCep = agendorCep != cleanBlingCep && !(agendorCep ==  null && fullBlingContacts[j].cep == "");
				isDifState = fullAgendorContacts[i].state != fullBlingContacts[j].uf && !(fullAgendorContacts[i].state ==  null && fullBlingContacts[j].uf == "");
				isDifAddrsInfo = fullAgendorContacts[i].additionalInfo != fullBlingContacts[j].complemento && !(fullAgendorContacts[i].additionalInfo ==  null && fullBlingContacts[j].complemento == "");									
				isDifPhone = fullAgendorContacts[i].mobile != fullBlingContacts[j].fone && !(fullAgendorContacts[i].mobile ==  null && fullBlingContacts[j].fone == "");
				isDifEmail = fullAgendorContacts[i].email != fullBlingContacts[j].email && !(fullAgendorContacts[i].email ==  null && fullBlingContacts[j].email == "");
				
				//bollean not to consider when is a Deleted Contact in Bling
				isDeletedInBling = fullBlingContacts[j].situacao == "E";
				
				//console.log(isDifName +" "+ isDifLegalName +" "+  isDifStreetName +" "+ isDifStreetNumber +" "+ isDifDistrict +" "+ isDifCity +" "+ isDifCep +" "+ isDifState +" "+ isDifAddrsInfo +" "+ isDifPhone +" "+ isDifEmail)
				
				//check if is a conflict, case not, it is the same contact with no conflict
				if(isDifName || isDifLegalName ||  isDifStreetName || isDifStreetNumber || isDifDistrict || isDifCity || isDifCep || isDifState || isDifAddrsInfo || isDifPhone || isDifEmail || isDeletedInBling)
				{
					var agendorContact = fullAgendorContacts[i];
					contactsWithConflitAgendor.push(agendorContact);
					contactsWithConflitBling.push(fullBlingContacts[j]);
				}
				
				// remove contact, that exists in both systems(Agendor and Bling), from "Not in" contacts arrays 
				delete contactsFromAgendorNotInBling[i];
				delete contactsFromBlingNotInAgendor[j];
			}
		}	
	}

	//clean deleted contacts from contactsFromAgendorNotInBling array 
	for(var i = contactsFromAgendorNotInBling.length -1; i >=0 ; i--)
	{
		if(contactsFromAgendorNotInBling[i]== undefined)
		{
			contactsFromAgendorNotInBling.splice(i,1);
		}
	}
	
	//clean deleted contacts from contactsFromBlingNotInAgendor array 
	for(var i = contactsFromBlingNotInAgendor.length -1; i >=0 ; i--)
	{
		if(contactsFromBlingNotInAgendor[i]== undefined)
		{
			contactsFromBlingNotInAgendor.splice(i,1);
		}
	}
	
	//Change top Button to Info about conflicts
	topDivObj = document.getElementById("idTopDiv");
	if(contactsWithConflitAgendor.length > 0)
	{
		topDivObj.replaceChild(document.createTextNode("Solve the Conflicts"),topDivObj.firstChild);
	}
	else
	{
		topDivObj.replaceChild(document.createTextNode("No Conflicts"),topDivObj.firstChild);
	}
	
	//display info about conflicts
	var rowConflicts = document.createElement("div");
	rowConflicts.className = "row";
	document.getElementById("idContInfo").appendChild(rowConflicts);	
	
	var colConflicts = document.createElement("div");
	colConflicts.className = "col text-center";
	rowConflicts.appendChild(colConflicts);
	
	colConflicts.appendChild(document.createTextNode("Number of conflicts = "+ contactsWithConflitAgendor.length));
	
	//display info about contacts not in agendor
	var rowNotInAgendor = document.createElement("div");
	rowNotInAgendor.className = "row";
	document.getElementById("idContInfo").appendChild(rowNotInAgendor);	
	
	var colNotInAgendor = document.createElement("div");
	colNotInAgendor.className = "col text-center";
	rowNotInAgendor.appendChild(colNotInAgendor);
	
	colNotInAgendor.appendChild(document.createTextNode("Number of contacts from Bling to be inserted into Agendor = "+ contactsFromBlingNotInAgendor.length));
	
	//display info about contacts not in Bling
	var rowNotInBling= document.createElement("div");
	rowNotInBling.className = "row";
	document.getElementById("idContInfo").appendChild(rowNotInBling);	
	
	var colNotInBling = document.createElement("div");
	colNotInBling.className = "col text-center";
	rowNotInBling.appendChild(colNotInBling);
	
	colNotInBling.appendChild(document.createTextNode("Number of contacts from Agendor to be inserted into Bling = "+ contactsFromAgendorNotInBling.length));
	
	
	//Window Array of AgendorContacts to be inserted into Bling
	window.contactsFromAgendorNotInBling = contactsFromAgendorNotInBling;
	
	//Window Array of BlingContacts to be inserted into Agendor
	window.contactsFromBlingNotInAgendor = contactsFromBlingNotInAgendor;
	
	//Window Array of AgendorContacts that have conflit info with Bling contacts
	window.contactsWithConflitAgendor = contactsWithConflitAgendor;
	
	//Window Array of BlingContacts that have conflit info with Agendor contacts
	window.contactsWithConflitBling = contactsWithConflitBling;
	
	//Display conflict list for the user to solve them
	displayConflicts(contactsWithConflitAgendor,contactsWithConflitBling);
	
}


/**
 * Display the contacts from Agendor and Bling side by side
 * so that the user can choose which info is the correct 
 * @param contactsWithConflitAgendor
 * @param contactsWithConflitBling
 */
function displayConflicts(contactsWithConflitAgendor,contactsWithConflitBling)
{
	middleDivObj = document.getElementById("idMiddleDiv");
	
	for(var i =0; i< contactsWithConflitAgendor.length; i++)
	{
		var rowConflict = document.createElement("div");
		rowConflict.className = "row";
		middleDivObj.appendChild(rowConflict);
		
		
		//displaying agendor contacts
		var colAgendor = document.createElement("div");
		colAgendor.className = "col-6 no-gutters border rounded mb-4 overflow-hidden flex-md-row shadow-sm  h-md-250";
		rowConflict.appendChild(colAgendor);

		var agendorContact = contactsWithConflitAgendor[i];
		var attributes = Object.getOwnPropertyNames(agendorContact);
		for(var j = 0; j < attributes.length; j++ )
		{
			if(attributes[j] != "id" && attributes[j] != "country" )
			{
				var rowAtt = document.createElement("div");
				rowAtt.className = "row";
				colAgendor.appendChild(rowAtt);	
				
				var colAttName = document.createElement("div");
				colAttName.className = "col-3";
				colAttName.appendChild(document.createTextNode(attributes[j]));
				rowAtt.appendChild(colAttName);
				
				var colAttValue = document.createElement("div");
				colAttValue.className = "col-6";
				attrValue = contactsWithConflitAgendor[i][attributes[j]];
				colAttValue.appendChild(document.createTextNode(attrValue));
				rowAtt.appendChild(colAttValue);
				
				var colSelect = document.createElement("div");
				colSelect.className = "col";
				
				var input = document.createElement("input");
				input.type = "radio";
				input.className = "form-check-input";
				input.setAttribute("name", "R"+i+"-"+j);
				input.setAttribute("value", "A");
				//input.setAttribute("checked", "checked");
				colSelect.appendChild(input); 

				rowAtt.appendChild(colSelect);
			}
		}
			
		//Displaying Bling Contact
		var colBling = document.createElement("div");
		colBling.className = "col-6  no-gutters border rounded mb-4 overflow-hidden flex-md-row shadow-sm  h-md-250";
		rowConflict.appendChild(colBling);
		
		var blingContact = contactsWithConflitBling[i];
		var attributes = Object.getOwnPropertyNames(blingContact);
		for(var j = 0; j < attributes.length-1; j++ )
		{
			if(attributes[j] != "id" && attributes[j] != "tipo")
			{
				var colorRow = ""
				if(contactsWithConflitBling[i].situacao == "E")
				{
					colorRow = "bg-danger";
				}
				var rowAtt = document.createElement("div");
				rowAtt.className = "row "+colorRow;
				colBling.appendChild(rowAtt);
				
				var colSelect = document.createElement("div");
				colSelect.className = "col";
				
				var input = document.createElement("input");
				input.type = "radio";
				input.className = "form-check-input";
				input.setAttribute("name", "R"+i+"-"+j);
				input.setAttribute("value", "B");
				input.setAttribute("checked", "checked");
				colSelect.appendChild(document.createTextNode("-"));
				colSelect.appendChild(input); 
				
				rowAtt.appendChild(colSelect);
				
				var colAttValue = document.createElement("div");
				colAttValue.className = "col-6";
				attrValue = contactsWithConflitBling[i][attributes[j]];
				colAttValue.appendChild(document.createTextNode(attrValue));
				rowAtt.appendChild(colAttValue);
				
				var colAttName = document.createElement("div");
				colAttName.className = "col-3";
				colAttName.appendChild(document.createTextNode(attributes[j]));
				rowAtt.appendChild(colAttName);
				
				
			}
		}
	}
	displayBottomButton();
}

/**
 * Display Button Finish Integration
 * 
 */
function displayBottomButton()
{
	var input = document.createElement("input");
	input.type = "button";
	input.className = "btn btn-primary my-1";
	input.id = "FinishBtnId";
	input.value = "Finish Integration";
	input.addEventListener("click", finishIntegration );
	BottomDivObj = document.getElementById("idBottomDiv");
	BottomDivObj.appendChild(input);
}

/**
 * Begin process of PUT and POST data into systems (Agendor and Bling)
 * 
 */
function finishIntegration()
{
	//Clean screen 
	btnDivObj = document.getElementById("idBottomDiv");
	btnDivObj.replaceChild(document.createTextNode("Wait for Result from Integration"),btnDivObj.firstChild);
	document.getElementById("idTopCont").style.display = "none";
	document.getElementById("idMiddleCont").style.display = "none";
	document.getElementById("idContInfo").style.display = "none";
	
	//Define if process are finished
	window.finishedPostBling = false;
	window.finishedPostAgendor = false;
	window.finishedPutBling = false;
	window.finishedPutAgendor = false;
	
	//Set as finished if process are not needed
	if(window.contactsFromBlingNotInAgendor.length == 0)
	{
		window.finishedPostAgendor = true;
	}	
	if(window.contactsFromAgendorNotInBling.length == 0)
	{
		window.finishedPostBling = true;
	}
	if(window.contactsWithConflitAgendor.length == 0)
	{
		window.finishedPutAgendor = true;
	}
	if(window.contactsWithConflitBling.length == 0)
	{
		window.finishedPutBling = true;
	}
	
	//If no PUT neither POST are needed go to generation of map
	if(window.finishedPostBling  && window.finishedPostAgendor  && window.finishedPutBling  && window.finishedPutAgendor )
	{
		//Transform top button to Generate Map
		var input = document.createElement("input");
    	input.type = "button";
    	input.className = "btn btn-primary my-1";
    	input.id = "MapBtnId";
    	input.value = "Generate Map";
    	input.addEventListener("click", getDataAgendorForMapping );
    	BottomDivObj = document.getElementById("idBottomDiv");
    	BottomDivObj.replaceChild(input,BottomDivObj.firstChild);
	}
	else
	{
		if(window.contactsFromBlingNotInAgendor.length > 0)
		{
			postContactsIntoAgendor(0);
		}
		if(window.contactsFromAgendorNotInBling.length > 0)
		{
			postContactsIntoBling(0);
		}
		if(window.contactsWithConflitAgendor.length > 0)
		{
			putConflictContacts(0, "A");
		}
		if(window.contactsWithConflitBling.length > 0)
		{
			putConflictContacts(0, "B");
		}
	}
	
}

/**
 * Post contact from array window.contactsFromBlingNotInAgendor into Agendor  
 * @param currentContactIndex - index of contact 
 * @returns
 */
function postContactsIntoAgendor(currentContactIndex)
{
	var contact = window.contactsFromBlingNotInAgendor[currentContactIndex];
	
	//POST request to insert contact into Agendor
	var postRequest = createXMLHttp();
	var apikey = "1a1e9f16-7848-47f6-a7e4-a1aa94f18974";
    const proxyurl = "https://cors-anywhere.herokuapp.com/";
    postRequest.open('POST', proxyurl+"https://api.agendor.com.br/v3/organizations", true);
    postRequest.setRequestHeader("Authorization", "Token "+ apikey);
    
    //is a valid cep, initial value
    var validCep = true;
    
    //Form Data with info from Bling contact mapped into a Agendor Contact 
	var FD  = new FormData();
	FD.append("name", contact.nome);
	FD.append("legalName", contact.fantasia);
	FD.append("contact[email]", contact.email);
	contact.cnpj = contact.cnpj.replace(/[^0-9]/g,'');
	FD.append("cnpj", contact.cnpj);
	contact.fone = contact.fone.replace(/[^0-9]/g,'');
	if(contact.fone != null && contact.fone != "")
	{
		FD.append("contact[mobile]", contact.fone);
	}
	if(contact.bairro != null && contact.bairro != "")
	{
		FD.append("address[district]", contact.bairro);
	}
	if(contact.endereco != null && contact.endereco != "")
	{
		FD.append("address[street_name]", contact.endereco);
	}
	if(contact.numero != null && contact.numero != "")
	{
		 FD.append("address[street_number]", contact.numero );
	}
	if(contact.complemento != null && contact.complemento != "")
	{
		FD.append("address[additional_info]", contact.complemento);
	}
	if(contact.cep != null && contact.cep != "" )
	{
		contact.cep = contact.cep.replace(/[^0-9]/g,'');
		if( contact.cep.length == 8 )
		{
			FD.append("address[postal_code]", contact.cep);
		}
		else
		{
			validCep = false;
		}
	}
	if(contact.uf != null && contact.uf != "")
	{
		FD.append("address[state]", contact.uf);
	}
	if(contact.cidade != null && contact.cidade != "")
	{
		FD.append("address[city]", contact.cidade);
	}

	postRequest.onreadystatechange = function() 
	    {
	        if (postRequest.readyState == 4)
	        {
	        	//Build Alert space in the screen 
	        	var rowAlert = document.createElement("div");
	        	rowAlert.className = "row";
	        	document.getElementById("idContDiv").appendChild(rowAlert);	
				
				var colAlert = document.createElement("div");
				colAlert.className = "col text-center";
				rowAlert.appendChild(colAlert);
				
				var divAlert = document.createElement("div");
				
				//created successfully
	            if (postRequest.status == 201) 
	            {
	            	if(!validCep)
	            	{
	            		//display alert
	            		divAlert.className = "alert alert-danger";
	            		divAlert.appendChild(document.createTextNode("Contact " + contact.nome +" inserted into Agendor with sucess, but one issue, INVALID CEP, no CEP inserted"));
	            	}
	            	else{
	            		//display alert
	            		divAlert.className = "alert alert-success";
	            		divAlert.appendChild(document.createTextNode("Contact " + contact.nome +" inserted into Agendor"));
	            	}

	            }
	            else
            	{
	            	//display alert
	            	divAlert.className = "alert alert-danger";
	            	divAlert.appendChild(document.createTextNode("ERRO insert " + contact.nome +" into Agendor"));
            	}
	            
	            //check if is not finished to post all the array
	            if(currentContactIndex < window.contactsFromBlingNotInAgendor.length -1)
            	{
	            	//Post next contact
            		postContactsIntoAgendor(currentContactIndex+1)
            	}
	            else
	            {
	            	window.finishedPostAgendor = true;
	            }
	            
	        	//If all PUT and POST needed are done
	            if(window.finishedPutBling && window.finishedPutAgendor && window.finishedPostBling && window.finishedPostAgendor)
	            {
	        		//Transform top button to Generate Map
	            	var input = document.createElement("input");
	            	input.type = "button";
	            	input.className = "btn btn-primary my-1";
	            	input.id = "MapBtnId";
	            	input.value = "Generate Map";
	            	input.addEventListener("click", getDataAgendorForMapping );
	            	BottomDivObj = document.getElementById("idBottomDiv");
	            	BottomDivObj.replaceChild(input,BottomDivObj.firstChild);
	            }
	            
	            colAlert.appendChild(divAlert);
	        }
	    }
		
	// Send our FormData object; HTTP headers are set automatically
	postRequest.send(FD);

}

/**
 * Post contact from array contactsFromAgendorNotInBling into Bling  
 * @param currentContactIndex - index of contact 
 * 
 */
function postContactsIntoBling(currentContactIndex)
{

	var contactAgendor = window.contactsFromAgendorNotInBling[currentContactIndex];
	
	//Build xml with info from Agendor contact mapped into a Bling Contact
	contact = new Object();
	contato = new Object();	
	contact.contato = contato;
	contact.contato.nome = contactAgendor.name;
	contact.contato.fantasia = contactAgendor.legalName;
	contact.contato.tipoPessoa = "J";
	contact.contato.contribuinte = 9;
	contact.contato.cpf_cnpj = contactAgendor.cnpj;
	contact.contato.endereco = contactAgendor.streetName;
	contact.contato.numero = contactAgendor.streetNumber
	contact.contato.complemento = contactAgendor.additionalInfo;
	contact.contato.bairro = contactAgendor.district;
	contact.contato.cep = contactAgendor.postalCode;
	contact.contato.cidade = contactAgendor.city;
	contact.contato.fone = contactAgendor.mobile;
	contact.contato.email = contactAgendor.email
	contact.contato.uf = contactAgendor.state;
	var xml = json2xml(contact); 
	
	//POST request to insert contact into Bling
	var postRequest = createXMLHttp();
    const proxyurl = "https://cors-anywhere.herokuapp.com/";    
    var apikey = "2f6e63b56e954b3f536ec3d7c41706fa67b20846168c2b71f753760db4f50ff2a4b1697a";
    postRequest.open('POST', proxyurl+"https://bling.com.br/Api/v2/contato/&apikey="+apikey+"&xml="+xml, true);
    postRequest.setRequestHeader("Authorization", "Token "+ apikey);

    
	postRequest.onreadystatechange = function() 
	    {
	        if (postRequest.readyState == 4)
	        {
	        	//Build Alert space in the screen 
	        	var rowAlert = document.createElement("div");
	        	rowAlert.className = "row";
	        	document.getElementById("idContDiv").appendChild(rowAlert);	
				
				var colAlert = document.createElement("div");
				colAlert.className = "col text-center";
				rowAlert.appendChild(colAlert);
				
				var divAlert = document.createElement("div");
				
				
	            if (postRequest.status == 201) 
	            {
	            	//display alert
            		divAlert.className = "alert alert-success";
            		divAlert.appendChild(document.createTextNode("Contact " + contactAgendor.name +" inserted into Bling"));
	
	            }
	            else
            	{
	            	//display alert
	            	divAlert.className = "alert alert-danger";
	            	divAlert.appendChild(document.createTextNode("ERRO insert " + contactAgendor.name +" into Bling"));
            	}
	            
	            //check if is not finished to post all the array
	            if(currentContactIndex < window.contactsFromAgendorNotInBling.length -1)
            	{
	            	//Post next contact
	            	postContactsIntoBling(currentContactIndex+1)
            	}
	            else
	            {
	            	window.finishedPostBling = true;
	            }
	            
	            if(window.finishedPutBling && window.finishedPutAgendor && window.finishedPostBling && window.finishedPostAgendor)
	            {
	        		//Transform top button to Generate Map
	            	var input = document.createElement("input");
	            	input.type = "button";
	            	input.className = "btn btn-primary my-1";
	            	input.id = "MapBtnId";
	            	input.value = "Generate Map";
	            	input.addEventListener("click", getDataAgendorForMapping );
	            	BottomDivObj = document.getElementById("idBottomDiv");
	            	BottomDivObj.replaceChild(input,BottomDivObj.firstChild);
	            }
	            colAlert.appendChild(divAlert);
	        }
	    }
		
	  // Send our FormData object; HTTP headers are set automatically
	postRequest.send();
	
}

/**
 * Integrated Contact class
 */
function IntegratedContact()
{}

/**
 * From the interface list of conflicts and the user selected contact attributes  
 * build a integrated contact which info will update contacts in Bling and Agendor 
 * 
 * @param i - current index in the array window.contactsWithConflitAgendor or window.contactsWithConflitBling
 * @param system - "A" for Agendor or "B" for Bling
 * @returns
 */
function putConflictContacts(i, system)
{
	//Agendor conflict array has the same length as Bling contact array 
	//and they represent the same contact when index is the same
	
	//get current agendor contact 
	var agendorContact = window.contactsWithConflitAgendor[i];
	
	//get names of agendor contact attributes
	var attributes = Object.getOwnPropertyNames(agendorContact);
	
	//create integrated contact that will have info chosen by user
	var integratedContact = new IntegratedContact();
	
	//start in 2 because such in AgendorContact as in BlingContact it will be disregard first two attributes
	//iterate for each contact attribute to build user choice of integratedContact
	for(var j = 2; j < attributes.length; j++ )
	{
		//interface selectors name 
		var selector = "R"+i+"-"+j;
		
		//"A" if user choose Agendor, "B" if is Bling info
		var systemConflitChoice = document.querySelector('input[name='+selector+']:checked').value;

		//if choice of attribute values is from Bling 
		if(systemConflitChoice == "B")
		{
			//build integratedContact current attribute with user choice of attribute value
			if(j == 2)
			{
				integratedContact.name = window.contactsWithConflitBling[i].nome;
			}
			else if(j == 3)
			{
				integratedContact.legalName = window.contactsWithConflitBling[i].fantasia;
			}
			else if(j == 4)
			{
				integratedContact.email = window.contactsWithConflitBling[i].email;
			}
			else if(j == 5)
			{
				integratedContact.cnpj = window.contactsWithConflitBling[i].cnpj;
			}
			else if(j == 6)
			{
				integratedContact.mobile = window.contactsWithConflitBling[i].fone;
			}
			else if(j == 7)
			{
				integratedContact.district = window.contactsWithConflitBling[i].bairro;
			}
			else if(j == 8)
			{
				integratedContact.streetName = window.contactsWithConflitBling[i].endereco;
			}
			else if(j == 9)
			{
				integratedContact.streetNumber = window.contactsWithConflitBling[i].numero;
			}
			else if(j == 10)
			{
				integratedContact.additionalInfo = window.contactsWithConflitBling[i].complemento;
			}
			else if(j == 11)
			{
				integratedContact.postalCode = window.contactsWithConflitBling[i].cep;
			}
			else if(j == 12)
			{
				integratedContact.state = window.contactsWithConflitBling[i].uf;
			}
			else if(j == 13)
			{
				integratedContact.city = window.contactsWithConflitBling[i].cidade;
			}
		}
		//if choice of attribute values is from Agendor
		else if(systemConflitChoice == "A")
		{
			//build integratedContact current attribute with user choice of attribute value
			if(j == 2)
			{
				integratedContact.name = window.contactsWithConflitAgendor[i].name;
			}
			else if(j == 3)
			{
				integratedContact.legalName = window.contactsWithConflitAgendor[i].legalName;
			}
			else if(j == 4)
			{
				integratedContact.email = window.contactsWithConflitAgendor[i].email;
			}
			else if(j == 5)
			{
				integratedContact.cnpj = window.contactsWithConflitAgendor[i].cnpj;
			}
			else if(j == 6)
			{
				integratedContact.mobile = window.contactsWithConflitAgendor[i].mobile;
			}
			else if(j == 7)
			{
				integratedContact.district = window.contactsWithConflitAgendor[i].district;
			}
			else if(j == 8)
			{
				integratedContact.streetName = window.contactsWithConflitAgendor[i].streetName;
			}
			else if(j == 9)
			{
				integratedContact.streetNumber = window.contactsWithConflitAgendor[i].streetNumber;
			}
			else if(j == 10)
			{
				integratedContact.additionalInfo = window.contactsWithConflitAgendor[i].additionalInfo;
			}
			else if(j == 11)
			{
				integratedContact.postalCode = window.contactsWithConflitAgendor[i].postalCode;
			}
			else if(j == 12)
			{
				integratedContact.state = window.contactsWithConflitAgendor[i].state;
			}
			else if(j == 13)
			{
				integratedContact.city = window.contactsWithConflitAgendor[i].city;
			}		
		}
			
	}
	
	// always keep Bling contact situation, to warn if it is Deleted
	integratedContact.situacao = window.contactsWithConflitBling[i].situacao;

	
	if(system == "A")
	{
		//put integrated contact into agendor
		putIntegratedConflictContactIntoAgendor(i, integratedContact, contactsWithConflitAgendor[i].id);
	}
	else if (system == "B")
	{
		//put integrated contact into bling
		putIntegratedConflictContactIntoBling(i, integratedContact, window.contactsWithConflitBling[i].id)
	}	
}

/**
 * Update contact info in Agendor 
 * 
 * @param i - index of contact in conflict array
 * @param integratedContact - contact with info chosen by user
 * @param id - id of contact in Agendor
 */
function putIntegratedConflictContactIntoAgendor(i, integratedContact, id)
{
	//create PUT request to update contact
	var putRequest = createXMLHttp();
	var FD  = new FormData();
	var apikey = "1a1e9f16-7848-47f6-a7e4-a1aa94f18974";
    const proxyurl = "https://cors-anywhere.herokuapp.com/";
    putRequest.open('PUT', proxyurl+"https://api.agendor.com.br/v3/organizations/"+id, true);
    putRequest.setRequestHeader("Authorization", "Token "+ apikey);

    //is a valid cep, initial value
    var validCep = true;
    
    //Form Data with info from IntegratedContact mapped into a Agendor Contact 
	FD.append("name", integratedContact.name);
	FD.append("legalName", integratedContact.legalName);
	FD.append("contact[email]", integratedContact.email);
	FD.append("cnpj", integratedContact.cnpj);
	if(integratedContact.mobile != null)
	{
		integratedContact.mobile = integratedContact.mobile.replace(/[^0-9]/g,'');
	}
	FD.append("contact[mobile]", integratedContact.mobile);
	FD.append("address[district]", integratedContact.district);
	FD.append("address[street_name]", integratedContact.streetName);
	if(integratedContact.streetNumber != null && integratedContact.streetNumber != "")
	{
		FD.append("address[street_number]", integratedContact.streetNumber);
	}
	if(integratedContact.additionalInfo != null && integratedContact.additionalInfo != "")
	{
		FD.append("address[additional_info]", integratedContact.additionalInfo);
	}
	if(integratedContact.postalCode != null && integratedContact.postalCode != "" )
	{
		integratedContact.postalCode = integratedContact.postalCode.replace(/[^0-9]/g,'');
		if( integratedContact.postalCode.length == 8 )
		{
			FD.append("address[postal_code]", integratedContact.postalCode);
		}
		else
		{
			validCep = false;
		}
	}
	if(integratedContact.state != null && integratedContact.state != "")
	{
		FD.append("address[state]", integratedContact.state);
	}
	if(integratedContact.city != null && integratedContact.city != "")
	{
		FD.append("address[city]", integratedContact.city);
	}

	putRequest.onreadystatechange = function() 
	    {
	        if (putRequest.readyState == 4)
	        {
	        	//Build Alert space in the screen 
	        	var rowAlert = document.createElement("div");
	        	rowAlert.className = "row";
	        	document.getElementById("idContDiv").appendChild(rowAlert);	
				
				var colAlert = document.createElement("div");
				colAlert.className = "col text-center";
				rowAlert.appendChild(colAlert);
				
				var divAlert = document.createElement("div");
				
				
	            if (putRequest.status == 200) 
	            {
	            	if(!validCep)
	            	{
	            		//display alert
	            		divAlert.className = "alert alert-danger";
	            		divAlert.appendChild(document.createTextNode("Contact with conflict " + integratedContact.name +" updated into Agendor with sucess, but one issue, INVALID CEP, no CEP update"));
	            	}
	            	else
	            	{
	            		//display alert
	            		divAlert.className = "alert alert-success";
	            		divAlert.appendChild(document.createTextNode("Contact with conflict " + integratedContact.name +" updated into Agendor with sucess"));
	            	}
	            }
	            else
            	{
	            	//display alert
	            	divAlert.className = "alert alert-danger";
	            	divAlert.appendChild(document.createTextNode("ERRO to update contact with conflict " + integratedContact.name +" into Agendor"));
            	}
	            
	            //check if is not finished to update all the array
	            if(i < window.contactsWithConflitAgendor.length -1)
            	{
	            	//build and PUT next contact
	            	putConflictContacts(i+1, "A");
            	}
	            else
	            {
	            	window.finishedPutAgendor = true;
	            }
	            
	        	//If all PUT and POST needed are done
	            if(window.finishedPutBling && window.finishedPutAgendor && window.finishedPostBling && window.finishedPostAgendor)
	            {
	        		//Transform top button to Generate Map
	            	var input = document.createElement("input");
	            	input.type = "button";
	            	input.className = "btn btn-primary my-1";
	            	input.id = "MapBtnId";
	            	input.value = "Generate Map";
	            	input.addEventListener("click", getDataAgendorForMapping );
	            	BottomDivObj = document.getElementById("idBottomDiv");
	            	BottomDivObj.replaceChild(input,BottomDivObj.firstChild);
	            }
	            
	            colAlert.appendChild(divAlert);
	            
	        }
	    }
		
	// Send our FormData object; HTTP headers are set automatically
	putRequest.send(FD);
}

/**
 * Update contact info in Bling 
 * 
 * @param i - index of contact in conflict array
 * @param integratedContact - contact with info chosen by user
 * @param id - id of contact in Agendor
 */
function putIntegratedConflictContactIntoBling(i, integratedContact, id)
{
	
	//Build xml with info from IntegratedContact mapped into a Bling Contact
	contact = new Object();
	contato = new Object();	
	contact.contato = contato;
	contact.contato.nome = integratedContact.name;
	contact.contato.fantasia = integratedContact.legalName;
	contact.contato.tipoPessoa = "J";
	contact.contato.contribuinte = 9;
	contact.contato.cpf_cnpj = integratedContact.cnpj;
	contact.contato.endereco = integratedContact.streetName;
	contact.contato.numero = integratedContact.streetNumber
	contact.contato.complemento = integratedContact.additionalInfo;
	contact.contato.bairro = integratedContact.district;
	contact.contato.cep = integratedContact.postalCode;
	contact.contato.cidade = integratedContact.city;
	contact.contato.fone = integratedContact.mobile;
	contact.contato.email = integratedContact.email
	contact.contato.uf = integratedContact.state;
	var xml = json2xml(contact); 
	
	//create PUT request to update contact
	var putRequest = createXMLHttp();
    const proxyurl = "https://cors-anywhere.herokuapp.com/";    
    var apikey = "2f6e63b56e954b3f536ec3d7c41706fa67b20846168c2b71f753760db4f50ff2a4b1697a";
    putRequest.open('PUT', proxyurl+"https://bling.com.br/Api/v2/contato/"+id+"&apikey="+apikey+"&xml="+xml, true);
    putRequest.setRequestHeader("Authorization", "Token "+ apikey);

	putRequest.onreadystatechange = function() 
	    {
	        if (putRequest.readyState == 4)
	        {
	        	//Build Alert space in the screen 
	        	var rowAlert = document.createElement("div");
	        	rowAlert.className = "row";
	        	document.getElementById("idContDiv").appendChild(rowAlert);	
				
				var colAlert = document.createElement("div");
				colAlert.className = "col text-center";
				rowAlert.appendChild(colAlert);
				
				var divAlert = document.createElement("div");
				
				
	            if (putRequest.status == 200) 
	            {
	            	//display alert
            		divAlert.className = "alert alert-success";
            		divAlert.appendChild(document.createTextNode("Contact with conflict " + integratedContact.name +" updated into Bling with sucess"));
	
	            }
	            else
            	{
	            	//display alert
	            	divAlert.className = "alert alert-danger";
	            	divAlert.appendChild(document.createTextNode("ERRO to update contact with conflict " + integratedContact.name +" into Bling"));
            	}
	            
	            //check if is not finished to update all the array
	            if(i < window.contactsWithConflitBling.length -1)
            	{
	            	//build and PUT next contact
	            	putConflictContacts(i+1, "B");
            	}
	            else
	            {
	            	window.finishedPutBling = true;
	            }
	            
	        	//If all PUT and POST needed are done
	            if(window.finishedPutBling && window.finishedPutAgendor && window.finishedPostBling && window.finishedPostAgendor)
	            {
	        		//Transform top button to Generate Map
	            	var input = document.createElement("input");
	            	input.type = "button";
	            	input.className = "btn btn-primary my-1";
	            	input.id = "MapBtnId";
	            	input.value = "Generate Map";
	            	input.addEventListener("click", getDataAgendorForMapping );
	            	BottomDivObj = document.getElementById("idBottomDiv");
	            	BottomDivObj.replaceChild(input,BottomDivObj.firstChild);
	            }
	            
	            colAlert.appendChild(divAlert);
	        }
	    }
		

	putRequest.send();
}

/**
 * log Intgrated contact Array into console
 * @param IntegratedContact Array
 */
function logIntegratedContact(integratedContact)
{
  	//console.log("id : "+integratedContact.id);
  	console.log("Nome: " +integratedContact.name);
  	console.log("fantasia: " +integratedContact.legalName);
  	console.log("email: " +integratedContact.email);
  	console.log("cnpj :" +integratedContact.cnpj);
  	console.log("telefone: " +integratedContact.mobile); 
  	//console.log("pais: " +integratedContact.country);
  	console.log("bairro: " +integratedContact.district);
  	console.log("rua: " +integratedContact.streetName);
  	console.log("numero rua: " +integratedContact.streetNumber);
  	console.log("complemento end: " +integratedContact.additionalInfo); 
  	console.log("CEP: " +integratedContact.postalCode);
  	console.log("Estado: " +integratedContact.state );
  	console.log("cidade: " +integratedContact.city );
}


/**
 * Agendor Contact class
 */
function AgendorContact(){
//    "id": 16849571,
//    "name": "NICCRM3",
//    "legalName": null,
//    "email": null,
//    "cnpj": "33333333333333",
//    "contact": {
//        "email": null,
//        "mobile": null,
//    },
//    "address": {
//        "country": "Brasil",
//        "district": "Icaraí",
//        "streetName": "Avenida Jornalista Alberto Francisco Torres",
//        "streetNumber": 21,
//        "additionalInfo": "1101",
//        "postalCode": "24230000",
//        "state": "RJ",
//        "city": "Niterói"
//    },
}

/**
 * Bling Contact Class
 */
function BlingContact(){
//    "contato": {
//        "id": "4806122207",
//        "nome": "REGIANE MERIDA GIAMPERSA",
//        "fantasia": "REGIANE MERIDA GIAMPERSA",
//        "tipo": "F",
//        "cnpj": "203.948.868-52",
//        "endereco": "RUA RENATO RINALDI, 1234",
//        "numero": "",
//        "bairro": "Vila Carr\u00e3o",
//        "cep": "34.260-00",
//        "cidade": "S\u00e3o Paulo",
//        "complemento": "",
//        "uf": "SP",
//        "fone": "(11) 2092-6014",
//        "email": "",
//    }
}


