var gulp = require('gulp');
var ts = require('gulp-typescript');
var proxyMiddleware = require('http-proxy-middleware');
var connectLr = require('connect-livereload');
var express = require('express');
var open = require('open');
var targetDir = ".";
var context = '/services';
var ts = require("gulp-typescript");
var merge = require('merge2');

var options = {
    target: 'http://localhost:8080', // target host
    changeOrigin: true,               // needed for virtual hosted sites
    ws: true,                         // proxy websockets
    pathRewrite: {
        '^/services/' : '/'      // rewrite paths
    },
    proxyTable: {
        'localhost:8000' : 'http://localhost:8080'
    },
    onError : function(err, req, res ) {
        res.end('Something went wrong:' + err);
    }
};

var proxy = proxyMiddleware(context, options);
var tsProject = ts.createProject({
    declaration: true
});

gulp.task('serve', function() {
    express()
        .use( connectLr())
        .use(proxy)
        .use(express.static(targetDir))
        .listen(8000);
    open('http://localhost:' + 8000 + '/');
});

gulp.task('scripts', function() {
    var tsResult = gulp.src('src/*.ts')
        .pipe(tsProject());

    return merge([ // Merge the two output streams, so this task is finished when the IO of both operations is done.
        tsResult.dts.pipe(gulp.dest('release/definitions')),
        tsResult.js.pipe(gulp.dest('release/js'))
    ]);
});

gulp.task('watch', ['scripts', 'serve'], function() {
    gulp.watch('lib/*.ts', ['scripts']);
});