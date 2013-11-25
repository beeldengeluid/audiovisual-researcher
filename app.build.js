({
    appDir: "webroot/",
    baseUrl: "js",
    dir: "appdirectory-build",
    paths: {
        jquery: "lib/jquery",
        underscore: "lib/underscore",
        backbone: "lib/backbone",
        bootstrap: "lib/bootstrap",
        raven: "lib/raven-1.0-beta3.min",
        d3: "lib/d3.v3",
        templates: "../templates/",
        text: "text"
    },
    modules: [
        {name: 'app'}
    ],
    shim: {
        d3: {
            exports: 'd3'
        }
    },
    
    preserveLicenseComments: false,
    //optimize: 'none'
})
