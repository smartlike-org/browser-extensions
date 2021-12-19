var likeAmount = 0;
var likeStep = 0;
var tabId = "";
var tab = null;
var likesSent = false;
var publisher = "";
var creator = "";
var url = "";
var user = null

function updateSmiley(url) {
  console.log("Loading " + url);
  var _img = document.getElementById("smile");
  var newImg = new Image();
  newImg.onload = function () {
    _img.src = this.src;
  };
  newImg.src = url;
  if (url.length) _img.style.visibility = "visible";
  else _img.style.visibility = "hidden";
}

var updateLikeBar = function (e) {
  if (e.target.children.length) {
    likeAmount = likeStep * e.target.id;
    document.getElementById("pledge").value = likeAmount.toFixed(2);
  }
  for (var s = e.target; s != null; s = s.nextElementSibling) {
    if (s.children.length) s.children[0].style.backgroundColor = "#CFD8DC";
  }
  for (var s = e.target; s != null; s = s.previousElementSibling) {
    if (s.children.length) s.children[0].style.backgroundColor = "#FFD54F";
  }

  var grade = Math.floor((likeAmount * 100) / 3);
  if (likeAmount) {
    updateSmiley("/icons/like/" + grade + ".png");
  } else updateSmiley("/icons/like.png");
};

function onPopupLoad() {

  chrome.storage.local.get("user", function(items) {
    if (!chrome.runtime.error) {
      console.log(items);
      document.getElementById("user_name").innerHTML = items.user.title.length > 0 ? items.user.title : items.user.id
      document.getElementById("balance").innerHTML = Number.parseFloat(items.user.balance).toFixed(2) + " " + items.user.currency
    }
    else {
      document.getElementById("user_name").innerHTML = "login"
      document.getElementById("balance").innerHTML = "0.00 USD"
    }
  })

  var cc = document.getElementById("btLike");
  if (cc != null) {
    document.getElementById("smile").addEventListener(
      "mouseover",
      function (e) {
        likeAmount = likeStep;
        var bars = document.getElementsByClassName("bar");
        bars[0].children[0].style.backgroundColor = "#FFD54F";
        document.getElementById("pledge").value = likeAmount.toFixed(2);
      },
      false
    );

    cc.addEventListener(
      "mouseleave",
      function (e) {
        if (likesSent) return;
        likeAmount = 0;
        var bars = document.getElementsByClassName("bar");
        for (var i = 0; i < bars.length; i++) {
          bars[i].children[0].style.backgroundColor = "#CFD8DC";
        }
      },
      false
    );

    cc.addEventListener(
      "click",
      function (e) {
        if (e.target == document.getElementById("pledge")) return;
        chrome.runtime.sendMessage({
            text: "like",
            payload: {
              target: url,
              amount: likeAmount,
            }
          },
          function (response) {
            if (response) {
              console.log(response);
            } else {}
          }
        );
        window.close();
      },
      false
    );
  }

  document.getElementById("pledge").addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      likeAmount = event.target.value;
      document.getElementById("btLike").click();
    }
  });

  var e = document.getElementById("btPublisherData");
  if (e != null) {
    e.addEventListener(
      "click",
      function (e) {
        var optionsUrl = "https://smartlike.org/channel/";
        if (creator != "") {
          var t = creator.split("{");
          if (t.length < 2) optionsUrl += encodeURIComponent(creator);
          else optionsUrl += encodeURIComponent(t[0]);
        } else optionsUrl += encodeURIComponent(document.getElementById("hostName").innerHTML);
        navigate(optionsUrl)
      },
      false
    );
  }
  e = document.getElementById("smartlike_home");
  if (e != null) {
    e.addEventListener(
      "click",
      function (e) {
        navigate("https://smartlike.org/")
      },
      false
    );
  }

  e = document.getElementById("user_name");
  if (e != null) {
    e.addEventListener(
      "click",
      function (e) {
        navigate("https://smartlike.org/login/?extension=1")
      },
      false
    );
  }

  e = document.getElementById("balance");
  if (e != null) {
    e.addEventListener(
      "click",
      function (e) {
        navigate("https://smartlike.org/donate")
      },
      false
    );
  }


  chrome.tabs.query({
      active: true,
      currentWindow: true
    },
    function (tabs) {
      tabId = tabs[0].id;
      tab = tabs[0];
      console.log(tabId);
      
      chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        url = tabs[0].url;
        document.getElementById("hostName").innerHTML = getHost(url);
      })
    }
  );

  likeStep = 0.01;

  var bars = document.getElementsByClassName("bar");
  for (var i = 0; i < bars.length; i++) {
    bars[i].id = i + 1;
    bars[i].addEventListener("mouseover", updateLikeBar, false);
  }
}

function getHost(url) {
  const parser = new URL(url)
  return parser.hostname
}

function navigate(url) {
  chrome.windows.getLastFocused(function (win) {
    var queryInfo = {
      url: url
    };
    if (!win.incognito) {
      queryInfo.windowId = win.id;
    }
    chrome.tabs.query(queryInfo, function (tabs) {
      if (tabs.length > 0) {
        var tab = tabs[0];
        chrome.windows.update(tab.windowId, {
          focused: true
        });
        chrome.tabs.update(tab.id, {
          active: true
        });
        if (callback) {
          callback(new Page(tab));
        }
      } else {
        chrome.tabs.create({
          url: url
        });
      }
    });
  });
}

document.body.onload = onPopupLoad;