const fs = require('fs')
let html = fs.readFileSync('dist/index.html', 'utf-8')
const idx = html.indexOf('<script type="module" crossorigin>')
if (idx === -1) { console.log('script tag not found'); process.exit(1) }
const end = html.indexOf('</script>', idx)
const scriptTag = html.slice(idx, end + 9)
html = html.slice(0, idx) + html.slice(end + 9)
const root = '<div id="root"></div>'
const rootIdx = html.indexOf(root)
if (rootIdx === -1) { console.log('root not found'); process.exit(1) }
html = html.slice(0, rootIdx + root.length) + '\n  ' + scriptTag + html.slice(rootIdx + root.length)
fs.writeFileSync('dist/index.html', html)
console.log('fixed')
