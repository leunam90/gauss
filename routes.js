const path = require('path');

module.exports = {
    sdfcli: path.join(path.dirname(require.main.filename), 'sdfcli', '20.1'),
    scripts: path.join(path.dirname(require.main.filename), 'script_type.json'),
    template: path.join(path.dirname(require.main.filename), 'template'),
    objects: path.join(path.dirname(require.main.filename), 'objects'),
    record: path.join(path.dirname(require.main.filename), 'record_type.json'),
    cwd: process.cwd(),
}