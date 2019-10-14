const https = require('https');
const http = require('http');
const fs = require('fs');

const config = require('./credentials.json');

const server = http.createServer(function (req, res) {
  const ip = req.socket.remoteAddress;
  const port = req.socket.remotePort;
  console.error(
    `Connection established from: ${ip}:${port}. To:${req.url}`);
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
            console.error('Got: "application/json"');
            let parsed;
            try {
              parsed = JSON.parse(data);
            } catch (error) {
              if (error.name === 'SyntaxError') {
                console.error(error.message);
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
                      console.error(res.statusCode);
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
                      console.error(e.message);
                    });
                    return;
                }
              } else {
                responseWrapper.call(res, 'ok', 200);
                console.error('Incorrect group_id');
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
