// Coloring console.log()
const clc = require('cli-color');

const https = require('https');
const http = require('http');
const fs = require('fs');
const cheerio = require('cheerio');

const config = require('./credentials.js');

// Predefine stylings for colored console.log()
const err = clc.red.bold;
const warn = clc.yellow;
const n = clc.black.bgBlackBright;
const ok = clc.green;
const info = clc.bgRed;

const server = http.createServer(function (req, res) {
  const ip = req.socket.remoteAddress;
  const port = req.socket.remotePort;
  console.error(
    ok(`Connection established from: `) + n(`${ip}: + ${port}`) +
    ok('. To:') + n(req.url));
  // res.writeHead(200, { 'Content-Type': 'text/plain' });
  let txt = '';
  switch (req.url) {
    case "/test":
      txt = `<div><div>Your IP address is <h4 style="display: inline; color:#FF0000">${ip}</h4></div><div>Your source port is <h4 style="display: inline; color:#FF0000">${port}</h4></div></div>`;
      responseWrapper.call(res, txt, 200, {
        'Content-Type': 'text/html; charset=UTF-8',
        'Content-Length': Buffer.byteLength(txt)
      });
      break;
    case "/callback":
      if (req.method === 'POST') {
        let data = '';
        // Copy Buffer stream to 'data'
        req.on('data', (chunk) => {
          data += chunk;
        });
        req.on('end', () => {
          const type = req.headers['content-type'];
          if (type && type.indexOf('application/json') !== -1) {
            console.error(info('Got: "application/json"'));
            let parsed;
            try {
              parsed = JSON.parse(data);
            } catch (error) {
              if (error.name === 'SyntaxError') {
                console.error(err(error.message));
                responseWrapper.call(res, 'Invalid JSON format', 400);
                return;
              }
            }
            console.log(parsed);

            if (parsed.type && parsed.group_id) {
              if (parsed.group_id === config.vk_group_id) {
                switch (parsed.type) {
                  case 'confirmation':
                    responseWrapper.call(res, config.vk_confirmation_code, 200);
                    return;
                  case 'message_new':
                    responseWrapper.call(res, 'ok', 200);

                    //// Send request to test domen
                    const options = {
                      method: 'GET',
                      hostname: 'm.vk.com',
                      path: '/',
                      //port: process.env.PORT || 5000
                      // headers: {
                      //   'Content-Type': 'application/json',
                      //   'Content-Length': data.length
                      // }
                    }
                    https.get(options, (res) => {
                      console.error(info(res.statusCode));
                      // console.error('headers:', res.headers);
                      let data = '';
                      res.on('data', (chunk) => {
                        data += chunk;
                        //process.stdout.write(chunk);
                      });
                      res.on('end', () => {
                        console.log(data.toString());
                      });
                    }).on('error', (e) => {
                      console.error(err(e.message));
                    });
                    return;
                  case 'auth':
                    responseWrapper.call(res, 'ok', 200);
                    if (!config.vk_auth_cookie) {
                      console.log("Authenticating...");
                      // Cookie must be set by calling this function
                      vkAuth();
                    }
                    //console.log(config);
                    return;
                  case 'auth_clear':
                    responseWrapper.call(res, 'ok', 200);
                    config.vk_auth_cookie = '';
                    return;
                }
              } else {
                responseWrapper.call(res, 'ok', 200);
                console.error(info('Incorrect group_id'));
                return;
              }
            }
          } else {
            console.log(data.toString());
          }
          responseWrapper.call(res, 'ok', 200);
        });
      } else {
        // if not POST
        responseWrapper.call(res, 'Only POST method is allowed', 405);
      }
      break;
    default:
      txt = '<h4>404 Not Found</h4>';
      responseWrapper.call(res, txt, 404, {
        'Content-Type': 'text/html; charset=UTF-8',
        'Content-Length': Buffer.byteLength(txt)
      });
      break;
  }
}).listen(process.env.PORT || 5000);

function responseWrapper(message, statusCode, headers) {
  if (statusCode) {
    headers ?
      this.writeHead(statusCode, headers) : this.writeHead(statusCode);
  }
  if (message) this.write(message);
  this.end();
}

function vkAuth() {
  let hashForm = {
    'act': 'login',
    'role': 'al_frame',
    'expire': '',
    'recaptcha': '',
    'captcha_sid': '',
    'captcha_key': '',
    '_origin': encodeURIComponent('https://vk.com'),
    'ip_h': '',
    'lg_h': '',
    'ul': '',
    'email': encodeURIComponent(config.vk_user_login),
    'pass': encodeURIComponent(config.vk_user_pass)
  };

  const options = {
    method: 'GET',
    hostname: 'vk.com',
    path: '/',
    headers: {
      'Cache-Control': 'no-cache',
      'Connection': 'close',
      'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
      'Host': 'vk.com'
    }
  }
  let resCookies;
  // GET vk.com/ 
  // to get 'ip_h' & 'lg_h' params from HTML <input>
  https.get(options, (res) => {
    console.error(info(res.statusCode));
    console.error('headers:', res.headers);
    resCookies = res.headers['set-cookie'];

    let data = '';
    res.on('data', (chunk) => {
    });
    res.on('end', () => {
      // <input type="hidden" name="ip_h" value="2fca03cc6dd90f8339">
      // <input type="hidden" name="lg_h" value="6c8f2f0e00001a1da2">
      const $ = cheerio.load(data);
      $('form')
        .filter((idx, el) => {
          return el.attribs.id === 'quick_login_form' &&
            el.attribs.method === 'POST';
        })
        .children()
        .map((idx, el) => {
          switch (el.attribs.name) {
            case 'ip_h':
              hashForm.ip_h = encodeURIComponent(el.attribs.value);
              break;
            case 'lg_h':
              hashForm.lg_h = encodeURIComponent(el.attribs.value);
              break;
          }
        });
    });
  })
    .on('error', (e) => {
      console.error(err(e.message));
    })
    .on('close', () => {
      // POST login.vk.com/?act=login
      console.log(resCookies);
      const body = jsonEncode(hashForm);
      const options = {
        method: 'POST',
        hostname: 'login.vk.com',
        path: '/?act=login',
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'close',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': body.length,
          'Cookie': resCookies,
          'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
          'Host': 'login.vk.com'
        }
      }
      console.log(n('Request:'), options, body);
      let locationTo = '';
      const req = https.request(options, (res) => {
        console.error(info(res.statusCode));
        console.error('headers:', res.headers);
        locationTo = new URL(res.headers.location);
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log(data);
        });
      });
      req.on('error', (e) => {
        console.error(e);
      });
      req.write(body);
      req.end();
      req.on('close', () => {
        // GET vk.com/login.php?act=slogin&to=&s=1&__q_hash=3ca3fa6a10ac7a4cb7ae7866c2d0ef60
        // to get first cookies
        const options = {
          method: 'GET',
          hostname: locationTo.host,
          path: locationTo.pathname + locationTo.search,
          headers: {
            'Accept': '*/*',
            'Cache-Control': 'no-cache',
            'Connection': 'close',
            'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
            'Host': 'vk.com'
          }
        }
        https.get(options, (res) => {
          console.error(info(res.statusCode));
          console.error('headers:', res.headers);
          resCookies = res.headers['set-cookie'];

          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            // In response we get javascript file, with function
            // .onLoginDone('/id1231212', {....})
            // find substring between commas 
            // by indexOf + shift=13 & lastIndexOf
            const lengthOnLoginDone = 13;
            locationTo = data.substring(
              data.indexOf('onLoginDone') + lengthOnLoginDone,
              data.lastIndexOf('\', {')
            );
            // Set found substring as 'vk_user_id' path
            config.vk_user_id = locationTo;
            console.log(locationTo);
          });
        })
          .on('error', (e) => {
            console.error(err(e.message));
          })
          .on('close', () => {
            // GET vk.com/id12312321
            // to get the actual page 
            const options = {
              method: 'GET',
              hostname: 'vk.com',
              path: locationTo,
              headers: {
                'Cache-Control': 'no-cache',
                'Connection': 'close',
                'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
                'Host': 'vk.com'
              }
            }
            https.get(options, (res) => {
              console.error(info(res.statusCode));
              console.error('headers:', res.headers);
              // Add new cookies to the existing array of cookies
              resCookies += res.headers['set-cookie'];
              // To prevent reauthorization
              config.vk_auth_cookie = resCookies;

              let data = '';
              res.on('data', (chunk) => {
              });
              res.on('end', () => {
              });
            })
              .on('error', (e) => {
                console.error(err(e.message));
              });
          });
      });
    });
}

function jsonEncode(json) {
  let _arr = [];
  for (item in json) {
    _arr.push(`${item}=${json[item]}`);
  }
  return _arr.join('&');
}
