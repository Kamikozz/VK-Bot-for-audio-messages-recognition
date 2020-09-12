const jsonencoder = require('./json-encoder.js');
const config = require('./credentials.js');

const https = require('https');
const zlib = require('zlib');
const cheerio = require('cheerio');

const swag = {
  lol: function () {
    console.log('lol');
  }
};

const messages = {
  setActivity: function (isUser, userId, isAudio, peerId, groupId, ver) {
    // https://vk.com/dev/messages.setActivity
    // Changes the status of a user as typing in a conversation
    console.log(messages._hashArr);
    const options = {
      method: 'GET',
      hostname: 'vk.com',
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip',
        'Cache-Control': 'no-cache',
        'Connection': 'close',
        'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
        'Host': 'vk.com'
      }
    }
    if (isUser) {
      // Default JSON
      const json = {
        act: 'a_run_method',
        al: 1,
        hash: messages._hashArr['messages.setActivity'],
        method: 'messages.setActivity',
        param_user_id: userId,
        param_type: 'typing',
        param_peer_id: '',
        param_group_id: '',
        param_v: '5.101'
      };

      // Configure JSON with arguments
      if (isAudio) { json.param_type = 'audiomessage'; }
      if (peerId) { json.param_peer_id = peerId; }
      if (groupId) { json.param_group_id = groupId; }
      if (ver) { json.param_v = ver; }

      if (!json.hash) {
        //console.log(1);
        // this._hashArr['messages.setActivity'] = json.hash =
        getDevPage.call(options, json.method, () => {
          json.hash = messages._hashArr[json.method];
          // console.log(options);
          // console.log(json);
          // TODO: call request
          sendReqToDevPage.call(options, json, 'setActivity');
        });
        return;
      }
      //console.log(2);
      // TODO: call request
      sendReqToDevPage.call(options, json, 'setActivity');
    } else {
      // Default JSON
      const json = {
        user_id: userId,
        type: 'typing',
        peer_id: '',
        group_id: '',
        access_token: config.vk_group_api_key,
        v: '5.101'
      };

      // Configure JSON with arguments
      if (isAudio) { json.type = 'audiomessage'; }
      if (peerId) { json.peer_id = peerId; }
      if (groupId) { json.group_id = groupId; }
      if (ver) { json.v = ver; }

      // Configure options
      options.hostname = options.headers['Host'] = 'api.vk.com';
      //options.path = `/method/messages.setActivity?user_id=${json.user_id}&type=${json.type}&peer_id=${json.peer_id}&group_id=${json.group_id}&access_token=${json.access_token}&v=${json.v}`;
      options.path = `/method/messages.setActivity?${jsonencoder.toFormUrlEncoded(json)}`;

      // console.log(options);
      https.get(options, (res) => {
        // console.log(res.statusCode);
        // console.log(res.headers);
        let data = '';
        res.pipe(zlib.createGunzip())
          .on('error', (e) => {
            console.error(e);
          })
          .on('data', (chunk) => {
            data += chunk;
          })
          .on('end', () => {
            errorHandler(messages, 'setActivity', data, {
              response: 1
            });
          });
      }).on('error', (e) => {
        console.error(e);
      });
    }
  },
  send: function (isUser, userId, peerId, message, attachment, replyTo, forwardMessages, stickerId, groupId, keyboard, ver) {
    // https://vk.com/dev/messages.send
    // Send a message
    console.log(messages._hashArr);
    const options = {
      method: 'GET',
      hostname: 'vk.com',
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip',
        'Cache-Control': 'no-cache',
        'Connection': 'close',
        'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
        'Host': 'vk.com'
      }
    }
    if (isUser) {
      // Default JSON
      const json = {
        act: 'a_run_method',
        al: 1,
        hash: messages._hashArr['messages.send'],
        method: 'messages.send',
        param_user_id: userId,
        param_random_id: new Date().valueOf() + Math.random() * 1000000000 | 0,
        param_message: message,
        param_v: '5.101'
      };

      // Configure JSON with arguments
      if (peerId) { json.param_peer_id = peerId; }
      // "https://vk.com/doc136914440_517899413?hash=815be5dff026fcf511"
      // attachment = 'doc136914440_517899413_815be5dff026fcf511'
      if (attachment) { json.param_attachment = attachment; }
      if (replyTo) { json.param_reply_to = replyTo; }
      if (forwardMessages) { json.param_forward_messages = forwardMessages; }
      if (stickerId) { json.param_sticker_id = stickerId; }
      if (groupId) { json.param_group_id = groupId; }
      if (keyboard) { json.param_keyboard = keyboard; }
      if (ver) { json.param_v = ver; }

      if (!json.hash) {
        getDevPage.call(options, json.method, () => {
          json.hash = messages._hashArr[json.method];
          sendReqToDevPage.call(options, json, 'send');
        });
        return;
      }
      sendReqToDevPage.call(options, json, 'send');
    } else {
      // Default JSON
      const json = {
        user_id: userId,
        random_id: new Date().valueOf() + Math.random() * 1000000000 | 0,
        message: message,
        access_token: config.vk_group_api_key,
        v: '5.101'
      };

      // Configure JSON with arguments
      if (peerId) { json.peer_id = peerId; }
      // "https://vk.com/doc136914440_517899413?hash=815be5dff026fcf511"
      // attachment = 'doc136914440_517899413_815be5dff026fcf511'
      if (attachment) { json.attachment = attachment; }
      if (replyTo) { json.reply_to = replyTo; }
      if (forwardMessages) { json.forward_messages = forwardMessages; }
      if (stickerId) { json.sticker_id = stickerId; }
      if (groupId) { json.group_id = groupId; }
      if (keyboard) { json.keyboard = keyboard; }
      if (ver) { json.v = ver; }

      // Configure options
      options.hostname = options.headers['Host'] = 'api.vk.com';
      options.path = `/method/messages.send?${jsonencoder.toFormUrlEncoded(json)}`;

      // console.log(options);
      https.get(options, (res) => {
        // console.log(res.statusCode);
        // console.log(res.headers);
        let data = '';
        res.pipe(zlib.createGunzip())
          .on('error', (e) => {
            console.error(e);
          })
          .on('data', (chunk) => {
            data += chunk;
          })
          .on('end', () => {
            errorHandler(messages, 'send', data, {
              response: 1
            });
          });
      }).on('error', (e) => {
        console.error(e);
      });
    }
  },
  edit: function (isUser, peerId, message, messageId, attachment, keepForwardMessages, keepSnippets, groupId, ver) {
    // https://vk.com/dev/messages.edit
    // Edit a message
    // NOTE: only messages sent during 24 hours can be edited
    console.log(messages._hashArr);
    const options = {
      method: 'GET',
      hostname: 'vk.com',
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip',
        'Cache-Control': 'no-cache',
        'Connection': 'close',
        'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
        'Host': 'vk.com'
      }
    }
    if (isUser) {
      // Default JSON
      const json = {
        act: 'a_run_method',
        al: 1,
        hash: messages._hashArr['messages.edit'],
        method: 'messages.edit',
        param_peer_id: peerId,
        param_message: message,
        param_message_id: messageId,
        param_v: '5.101'
      };

      // Configure JSON with arguments
      if (attachment) { json.param_attachment = attachment; }
      if (keepForwardMessages) { json.param_keep_forward_messages = +keepForwardMessages; }
      if (keepSnippets) { json.param_keep_snippets = +keepSnippets; }
      if (groupId) { json.param_group_id = groupId; }
      if (ver) { json.param_v = ver; }

      if (!json.hash) {
        getDevPage.call(options, json.method, () => {
          json.hash = messages._hashArr[json.method];
          sendReqToDevPage.call(options, json, 'edit');
        });
        return;
      }
      sendReqToDevPage.call(options, json, 'edit');
    } else {
      // Default JSON
      const json = {
        peer_id: peerId,
        message: message,
        message_id: messageId,
        access_token: config.vk_group_api_key,
        v: '5.101'
      };

      // Configure JSON with arguments
      if (attachment) { json.attachment = attachment; }
      if (keepForwardMessages) { json.keep_forward_messages = +keepForwardMessages; }
      if (keepSnippets) { json.keep_snippets = +keepSnippets; }
      if (groupId) { json.group_id = groupId; }
      if (ver) { json.v = ver; }

      // Configure options
      options.hostname = options.headers['Host'] = 'api.vk.com';
      options.path = `/method/messages.edit?${jsonencoder.toFormUrlEncoded(json)}`;

      // console.log(options);
      https.get(options, (res) => {
        // console.log(res.statusCode);
        // console.log(res.headers);
        let data = '';
        res.pipe(zlib.createGunzip())
          .on('error', (e) => {
            console.error(e);
          })
          .on('data', (chunk) => {
            data += chunk;
          })
          .on('end', () => {
            errorHandler(messages, 'edit', data, {
              response: 1
            });
          });
      }).on('error', (e) => {
        console.error(e);
      });
    }
  },
  _hashArr: {
    'messages.setActivity': '',
    'messages.send': '',
    'messages.edit': ''
  }
};

function getDevPage(method, callback) {
  // Configure options for 1st req.
  this.path = `/dev/${method}`;
  this.headers['Cookie'] = config.vk_auth_cookie;

  https.get(this, (res) => {
    // 1. GET https://vk.com/dev/messages.setActivity
    console.log(res.statusCode);
    // console.log(res.headers);
    let data = '';
    res.pipe(zlib.createGunzip())
      .on('error', (e) => {
        console.error(e);
      })
      .on('data', (chunk) => {
        data += chunk;
      })
      .on('end', () => {
        // parse html & get 1571743826:d689acdcb75b37e44e
        messages._hashArr[method] = parseDevPage(data);

        // TODO: CHECK IF NO 302 IS PRESENTED
        // because your login token can be frozen or deleted
        // & you'll be redirected
        if (!messages._hashArr[method]) {
          throw new Error('Parser has returned empty value');
        }
        callback();
      })
  }).on('error', (e) => {
    console.error(e);
  });
}

function parseDevPage(data) {
  // <button id="dev_req_run_btn" class="dev_req_run_btn flat_button button_wide" data-hash="1571743826:d689acdcb75b37e44e" onclick="Dev.methodRun('1571743826:d689acdcb75b37e44e', this);" style="">Run</button>
  const $ = cheerio.load(data);
  return $('button[id=dev_req_run_btn]').attr('data-hash');
}

function sendReqToDevPage(json, apiMethod) {
  // 2. POST https://vk.com/dev
  // content-type: application/x-www-form-urlencoded
  // DATA: act=a_run_method&al=1&hash=1571743826%3Ad689acdcb75b37e44e&method=messages.setActivity&param_type=typing&param_v=5.102
  this.method = 'POST';
  this.path = '/dev';
  this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  this.headers['Cookie'] = config.vk_auth_cookie;
  const req = https.request(this, (res) => {
    // console.log(res.statusCode);
    // console.log(res.headers);
    let data = '';
    res.pipe(zlib.createGunzip()).setEncoding('utf-8')
      .on('error', (e) => {
        console.error(e);
      })
      .on('data', (chunk) => {
        data += chunk;
      })
      .on('end', () => {
        // console.log(data);
        // console.log(jsonencoder.toFormUrlEncoded(json));

        // Get str is like '<!--...'
        // delete first 4 chars & JSON.parse(raw)
        errorHandler('messages', apiMethod, String.raw`${data}`.slice(4), {
          response: 1
        });
      });
  });
  req.on('error', (e) => {
    console.error(e);
  });
  req.write(jsonencoder.toFormUrlEncoded(json));
  req.end();
}

function errorHandler(scope, method, data, model) {
  let parsed, result, isOk = true;
  try {
    parsed = JSON.parse(data);
  } catch (e) {
    if (e.name === 'SyntaxError') {
      console.error(e.message);
    }
  }

  if (parsed['payload']) {
    // IF IT'S USER
    parsed = JSON.parse(parsed['payload'][1]);
  }

  if (model) {
    for (let prop in model) {
      isOk = isOk && (parsed[prop] === model[prop]);
    }
  }

  if (parsed.response && isOk) {
    result = 'OK';
  } else if (parsed.error) {
    result = 'ERROR';
    console.log(parsed.error.error_code,
      parsed.error.error_msg);
  } else if (parsed.response && !isOk) {
    result = 'ERROR';
    console.log(new Error(`VK API error. Check your model object is sent to ${scope}.${method}`));
  } else {
    //console.error(parsed);
    console.log(new Error(`VK API error at ${scope}.${method}`));
  }
  console.log(`${scope}.${method}: ${result}`);
}

// function repeatSetActivity(endTime) {
//   let args = Array.prototype.slice.call(arguments, 1);
//   let timerId = setTimeout(function run() {
//     messages.setActivity.apply(null, args);
//     //messages.setActivity(false, 136914440, true);
//     //messages.setActivity(true, 269607362, true);
//     timerId = setTimeout(run, 4500);
//   }, 4500);

//   setTimeout(() => {
//     clearInterval(timerId);
//   }, endTime);
// }

// (function main() {
//   //repeatSetActivity(1*60000, true, 113147887, true);
//   // Anya
//   //repeatSetActivity(10*60000, true, 269607362, true);
//   // Nastya
//   //repeatSetActivity(10*60000, true, 2947380, true);


//   //messages.setActivity(true, -187361276, true);
//   //messages.setActivity(false, 136914440, true);
//   // messages.setActivity(true, -187361276);
// })()

module.exports = {
  messages,
  swag
};