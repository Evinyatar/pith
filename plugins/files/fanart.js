var fs = require("fs");
var $path = require("path");

module.exports = {
    appliesTo: function(channel, filepath, item) {
        return item.type == 'container';
    },
    get: function findThumbnails(channel, filepath, item, cb) {
        var tbnFile = $path.resolve(filepath, "fanart.jpg");
        fs.exists(tbnFile, function(exists) {
            if(exists) {
                var itemPath = $path.relative(channel.rootDir, tbnFile).split($path.sep).map(encodeURIComponent).join("/");
                item.backdrop = channel.pith.rootPath + "/stream/" + itemPath;
            }
            cb();
        });
    }
}