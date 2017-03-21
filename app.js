var http = require("http");
var https = require("https")

const PORT=9000;


http.createServer(function(request, response){


    if (request.method == "POST") {

        var body = "";

        request.on("data", function(data) {

            body += data;

            // Too much POST data, kill the connection!
            if (body.length > 1e6) {
                request.connection.destroy();
            }

        });

        var ids = []

        request.on("end", function() {

            console.log(body);
            ids = JSON.parse(body).map(function(item, index, array) {

                var item_details = "";

                https.get({
                    host: "share.osf.io",
                    method: "GET",
                    port: 443,
                    path: "/api/v2/search/agents/" + item.key
                }, function(resp) {

                    resp.on("data", function(chunk) {
                        if (chunk) {
                            item_details += chunk;
                        }
                        console.log(item_details);
                    });

                    resp.on("end", function() {

                        ids[index] = JSON.parse(item_details)._source;
                        ids[index].number = item.doc_count;

                        if (item.awards) {
                            ids[index].awards = item.awards;
                        }

                        if (ids.some(function(el, index, array) { return el == null; })) {
                            return;
                        }

                        response.end(JSON.stringify(ids));

                    });

                }).on("error", function(e) {

                    console.log("got error: " + e.message);

                });

                return null;

            });

        });

    } else {

        console.log(request);
        response.end("It Works!! Path Hit: " + request.url);

    }


}).listen(PORT, function(){

    console.log("Server listening on: http://localhost:%s", PORT);

});
