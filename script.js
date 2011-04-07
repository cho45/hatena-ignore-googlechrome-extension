
D().define(this);
var http = Deferred.http;
function toData (q) { var ret = []; for (var k in q) if (q.hasOwnProperty(k)) { ret.push(encodeURIComponent(k) + "=" + encodeURIComponent(q[k])); } return ret.join("&"); }

function ignoreHatena () {
}

//function blockTwitter (willBlock, cb) {
//    return http.get('http://twitter.com/').
//    next(function (res) {
//        return res.responseText.match(/value='([^']+)' name='authenticity_token'/)[1];
//    }).
//    next(function (authenticity_token) {
//        if (!authenticity_token) throw "Failed to get authenticity_token";
//
//        return loop(willBlock.length, function (i) {
//            var user = willBlock[i];
//            cb('start', user);
//            return http({
//                method: "post",
//                url:'http://api.twitter.com/1/blocks/create.json',
//                data: toData({
//                    screen_name: user,
//                    post_authenticity_token : authenticity_token,
//                    twttr : true
//                }),
//                headers: {
//                    "Content-Type"     : "application/x-www-form-urlencoded",
//                    "X-Requested-With" : "XMLHttpRequest",
//                    "Accept"           : "application/json, text/javascript, */*"
//                }
//            }).
//            next(function (res) {
//                var data;
//                try {
//                    data = JSON.parse(res.responseText);
//                } catch (e) {
//                    alert(res.responseText);
//                    throw "Invalid response";
//                }
//                if (data.name) {
//                    cb('finish', user);
//                }
//            }).
//            wait(1)
//        });
//    });
//}

function getCachedResource (uri, expire, convertfun) {
    var d   = Deferred();
    var key = '_cached:' + uri;
    var v   = {};
    try { v = JSON.parse(localStorage[key] || "{}") || {} } catch (e) { log("parse error: may be uneval bug"); v = {}; }
    d.clear = function () {
        localStorage[key] = "";
        return this;
    };
    if (v.time && v.time > (new Date).getTime() - expire) {
        console.log("Cache Hitted: " + uri);
        next(function () { d.call(v.body); });
    } else {
        console.log("Cache expired; getting... " + uri);
        http.get(uri).next(convertfun).next(function (res) {
            var json = JSON.stringify({time:(new Date).getTime(), body:res});
            localStorage[key] = json;
            console.log("Cached: " + key);
            d.call(res);
        }).
        error(function (e) {
            d.fail(e);
        });
    }
    return d;
}

function getIgnoreIds () {
    return getCachedResource("http://b.hatena.ne.jp/my.name", duration("1 day"), function (req) {
        return JSON.parse(req.responseText).ignores_regex.split("|");
    });
}

Script = {};
Script['background'] = function () {
    chrome.extension.onRequest.addListener(function (req, sender, callback) {
        if (req.action == 'fetchIds') {
            getIgnoreIds().
            next(function (data) {
                callback(data);
            }).
            error(function (e) {
                console.log(e);
            });
        }
    });
};

Script['options'] = function () {
    function showUsers () {
        var parent = $('#members');
        parent.text("読み込み中");

        getIgnoreIds().
        next(function (data) {
            parent.html("");
            $("#info").text(data.length + " users");

            for (var i = 0, len = data.length; i < len; i++) {
                var user = data[i];
                var image  = 'http://www.st-hatena.com/users/' + user.slice(0, 2) + '/' + user + '/profile.gif';
                var link = 'http://b.hatena.ne.jp/' + user + '/';

                $("#tmpl-member").tmpl({
                    link : link,
                    image : image,
                    name : user
                }).appendTo(parent);
            }
        }).
        error(function (e) {
            alert(e);
        });
    }

    $('#refresh').click(function () {
        getIgnoreIds().clear();
        showUsers();
    });

    showUsers();
};

window.onload = function () {
    var title = document.title;
    try {
        Script[title]();
    } catch (e) {
        //alert(e)
        console.log(e);
    }
};
