# Search-Box
A searchbox component for web sites.
Include searchBox.js and searchBox.css in your webpage. Refer index.html to understand how to use or see example below.
Example:

	var data = {
		"Alabama": [32.75041, -86.75026],
        		"Alaska": [64.00028, -150.00027],
	           "Eastern Province": [8.60614, 81.20201],
	           "Federally Administered Tribal Areas": [33.01455, 69.99925],
        		"State of Andhra Pradesh": [15.83333, 79.75],
        		"State of Arunachal Pradesh": [27.06, 93.37],
        		"Wyoming": [43.00024, -107.5009],
        		"Xinjiang Uygur Zizhiqu": [41.5, 85.5],
        		"Yunnan Sheng": [25, 101.5],
	};
	var ctx = {
    	    "name": "I am dummy context"
    	};
	var sb = new SearchBox(
    	data, 
    	function(result, args) {
        		document.getElementById("msgbox").innerHTML = result.d + "<br/>" + JSON.stringify(result.v) + "<br/>" + args.msg + this.name
    	},
    	{
        		"msg": "Hi, "
    	},
    	ctx
     	);
          document.body.appendChild(sb);


'sb' will be html element of SearchBox to be appended on document.
SearchBox constructor accepts following arguments:
1. data => Data should be an object. The keys of the object will be used as set over which the user's provided input in search box will be searched. For a successful search following result object will be sent to callback function
   	result : {
                        start => start index with respect to key in searchbox
                        end => end index with respect to key in searchbox
                        d => key in entry selected
                        v => value corresponding to key selected
            }

2. callback => Callback function to be called after successful search. A result object as mentioned above will be sent as first argument and user provided args will be sent as second argument.

3. args => It is a user provided argument which will be provided to callback function as second argument (along with result of search as first argument).

4. context  => The object which will act as "this" (context) for the callback function.


Events supported:

sb.on(“clear”, function(){
	console.log(“I am empty”);
});

In addition to search event callback provided in constructor, we can also add event handler for search box getting cleared event.
It will be called whenever search box gets clear or empty (contains no text in it)

Note: 
As return value of SearchBox constructor is HTML element we can apply any style on it.
