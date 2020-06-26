'use strict';

module.exports = {
    "source": {
        "exclude": [ "node_modules", ".github", "coverage" ],
        "includePattern": ".+\\.js(doc|x)?$"
    },
    "plugins": ["plugins/markdown"]
}