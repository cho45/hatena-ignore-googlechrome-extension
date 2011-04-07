
D().define(this);
var http = Deferred.http;

$E = createElementFromString;

chrome.extension.sendRequest({'action' : 'fetchIds'}, function (ignore_users) {
    function isIgnored (id) {
        return (" " + ignore_users.join(" ") + " ").indexOf(" " + id + " ") != -1;
    }

    if (location.hostname == 'h1beta.hatena.ne.jp' || location.hostname == 'h.hatena.ne.jp') {
        var hide_entries = function () {
            $X(".//div[@class='entry'][contains(' id:" + ignore_users.join(" id:") + " ', concat(' ', .//span[@class='username']/a/@title,' '))]", Array).forEach(function (e) {
                e.parentNode.removeChild(e);
            });
        };
        hide_entries();

        window.addEventListener('scroll', hide_entries, false);
    }

    // ダイアリを 404 に
    if (location.hostname == "d.hatena.ne.jp") {
        var id = location.pathname.split("/")[1];
        if (isIgnored(id)) {
            document.documentElement.innerHTML = "";
            return xhttp.get("http://d.hatena.ne.jp/hatena404/").next(function (req) {
                document.documentElement.innerHTML = req.responseText;
            });
        }
    }

    // 人力検索のコメントを非表示に
    if (location.hostname == "q.hatena.ne.jp") {
        $X(".//div[a[contains('/" + ignore_users.join("/") + "', @href)]] | .//div[a[contains('/" + ignore_users.join("/") + "', @href)]]/following-sibling::div[1]", document.body, Array).forEach(function (e) {
            e.parentNode.removeChild(e);
        });
    }

    // 該当ユーザがつけたはてなスターを非表示に
    var selector = "img[alt='" + ignore_users.join("'].hatena-star-star ,\nimg[alt='") + "'].hatena-star-star";
    $E(
        [
            "<style type='text/css'>",
                "#{selector} {",
                    "display: none !important",
                "}",
            "</style>"
        ].join("\n"), {
            parent: document.getElementsByTagName('head')[0],
            data : {
                selector: selector
            }
        }
    );

    return null;
});

