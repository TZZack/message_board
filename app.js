let fs = require('fs'),
    http = require('http'),
    url = require('url'),
    template = require('art-template'),
    readLine = require('readline'),
    moment = require('moment');

// 用文件保存的方式对数据的处理比较麻烦，抛弃
// {name: 'xxx', message: 'xxx', dateTime: 'xxxx-xx-xx'}
// let commentList = [{
//             name: 'admin',
//             message: '网络一线牵，珍惜这段缘',
//             dateTime: '2020-02-16 00:01:00'
//         },
//         {
//             name: 'admin',
//             message: '网络不是非法之地，请谨慎留言',
//             dateTime: '2020-02-16 00:00:00'
//         }
//     ],
//     total = 0; // 记录总数，方便运算

const writeMsg = msg => {
    fs.appendFileSync('./data/comments.dt', '\n' + msg, {
        flag: 'a'
    });
    // total++;
}

const delMsg = index => {
    // todo...
}

const readMsg = (pageSize = 100, pageIndex = 0) => {
    return new Promise((resolve, reject) => {
        let historyLen = pageSize * pageIndex,
            currentLine = 0,
            pageResult = [],
            rl = readLine.createInterface({
                input: fs.createReadStream('./data/comments.dt', {
                    enconding: 'utf8'
                }),
                output: null,
                terminal: false
            });

        rl.on('line', function (line) {
            if (line) {
                currentLine++;
                if (currentLine > historyLen) {
                    pageResult.unshift(JSON.parse(line));
                } else if (currentLine > historyLen + pageSize) {
                    return rl.close();
                }
            }
        }).on('close', function () {
            resolve(pageResult);
        }).on('error', reject);
    })
}

// const readMsgEasier = (pageSize = 100, pageIndex = 0) => {
//     let commentList = fs.readFileSync('./data/comments.dt', 'utf8').split('\n');
//     commentList.splice(0, pageSize * pageIndex);
//     commentList.splice(pageSize);

//     return commentList;
// }

http.createServer((req, res) => {
    let urlObj = url.parse(req.url, true),
        query = urlObj.query,
        pathname = urlObj.pathname;

    // 访问首页
    if (pathname === '/') {
        fs.readFile('./view/index.html', async (err, data) => {
            if (err) {
                return res.end('404 Not Found');
            }

            let commentList = await readMsg(query.size, query.idx);

            res.end(template.render(data.toString(), {
                commentList
            }));
        });
        console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}][${req.socket.remoteAddress}]: access 'index.html'`);
    } else if (pathname.indexOf('/public') === 0) {
        fs.readFile('.' + pathname, (err, data) => {
            if (err) {
                return res.end('404 Not Found');
            }
            res.end(data);
        });
    } else if (pathname === '/post') {
        fs.readFile('./view/post.html', (err, data) => {
            if (err) {
                return res.end('404 Not Found');
            }
            res.end(data);
        });

        // aciton：发表
    } else if (pathname === '/action_post') {
        let commentObj = query;
        commentObj.dateTime = moment().format('YYYY-MM-DD hh:mm:ss');
        
        writeMsg(JSON.stringify(commentObj));
        
        res.statusCode = 302;
        res.setHeader('Location', '/');
        res.end();

        console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}][${req.socket.remoteAddress}]: access 'index.html'`);
    } else if (pathname === '/favicon.ico') {
        fs.readFile('./favicon.ico', (err, data) => {
            if (err) {
                return res.end('404 Not Found');
            }
            res.end(data);
        });
    } else {
        fs.readFile('./view/error.html', (err, data) => {
            if (err) {
                return res.end('<h1>404 Not Found</h1>');
            }
            res.end(data);
        });
    }
}).listen(3000, () => {
    console.log('Server running...');
});