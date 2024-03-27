const fs = require('fs');
const path = require('path');
const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
var browser = undefined;

const exp = path.join(__dirname, 'export');
try { fs.mkdirSync(exp); } catch {}
app.use(express.static(exp));

async function page2pdf(url) {
    const start = Date.now();
    const file = path.join(exp, `${start}.pdf`);
    const page = await browser.newPage();
    await page.goto(url);
    await page.pdf({
        printBackground: false,
        path: file,
        margin: { top: 0, bottom: 0 },
        format: 'A4'
    });
    await page.close();
    const stat = fs.statSync(file);
    const end = Date.now();
    return {
        from: url,
        vist: `http://127.0.0.1:3000/${start}.pdf`,
        file: file,
        size: `${Math.ceil(stat.size / 1024)}KB`,
        start: start,
        end: end,
        cost: `${((end - start)/1000.0).toFixed(2)}s`
    };
}

app.use(async function(req, res, next) {
    if (browser === undefined) {
        console.log('launch browser...')
        browser = await puppeteer.launch();
        console.log(browser)
    }
    const url = req.query.url;
    if (url) {
        console.log(`req.query.url ${url}`)
        const ret = await page2pdf(url);
        res.json(ret);
    } else {
        next();
    }
});

app.use(function(req, res, next) {
    res.status(404).send('404 Not Found')
});

app.use(function(err, req, res, next) {
    console.log(err)
    res.status(500).send('500 Server Error')
});

const server = require('http').createServer(app)
server.on('error', async function(err) {
    console.log(err);
    await browser.close();
});
server.on('listening', function() {
    console.log('Listening on ' + server.address().port)
});
server.listen(3000);
