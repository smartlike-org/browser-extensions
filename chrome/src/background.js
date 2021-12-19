const defaultThankUMessages = [
  "Thank you!\nYou are awesome!",
  "You helped a lot!\n",
  "Amazing! Thank you!\n",
  "Cool! Thanks.",
  "Wow! That's great! Thanks.\n",
  "Thank you!",
  "Thank you!",
  "You're the man, bro.",
  "Thank you! It's so nice of you!",
  "It's a great help. Thank you!",
  "Good like there! Thanks!",
  "Bullseye! Thanks a lot!",
  "You are on fire! Thank you!",
  "What’s a like among friends? Paying up is voluntary but helps authors to create more good stuff.",
  "Keep them smartlikes rollin’!",
]

const LOGIN_URL = 'https://smartlike.org/login/?extension=1'
const NETWORK = "https://smartlike.org/network"

function arr2hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, "0"))
    .join("")
}

function signHex(message, secret) {
  var seed = blakejs.blake2b(new TextEncoder().encode(secret), undefined).slice(0, 32)
  var keys = nacl.sign.keyPair.fromSeed(seed)
  var sig = nacl.sign(new TextEncoder().encode(message), keys.secretKey)
  return arr2hex(sig.subarray(0, nacl.sign.signatureLength))
}

async function sendLike(pledge, user) {
  pledge.target = pledge.target.replace('//www.', '//')
  pledge.target = pledge.target.replace('//m.', '//')
  pledge.target = pledge.target.replace('//mobile.', '//')

  let tx = {
    kind: "like",
    ts: Math.floor(Date.now() / 1000),
    data: JSON.stringify({
      kind: 0,
      target: pledge.target,
      amount: pledge.amount,
      currency: user.currency,
    })
  }

  const tx_str = JSON.stringify(tx)
  const sig = signHex(tx_str, user.secret)
  const message = {
    jsonrpc: "2.0",
    method: "like",
    id: 1234,
    params: {
      signed_message: {
        sender: user.id,
        signature: sig,
        data: tx_str,
      },
    },
  }

  publisher = ''
  if (pledge.target.indexOf('://') != -1) {
    publisher = getHost(pledge.target)
  } else publisher = pledge.target

  fetch(NETWORK, {
      method: "POST",
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(message)
    })
    .then((res) => {
      console.log(res)
      return res.json()
    })
    .then((res) => {
      console.log(res);
      if (res.status == "ok") {
        icon = "/icons/toast/" + (Math.floor(Math.random() * 8) + 1) + ".png"
        text = defaultThankUMessages[Math.floor(Math.random() * defaultThankUMessages.length)]
      }
      else {
        icon = "/icons/outline_info_black_24dp.png"
        text = res.data
      }
      chrome.notifications.create(
        pledge.target + Date.now(), {
          type: 'basic',
          iconUrl: icon,
          title: publisher,
          message: text,
          silent: true,
        },
        function () {}
      )
    })
    .catch((err) => {
      console.log(err)
      chrome.notifications.create(
        pledge.target + Date.now(), {
          type: 'basic',
          iconUrl: "/icons/outline_info_black_24dp.png",
          title: publisher,
          message: "Failed to connect to network",
          silent: true,
        },
        function () {}
      )
    })
}

chrome.runtime.onMessage.addListener(function (
  msg,
  sender,
  sendResponse
) {
  if (msg.text === 'get_balance') {
  } else if (msg.text === 'like') {

    chrome.storage.local.get("user", function(items) {
      if (!chrome.runtime.error) {
        console.log(items);
        sendLike(msg.payload, items.user)
      }
      else  {
        chrome.storage.local.set({ "pendingCall": msg.payload }, function(){

          chrome.windows.getLastFocused(function (win) {
            var optionsUrl = chrome.extension.getURL(LOGIN_URL)
            var queryInfo = {
              url: optionsUrl,
            }
            if (!win.incognito) {
              queryInfo.windowId = win.id
            }
            chrome.tabs.query(queryInfo, function (tabs) {
              if (tabs.length > 0 && type != 5) {
                var tab = tabs[0]
                chrome.tabs.reload(tab.id)
                chrome.windows.update(tab.windowId, {
                  focused: true,
                })
                chrome.tabs.update(tab.id, {
                  active: true,
                })
                if (callback) {
                  callback(new Page(tab))
                }
              } else {
                chrome.tabs.create({
                  url: LOGIN_URL,
                })
              }
            })
          })
    
        })
      }
    })
  } else {
    if (sendResponse)
      sendResponse({
        rc: 1,
      })
  }
})

chrome.runtime.onMessageExternal.addListener(async function (
  msg,
  sender,
  sendResponse
) {
  console.log("onMessageExternal")
  switch (msg.type) {
    case 'login':
      var user = JSON.parse(msg.data)
      chrome.storage.local.set({"user": user}, function() {
      })
      chrome.storage.local.get("pendingCall", function(items) {
        if (!chrome.runtime.error && "pendingCall" in items) {
          sendLike(items.pendingCall, user)
          chrome.storage.local.set({ "pendingCall": null }, function(){})
        }
      })
      sendResponse({status: "ok"})
      break
    case 'get-account':
      chrome.storage.local.get("user", function(items) {
        if (!chrome.runtime.error) {
          sendResponse(items.user)
        }
      })
      break
  }
  return true
})

function getHost(url) {
  const parser = new URL(url)
  return parser.hostname
}
